-- Social operations stays human-controlled: automation may prepare content, but staff performs scheduling/publishing.
alter table public.content_items
  add column scheduled_at timestamptz,
  add column published_at timestamptz,
  add column staff_note text,
  add column scheduled_by uuid references public.profiles(id),
  add column published_by uuid references public.profiles(id),
  add constraint content_status_valid check(status in ('idea','generating','needs_review','approved','ready_to_post','scheduled','published','issue'));

create index content_staff_queue_idx on public.content_items(status,recommended_publish_at) where status in ('ready_to_post','scheduled','issue');

create function private.enforce_social_transition() returns trigger language plpgsql security definer set search_path='' as $$
declare staff_member boolean; admin_member boolean;
begin
  if old.status = new.status then return new; end if;
  select private.is_org_admin(c.organization_id), private.is_org_staff(c.organization_id) into admin_member,staff_member from public.clients c where c.id=old.client_id;
  if not staff_member then raise exception 'not authorized to change content status'; end if;
  if not admin_member and not (old.status in ('ready_to_post','scheduled','issue') and new.status in ('scheduled','published','issue','ready_to_post')) then raise exception 'staff transition not permitted'; end if;
  if new.status='scheduled' then new.scheduled_at=coalesce(new.scheduled_at,now());new.scheduled_by=(select auth.uid());end if;
  if new.status='published' then new.published_at=coalesce(new.published_at,now());new.published_by=(select auth.uid());end if;
  return new;
end $$;
revoke all on function private.enforce_social_transition() from public,anon,authenticated;
create trigger enforce_social_transition before update of status on public.content_items for each row execute function private.enforce_social_transition();

create function private.audit_content_transition() returns trigger language plpgsql security definer set search_path='' as $$
declare org_id uuid;
begin
  if old.status is distinct from new.status then
    select c.organization_id into org_id from public.clients c where c.id=new.client_id;
    insert into public.audit_logs(organization_id,client_id,actor_id,action,entity_type,entity_id,metadata) values(org_id,new.client_id,(select auth.uid()),'content_status_changed','content_item',new.id,jsonb_build_object('from',old.status,'to',new.status));
  end if;
  return new;
end $$;
revoke all on function private.audit_content_transition() from public,anon,authenticated;
create trigger audit_content_transition after update of status on public.content_items for each row execute function private.audit_content_transition();

create policy "clients submit content decisions" on public.content_approvals for insert to authenticated with check (
  reviewer_id=(select auth.uid()) and decision in ('approved','revision_requested') and exists(select 1 from public.content_items i join public.client_members cm on cm.client_id=i.client_id where i.id=content_item_id and cm.user_id=(select auth.uid()))
);
