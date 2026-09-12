-- Supervised Growth Agent workflow. No automatic task/execution triggers.
create table public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  created_by uuid not null references public.profiles(id),
  assigned_user_id uuid references public.profiles(id),
  title text not null,
  kind text not null check (kind in ('question','request')),
  status text not null default 'pending' check (status in ('pending','answered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,client_id)
);
alter table public.client_requests
  add column conversation_id uuid unique references public.agent_conversations(id),
  add column updated_at timestamptz not null default now(),
  add column latest_update text;
-- Legacy request types/statuses remain untouched; all new writes validate the V1 vocabulary.
create table public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id),
  sender_id uuid references public.profiles(id),
  sender_type text not null check(sender_type in ('client','staff','system')),
  body text not null check(length(btrim(body)) between 1 and 4000),
  status text not null default 'saved' check(status in ('saved','pending_team')),
  submission_key uuid,
  created_at timestamptz not null default clock_timestamp(),
  unique(sender_id,submission_key)
);
create table public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.client_requests(id),
  actor_id uuid references public.profiles(id),
  status text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create table public.agent_internal_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id),
  author_id uuid not null references public.profiles(id),
  body text not null check(length(btrim(body)) between 1 and 4000),
  submission_key uuid not null,
  created_at timestamptz not null default now(),
  unique(author_id,submission_key)
);
create index agent_conversations_client_updated on public.agent_conversations(client_id,updated_at desc);
create index agent_conversations_owner on public.agent_conversations(assigned_user_id);
create index agent_messages_thread_created on public.agent_messages(conversation_id,created_at);
create index request_events_request_created on public.request_events(request_id,created_at);
create index agent_notes_thread_created on public.agent_internal_notes(conversation_id,created_at);

-- Private membership lookups avoid policy recursion. No caller-supplied actor.
create function private.agent_client_member(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.client_members m join public.clients c on c.id=m.client_id
 join public.organizations o on o.id=c.organization_id
 where m.client_id=target and m.user_id=auth.uid() and m.role='client'
 and c.deleted_at is null and o.status='active');
$$;
create function private.agent_staff_access(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.agent_conversations v join public.clients c on c.id=v.client_id
 join public.organizations o on o.id=c.organization_id
 join public.organization_members m on m.organization_id=c.organization_id
 where v.id=target and c.deleted_at is null and o.status='active'
 and m.user_id=auth.uid() and m.status='active'
 and (m.role='admin' or (m.role='staff' and v.assigned_user_id=auth.uid())));
$$;
create function private.agent_read(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.agent_conversations v where v.id=target
 and (private.agent_client_member(v.client_id) or private.agent_staff_access(v.id)));
$$;
alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;
alter table public.request_events enable row level security;
alter table public.agent_internal_notes enable row level security;
create policy "agent conversation reader" on public.agent_conversations for select to authenticated using(private.agent_read(id));
create policy "agent message reader" on public.agent_messages for select to authenticated using(private.agent_read(conversation_id));
drop policy if exists "staff read operational rows" on public.client_requests;
create policy "agent request reader" on public.client_requests for select to authenticated using(
 (conversation_id is not null and private.agent_read(conversation_id)) or
 (conversation_id is null and exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))
);
create policy "request event reader" on public.request_events for select to authenticated using(
 exists(select 1 from public.client_requests r where r.id=request_id));
create policy "internal notes staff only" on public.agent_internal_notes for select to authenticated using(private.agent_staff_access(conversation_id));
revoke all on public.agent_conversations,public.agent_messages,public.request_events,public.agent_internal_notes from anon,authenticated;
revoke insert,update,delete on public.client_requests from authenticated;
grant select on public.agent_conversations,public.agent_messages,public.request_events,public.agent_internal_notes,public.client_requests to authenticated;

-- Deterministic, deliberately conservative; staff can correct classification.
create function private.agent_classify(body text) returns text language sql immutable set search_path='' as $$
 select case when lower(body) ~ '(please |can you |could you |i need |i want |we need |we want ).*(add|change|update|create|fix|improve|promote|launch|remove|edit|build|install|optimi[sz]e)'
 or lower(body) ~ '^(add|change|update|create|fix|remove|edit|build|promote)\y' then 'request' else 'question' end;
$$;
create function private.agent_category(body text) returns text language sql immutable set search_path='' as $$
 select case when lower(body) ~ 'seo|keyword' then 'seo' when lower(body) ~ 'whatsapp' then 'whatsapp'
 when lower(body) ~ 'chatbot' then 'chatbot' when lower(body) ~ 'google|search' then 'google_search'
 when lower(body) ~ 'website|page' then 'website' when lower(body) ~ 'traffic|analytic' then 'analytics' else 'general' end;
$$;

-- The private transaction APIs are the only mutation path. Public wrappers are invoker.
create function private.agent_send(p_body text,p_key uuid,p_conversation uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); target uuid; topic public.agent_conversations; saved public.agent_messages; req uuid; classification text;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_key is null or p_body is null or p_body !~ '[^[:space:]]' or length(btrim(p_body)) not between 1 and 4000 then raise exception 'Invalid message' using errcode='22023'; end if;
 -- Serializes retries (including concurrent first sends) without a global lock.
 perform pg_advisory_xact_lock(hashtextextended(actor::text||p_key::text,0));
 select * into saved from public.agent_messages where sender_id=actor and submission_key=p_key;
 if found then
   if saved.body<>btrim(p_body) or (p_conversation is not null and saved.conversation_id<>p_conversation) then raise exception 'Submission key conflict' using errcode='22023'; end if;
   if not private.agent_read(saved.conversation_id) then raise exception 'Access denied' using errcode='42501'; end if;
   return saved.conversation_id;
 end if;
 if p_conversation is null then
   -- Fail closed for ambiguous multi-client accounts; no guessed tenant.
   select min(m.client_id::text)::uuid into target from public.client_members m where m.user_id=actor and private.agent_client_member(m.client_id)
   having count(*)=1;
   if target is null then raise exception 'One active client membership required' using errcode='42501'; end if;
   classification:=private.agent_classify(btrim(p_body));
   insert into public.agent_conversations(client_id,created_by,title,kind) values(target,actor,left(btrim(p_body),100),classification) returning * into topic;
   if classification='request' then
     insert into public.client_requests(client_id,requester_id,request_type,title,description,status,conversation_id,latest_update)
     values(target,actor,private.agent_category(p_body),topic.title,btrim(p_body),'received',topic.id,'Our team will review this and update you here.') returning id into req;
     insert into public.request_events(request_id,actor_id,status,body) values(req,actor,'received','Request received. Our team will review it.');
   end if;
 else
   select * into topic from public.agent_conversations where id=p_conversation for update;
   if not found or not private.agent_client_member(topic.client_id) then raise exception 'Access denied' using errcode='42501'; end if;
 end if;
 insert into public.agent_messages(conversation_id,sender_id,sender_type,body,status,submission_key)
 values(topic.id,actor,'client',btrim(p_body),'pending_team',p_key);
 if p_conversation is null then
   insert into public.agent_messages(conversation_id,sender_type,body) values(topic.id,'system',
    case when topic.kind='request' then 'Request received. Our team will review this and update you here.'
    else 'Your question is saved for our team. Automated answers are not connected in this workspace yet.' end);
 end if;
 update public.agent_conversations set updated_at=now(),status='pending' where id=topic.id;
 return topic.id;
end $$;

create function private.agent_manage(p_conversation uuid,p_action text,p_value text,p_key uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); topic public.agent_conversations; req public.client_requests; org uuid; owner uuid; original text;
begin
 if actor is null or not private.agent_staff_access(p_conversation) then raise exception 'Access denied' using errcode='42501'; end if;
 select * into topic from public.agent_conversations where id=p_conversation for update;
 -- Recheck after row lock: an admin may have reassigned it while waiting.
 if not private.agent_staff_access(p_conversation) then raise exception 'Access denied' using errcode='42501'; end if;
 select organization_id into org from public.clients where id=topic.client_id;
 select * into req from public.client_requests where conversation_id=topic.id;
 if p_action in ('reply','note') then
   if p_key is null or p_value is null or p_value !~ '[^[:space:]]' or length(btrim(p_value)) not between 1 and 4000 then raise exception 'Invalid message' using errcode='22023'; end if;
   perform pg_advisory_xact_lock(hashtextextended(actor::text||p_key::text,0));
   if p_action='reply' then
     if exists(select 1 from public.agent_messages where sender_id=actor and submission_key=p_key and (conversation_id<>topic.id or body<>btrim(p_value))) then raise exception 'Submission key conflict'; end if;
     insert into public.agent_messages(conversation_id,sender_id,sender_type,body,submission_key)
     values(topic.id,actor,'staff',btrim(p_value),p_key) on conflict(sender_id,submission_key) do nothing;
     if not found then return topic.id; end if;
     update public.agent_conversations set status='answered' where id=topic.id;
     update public.agent_messages set status='saved' where conversation_id=topic.id and status='pending_team';
     update public.client_requests set latest_update=btrim(p_value),updated_at=now() where id=req.id;
   else
     if exists(select 1 from public.agent_internal_notes where author_id=actor and submission_key=p_key and (conversation_id<>topic.id or body<>btrim(p_value))) then raise exception 'Submission key conflict'; end if;
     insert into public.agent_internal_notes(conversation_id,author_id,body,submission_key)
     values(topic.id,actor,btrim(p_value),p_key) on conflict(author_id,submission_key) do nothing;
     return topic.id; -- Internal activity never creates client notifications or public timestamps.
   end if;
 elsif p_action='status' then
   if req.id is null or p_value not in ('received','reviewing','in_progress','needs_approval','completed') or p_value is null then raise exception 'Invalid request status' using errcode='22023'; end if;
   if req.status=p_value then return topic.id; end if;
   update public.client_requests set status=p_value,updated_at=now(),latest_update='Status updated to '||replace(p_value,'_',' ') where id=req.id;
   insert into public.request_events(request_id,actor_id,status,body) values(req.id,actor,p_value,'Status updated to '||replace(p_value,'_',' '));
 elsif p_action='assign' then
   if not private.is_org_admin(org) then raise exception 'Only admins assign work' using errcode='42501'; end if;
   owner:=nullif(p_value,'')::uuid;
   if owner is not null and not exists(select 1 from public.organization_members where organization_id=org and user_id=owner and role in ('admin','staff') and status='active') then raise exception 'Invalid owner' using errcode='42501'; end if;
   update public.agent_conversations set assigned_user_id=owner where id=topic.id;
   return topic.id;
 elsif p_action='category' then
   if req.id is null or p_value is null or p_value not in ('website','seo','google_search','whatsapp','chatbot','analytics','general') then raise exception 'Invalid category' using errcode='22023'; end if;
   update public.client_requests set request_type=p_value,updated_at=now() where id=req.id;
 elsif p_action='request' then
   if req.id is not null and topic.kind='request' then return topic.id; end if;
   if req.id is not null then
     update public.client_requests set status='received',updated_at=now(),latest_update='Our team has recorded this as a request.' where id=req.id;
   else
   select body into original from public.agent_messages where conversation_id=topic.id and sender_type='client' order by created_at,id limit 1;
   insert into public.client_requests(client_id,requester_id,request_type,title,description,status,conversation_id,latest_update)
   values(topic.client_id,topic.created_by,private.agent_category(original),topic.title,original,'received',topic.id,'Our team has recorded this as a request.') returning * into req;
   end if;
   update public.agent_conversations set kind='request' where id=topic.id;
   insert into public.request_events(request_id,actor_id,status,body) values(req.id,actor,'received','Our team has recorded this as a request.');
 elsif p_action='question' then
   if topic.kind='question' then return topic.id; end if;
   if req.status not in ('received','reviewing') then raise exception 'Only unstarted requests may be reclassified' using errcode='22023'; end if;
   update public.agent_conversations set kind='question',status='pending' where id=topic.id;
   update public.client_requests set status='cancelled',updated_at=now(),latest_update='Reclassified as a question. No work will be executed from this request.' where id=req.id;
   insert into public.request_events(request_id,actor_id,status,body) values(req.id,actor,'cancelled','Reclassified as a question. The conversation remains available.');
 else raise exception 'Unsupported action' using errcode='22023';
 end if;
 update public.agent_conversations set updated_at=now() where id=topic.id;
 if p_action in ('reply','status','request','question') then
   insert into public.notifications(user_id,title,body)
   select m.user_id,case when p_action='reply' then 'Your growth team replied' else 'Your request was updated' end,
     'Open Ask Agent to view the update.' from public.client_members m where m.client_id=topic.client_id and m.role='client';
 end if;
 return topic.id;
end $$;
create function public.agent_send(p_body text,p_key uuid,p_conversation uuid default null) returns uuid
 language sql security invoker set search_path='' as $$ select private.agent_send(p_body,p_key,p_conversation) $$;
create function public.agent_manage(p_conversation uuid,p_action text,p_value text,p_key uuid) returns uuid
 language sql security invoker set search_path='' as $$ select private.agent_manage(p_conversation,p_action,p_value,p_key) $$;
revoke all on function private.agent_client_member(uuid),private.agent_staff_access(uuid),private.agent_read(uuid),private.agent_classify(text),private.agent_category(text),private.agent_send(text,uuid,uuid),private.agent_manage(uuid,text,text,uuid),public.agent_send(text,uuid,uuid),public.agent_manage(uuid,text,text,uuid) from public,anon;
grant execute on function private.agent_client_member(uuid),private.agent_staff_access(uuid),private.agent_read(uuid),private.agent_send(text,uuid,uuid),private.agent_manage(uuid,text,text,uuid),public.agent_send(text,uuid,uuid),public.agent_manage(uuid,text,text,uuid) to authenticated;

-- Narrow owner-name projection; never grants broad profile visibility.
create function private.agent_owners() returns table(id uuid,name text) language sql stable security definer set search_path='' as $$
 select distinct p.id,p.full_name from public.profiles p join public.organization_members m on m.user_id=p.id
 where auth.uid() is not null and m.role in ('admin','staff') and m.status='active' and private.is_org_admin(m.organization_id);
$$;
create function public.agent_owners() returns table(id uuid,name text) language sql security invoker set search_path='' as $$ select * from private.agent_owners() $$;
revoke all on function private.agent_owners(),public.agent_owners() from public,anon;
grant execute on function private.agent_owners(),public.agent_owners() to authenticated;
