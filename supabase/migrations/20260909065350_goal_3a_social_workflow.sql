-- Goal 3A: grounded social strategy, complete briefs and manual staff production.
create table public.social_monthly_strategies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null check (date_trunc('month', month)::date = month),
  monthly_objective text not null,
  priority_topics jsonb not null default '[]',
  primary_cta text not null,
  content_themes jsonb not null default '[]',
  content_mix jsonb not null default '{}',
  performance_observations jsonb not null default '[]',
  avoid_repeating jsonb not null default '[]',
  prompt_version text not null default 'social_strategy_v1',
  provider text not null,
  model text not null,
  generation_status text not null default 'complete' check (generation_status in ('queued','running','complete','failed')),
  generation_error text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(12,6) not null default 0,
  automation_run_id uuid references public.automation_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, month)
);

alter table public.social_monthly_strategies enable row level security;
create policy "staff read social strategies" on public.social_monthly_strategies for select to authenticated
using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)));
create policy "admins manage social strategies" on public.social_monthly_strategies for all to authenticated
using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))
with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
grant select,insert,update,delete on public.social_monthly_strategies to authenticated;

alter table public.content_items
  add column post_number integer,
  add column objective text,
  add column poster_headline text,
  add column poster_supporting_text text,
  add column cta text,
  add column image_prompt text,
  add column prompt_version text not null default 'post_brief_v1',
  add column caption_prompt_version text not null default 'caption_v1',
  add column poster_prompt_version text not null default 'poster_prompt_v1',
  add column generation_provider text,
  add column generation_model text,
  add column generation_status text not null default 'complete',
  add column generation_error text,
  add column input_tokens integer,
  add column output_tokens integer,
  add column estimated_cost numeric(12,6) not null default 0,
  add column assigned_staff_id uuid references public.profiles(id),
  add column poster_uploaded_at timestamptz,
  add column poster_uploaded_by uuid references public.profiles(id);

alter table public.content_items drop constraint content_status_valid;
alter table public.content_items add constraint content_status_valid check(status in (
  'idea','generating','needs_review','approved','ready_for_design','poster_created',
  'ready_to_schedule','ready_to_post','scheduled','published','issue',
  'research','topic_selected','brief','draft','internal_review','ready_to_publish'
));
alter table public.content_items add constraint social_post_number_valid check(post_number is null or post_number between 1 and 31);
alter table public.automation_runs add column retry_count integer not null default 0 check(retry_count between 0 and 10);

drop policy if exists "staff updates approved content" on public.content_items;
create policy "staff updates social production" on public.content_items for update to authenticated
using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)) and status in ('ready_for_design','poster_created','ready_to_schedule','ready_to_post','scheduled','published','issue'))
with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)) and status in ('ready_for_design','poster_created','ready_to_schedule','ready_to_post','scheduled','published','issue'));

create policy "staff upload client posters" on storage.objects for insert to authenticated
with check (bucket_id='client-assets' and exists(select 1 from public.clients c where c.id=((storage.foldername(name))[1])::uuid and private.is_org_staff(c.organization_id)));
create policy "staff update client posters" on storage.objects for update to authenticated
using (bucket_id='client-assets' and exists(select 1 from public.clients c where c.id=((storage.foldername(name))[1])::uuid and private.is_org_staff(c.organization_id)))
with check (bucket_id='client-assets' and exists(select 1 from public.clients c where c.id=((storage.foldername(name))[1])::uuid and private.is_org_staff(c.organization_id)));
create policy "staff create poster assets" on public.assets for insert to authenticated
with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)) and created_by=(select auth.uid()));
create policy "staff attach poster assets" on public.content_assets for insert to authenticated
with check (exists(select 1 from public.content_items i join public.clients c on c.id=i.client_id where i.id=content_item_id and private.is_org_staff(c.organization_id)));

create index social_strategy_client_month_idx on public.social_monthly_strategies(client_id,month);
create index content_social_production_idx on public.content_items(month,status,assigned_staff_id) where content_kind='social_post';

create or replace function public.complete_monthly_social_run(target_run uuid, generated_items jsonb, provider_name text, model_name text, estimated_cost numeric default 0)
returns integer language plpgsql security invoker set search_path='' as $$
declare run_client uuid; run_status text; workflow text; expected_count integer; item jsonb; content_id uuid; inserted_count integer:=0;
begin
 select r.client_id,r.status,j.workflow_key into run_client,run_status,workflow from public.automation_runs r join public.automation_jobs j on j.id=r.job_id where r.id=target_run for update of r;
 if run_client is null or workflow<>'MONTHLY_SOCIAL' then raise exception 'invalid monthly social run'; end if;
 if run_status='succeeded' then return (select count(*)::integer from public.content_items where automation_run_id=target_run); end if;
 if run_status<>'running' then raise exception 'monthly social run is not running'; end if;
 expected_count:=coalesce((select monthly_quantity from public.client_service_scopes where client_id=run_client and service_key='social_media' and enabled),12);
 if jsonb_typeof(generated_items)<>'array' or jsonb_array_length(generated_items)<>expected_count then raise exception 'generated item count does not match service scope'; end if;
 for item in select * from jsonb_array_elements(generated_items) loop
  if coalesce(item->>'topic','')='' or coalesce(item->>'caption','')='' or coalesce(item->>'imagePrompt','')='' or coalesce(item->>'publish_at','')='' then raise exception 'generated item is incomplete'; end if;
  insert into public.content_items(client_id,automation_run_id,content_kind,month,platform,post_number,topic,objective,poster_headline,poster_supporting_text,concept,caption,cta,hashtags,creative_brief,image_prompt,recommended_publish_at,internal_notes,status,prompt_version,caption_prompt_version,poster_prompt_version,generation_provider,generation_model,generation_status,estimated_cost)
  values(run_client,target_run,'social_post',date_trunc('month',(item->>'publish_at')::timestamptz)::date,coalesce(item->>'platform','Instagram + Facebook'),(item->>'postNumber')::integer,item->>'topic',item->>'objective',item->>'posterHeadline',nullif(item->>'posterSupportingText',''),item->>'concept',item->>'caption',item->>'cta',item->>'hashtags',item->>'creativeBrief',item->>'imagePrompt',(item->>'publish_at')::timestamptz,item->>'internalNotes','needs_review','post_brief_v1','caption_v1','poster_prompt_v1',provider_name,model_name,'complete',greatest(estimated_cost,0)/expected_count)
  returning id into content_id; inserted_count:=inserted_count+1;
 end loop;
 update public.automation_runs set status='succeeded',finished_at=now(),cost=greatest(estimated_cost,0),provider=provider_name,model=model_name,output_reference=jsonb_build_object('content_records',inserted_count,'status','needs_review','image_mode','manual') where id=target_run;
 return inserted_count;
end $$;
