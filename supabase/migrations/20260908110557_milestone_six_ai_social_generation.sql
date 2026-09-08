-- Image generations are independently versioned so one creative can be regenerated without rebuilding a month.
create table public.image_generations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  prompt text not null,
  model text not null,
  version integer not null default 1 check(version > 0),
  storage_path text,
  status text not null default 'pending' check(status in ('pending','generating','placeholder','generated','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  unique(content_item_id,version)
);
create index image_generations_client_idx on public.image_generations(client_id,created_at desc);
alter table public.image_generations enable row level security;
create policy "authorized users read image generations" on public.image_generations for select to authenticated using(private.can_access_client(client_id));
create policy "admins manage image generations" on public.image_generations for all to authenticated using(exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id))) with check(exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
grant select,insert,update,delete on public.image_generations to authenticated;

create function private.complete_monthly_social_run(target_run uuid,generated_items jsonb) returns integer language plpgsql security invoker set search_path='' as $$
declare run_client uuid; workflow text; item jsonb; inserted_count integer:=0;
begin
  select r.client_id,j.workflow_key into run_client,workflow from public.automation_runs r join public.automation_jobs j on j.id=r.job_id where r.id=target_run and r.status='running';
  if run_client is null or workflow<>'MONTHLY_SOCIAL' then raise exception 'invalid running monthly social run'; end if;
  if jsonb_typeof(generated_items)<>'array' or jsonb_array_length(generated_items)<>12 then raise exception 'exactly 12 generated items are required'; end if;
  for item in select * from jsonb_array_elements(generated_items) loop
    if coalesce(item->>'topic','')='' or coalesce(item->>'caption','')='' or coalesce(item->>'creative_brief','')='' then raise exception 'generated item is incomplete'; end if;
    insert into public.content_items(client_id,content_kind,month,platform,topic,concept,caption,hashtags,creative_brief,recommended_publish_at,internal_notes,status)
    values(run_client,'social_post',date_trunc('month',(item->>'publish_at')::timestamptz)::date,item->>'platform',item->>'topic',item->>'concept',item->>'caption',item->>'hashtags',item->>'creative_brief',(item->>'publish_at')::timestamptz,'AI generated from verified business knowledge; human review required.','needs_review');
    inserted_count:=inserted_count+1;
  end loop;
  update public.automation_runs set status='succeeded',finished_at=now(),output_reference=jsonb_build_object('content_records',inserted_count,'status','needs_review') where id=target_run;
  return inserted_count;
end $$;
revoke all on function private.complete_monthly_social_run(uuid,jsonb) from public,anon,authenticated;
grant execute on function private.complete_monthly_social_run(uuid,jsonb) to service_role;
