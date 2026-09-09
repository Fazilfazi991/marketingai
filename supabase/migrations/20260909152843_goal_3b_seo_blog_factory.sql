-- Goal 3B: evidence-backed SEO intelligence and human-approved blog production.
-- Public website inspection is deliberately bounded in application code; no crawler secrets live here.

create table public.website_inventory_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  root_url text not null,
  status text not null check (status in ('running','completed','failed')),
  pages_discovered integer not null default 0 check (pages_discovered >= 0),
  pages_inspected integer not null default 0 check (pages_inspected >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  created_by uuid references public.profiles(id),
  constraint website_inventory_run_finished check (
    (status='running' and finished_at is null) or
    (status in ('completed','failed') and finished_at is not null)
  )
);

alter table public.website_inventory_runs enable row level security;
create policy "admins manage website inventory runs" on public.website_inventory_runs
for all to authenticated
using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))
with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
grant select,insert,update,delete on public.website_inventory_runs to authenticated;

alter table public.seo_pages
  add column canonical_url text,
  add column meta_title text,
  add column h1 text,
  add column headings jsonb not null default '[]'::jsonb,
  add column page_type text not null default 'other' check(page_type in ('homepage','service','location','product','blog','about','contact','other')),
  add column content_excerpt text,
  add column status_code integer check(status_code is null or status_code between 100 and 599),
  add column indexable boolean,
  add column content_hash text,
  add column last_inspected_at timestamptz,
  add column inventory_run_id uuid references public.website_inventory_runs(id) on delete set null;

create index seo_pages_inventory_idx on public.seo_pages(client_id,last_inspected_at desc);
create unique index seo_pages_client_canonical_idx on public.seo_pages(client_id,canonical_url) where canonical_url is not null;

create table public.seo_reviews (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  automation_run_id uuid references public.automation_runs(id) on delete set null,
  period_start date not null,
  period_end date not null,
  comparison_start date,
  comparison_end date,
  summary text not null,
  metrics jsonb not null default '{}'::jsonb,
  data_freshness jsonb not null default '{}'::jsonb,
  provider text,
  model text,
  prompt_version text not null default 'seo_intelligence_v1',
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(12,6) not null default 0 check(estimated_cost >= 0),
  duration_ms integer check(duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

alter table public.seo_reviews enable row level security;
create policy "admins manage seo reviews" on public.seo_reviews
for all to authenticated
using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))
with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
grant select,insert,update,delete on public.seo_reviews to authenticated;
create index seo_reviews_client_period_idx on public.seo_reviews(client_id,period_end desc);

alter table public.seo_tasks drop constraint seo_task_status_valid;
alter table public.seo_tasks
  add constraint seo_task_status_valid check(status is null or status in ('open','in_progress','awaiting_review','complete','suggested','reviewed','approved','ready_for_codex','implemented','verified','rejected','issue')),
  add column review_id uuid references public.seo_reviews(id) on delete cascade,
  add column opportunity_type text check(opportunity_type is null or opportunity_type in ('striking_distance','low_ctr','declining','growing','content_gap','internal_link','metadata','conversion','service_support')),
  add column affected_query text,
  add column evidence jsonb not null default '{}'::jsonb,
  add column recommendation text,
  add column expected_impact text,
  add column confidence text check(confidence is null or confidence in ('low','medium','high')),
  add column internal_notes text;

alter table public.content_items drop constraint content_status_valid;
alter table public.content_items add constraint content_status_valid check(status in (
  'idea','generating','needs_review','approved','ready_for_design','poster_created',
  'ready_to_schedule','ready_to_post','scheduled','published','issue',
  'recommended','research_ready','research','topic_selected','brief','draft',
  'internal_review','ready_for_codex','ready_to_publish','rejected'
));
alter table public.content_items
  add column source_opportunity_id uuid references public.seo_tasks(id) on delete set null,
  add column slug text,
  add column research_brief jsonb not null default '{}'::jsonb,
  add column internal_links jsonb not null default '[]'::jsonb,
  add column implementation_package jsonb not null default '{}'::jsonb,
  add column canonical_recommendation text,
  add column featured_image_prompt text,
  add column structured_data_recommendation text;

create unique index blog_client_month_topic_unique on public.content_items(client_id,month,lower(target_keyword)) where content_kind='blog' and target_keyword is not null;
create index seo_tasks_review_priority_idx on public.seo_tasks(review_id,impact,status);

alter table public.automation_jobs drop constraint automation_workflow_key_valid;
alter table public.automation_jobs add constraint automation_workflow_key_valid check(workflow_key in (
  'MONTHLY_SOCIAL','MONTHLY_BLOG','SEO_REVIEW','MONTHLY_REPORT','REFRESH_WEBSITE_INVENTORY','BLOG_FACTORY'
));

insert into public.automation_jobs(organization_id,workflow_key,name,status,configuration)
select o.id,v.workflow_key,v.name,'active',jsonb_build_object('manual_trigger',true,'recurring_schedule',false)
from public.organizations o
cross join (values
 ('REFRESH_WEBSITE_INVENTORY','Refresh website inventory'),
 ('BLOG_FACTORY','Evidence-backed blog factory')
) as v(workflow_key,name)
on conflict(organization_id,workflow_key) do update set configuration=excluded.configuration;

-- Client results remain intentionally aggregate-only. Inventory, drafts, prompts,
-- rejected work, Codex packages and technical failures have no client policies.
revoke all on public.website_inventory_runs,public.seo_reviews from anon;
