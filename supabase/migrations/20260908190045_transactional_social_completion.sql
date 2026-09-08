alter table public.content_items add column automation_run_id uuid references public.automation_runs(id) on delete set null;
create unique index content_items_run_topic_unique on public.content_items(automation_run_id,topic) where automation_run_id is not null;
drop function if exists private.complete_monthly_social_run(uuid,jsonb);

-- Public only so PostgREST can route it; executable solely by the server-only service role.
create function public.complete_monthly_social_run(target_run uuid, generated_items jsonb, provider_name text, model_name text, estimated_cost numeric default 0)
returns integer
language plpgsql
security invoker
set search_path=''
as $$
declare
  run_client uuid;
  run_status text;
  workflow text;
  expected_count integer;
  item jsonb;
  content_id uuid;
  inserted_count integer := 0;
begin
  select r.client_id,r.status,j.workflow_key into run_client,run_status,workflow
  from public.automation_runs r join public.automation_jobs j on j.id=r.job_id
  where r.id=target_run for update of r;
  if run_client is null or workflow<>'MONTHLY_SOCIAL' then raise exception 'invalid monthly social run'; end if;
  if run_status='succeeded' then return (select count(*)::integer from public.content_items where automation_run_id=target_run); end if;
  if run_status<>'running' then raise exception 'monthly social run is not running'; end if;
  expected_count := coalesce((select monthly_quantity from public.client_service_scopes where client_id=run_client and service_key='social_media' and enabled),12);
  if jsonb_typeof(generated_items)<>'array' or jsonb_array_length(generated_items)<>expected_count then raise exception 'generated item count does not match service scope'; end if;
  for item in select * from jsonb_array_elements(generated_items) loop
    if coalesce(item->>'topic','')='' or coalesce(item->>'caption','')='' or coalesce(item->>'creative_brief','')='' or coalesce(item->>'publish_at','')='' then raise exception 'generated item is incomplete'; end if;
    insert into public.content_items(client_id,automation_run_id,content_kind,month,platform,topic,concept,caption,hashtags,creative_brief,recommended_publish_at,internal_notes,status)
    values(run_client,target_run,'social_post',date_trunc('month',(item->>'publish_at')::timestamptz)::date,coalesce(item->>'platform','instagram_facebook'),item->>'topic',item->>'concept',item->>'caption',item->>'hashtags',item->>'creative_brief',(item->>'publish_at')::timestamptz,'AI generated from verified business knowledge; human review required.','needs_review')
    returning id into content_id;
    insert into public.image_generations(client_id,content_item_id,prompt,model,status)
    values(run_client,content_id,item->>'creative_brief',model_name,'placeholder');
    inserted_count := inserted_count+1;
  end loop;
  update public.automation_runs set status='succeeded',finished_at=now(),cost=greatest(estimated_cost,0),provider=provider_name,model=model_name,output_reference=jsonb_build_object('content_records',inserted_count,'status','needs_review','image_mode','placeholder') where id=target_run;
  return inserted_count;
end $$;
revoke all on function public.complete_monthly_social_run(uuid,jsonb,text,text,numeric) from public,anon,authenticated;
grant execute on function public.complete_monthly_social_run(uuid,jsonb,text,text,numeric) to service_role;
