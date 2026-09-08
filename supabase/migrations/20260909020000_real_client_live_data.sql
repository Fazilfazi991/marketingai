-- Goal 2: real-client onboarding, normalized Google snapshots, secure site lead intake.
alter table public.clients
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists contact_whatsapp text,
  add column if not exists website_url text,
  add column if not exists emirate text,
  add column if not exists start_date date not null default current_date;

alter table public.leads
  add column if not exists source_url text,
  add column if not exists referrer text,
  add column if not exists campaign jsonb not null default '{}',
  add column if not exists raw_metadata jsonb not null default '{}';

alter table public.clients drop constraint if exists clients_lifecycle_status_check;
alter table public.clients add constraint clients_lifecycle_status_check
  check (lifecycle_status in ('onboarding','active','paused','needs_attention','archived'));

create unique index if not exists client_members_one_client_per_user_idx on public.client_members(user_id);

alter table public.client_access drop constraint if exists client_access_status_check;
update public.client_access set status=case when status='demo' then 'connected' else 'pending' end
where status not in ('connected','pending','not_required','issue');
alter table public.client_access add constraint client_access_status_check
  check (status in ('connected','pending','not_required','issue'));

alter table public.client_integrations
  add column if not exists configuration jsonb not null default '{}',
  add column if not exists last_sync_status text,
  add column if not exists last_sync_error text,
  add column if not exists last_sync_started_at timestamptz,
  add column if not exists next_sync_at timestamptz;

alter table public.analytics_daily
  add column if not exists users integer not null default 0,
  add column if not exists new_users integer not null default 0,
  add column if not exists sessions integer not null default 0,
  add column if not exists page_views integer not null default 0,
  add column if not exists source text not null default 'google_analytics',
  add column if not exists synced_at timestamptz not null default now();

alter table public.search_console_daily
  add column if not exists clicks integer not null default 0,
  add column if not exists impressions integer not null default 0,
  add column if not exists ctr numeric(12,8) not null default 0,
  add column if not exists average_position numeric(12,4) not null default 0,
  add column if not exists source text not null default 'search_console',
  add column if not exists synced_at timestamptz not null default now();

create table public.analytics_page_daily (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  day date not null,
  page_path text not null,
  users integer not null default 0,
  sessions integer not null default 0,
  page_views integer not null default 0,
  source text not null default 'google_analytics',
  synced_at timestamptz not null default now(),
  unique(client_id,day,page_path)
);

create table public.client_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  site_identifier text not null unique,
  origin text,
  secret_hash text not null,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  last_lead_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analytics_page_daily enable row level security;
alter table public.client_sites enable row level security;

create policy "authorized users read analytics pages" on public.analytics_page_daily for select to authenticated
  using (private.can_access_client(client_id));
create policy "admins manage analytics pages" on public.analytics_page_daily for all to authenticated
  using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))
  with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
create policy "admins manage client sites" on public.client_sites for all to authenticated
  using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))
  with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));

grant select on public.analytics_page_daily to authenticated;
grant select,insert,update,delete on public.client_sites to authenticated;
revoke all on public.client_sites from anon;

create index analytics_daily_client_day_idx on public.analytics_daily(client_id,day);
create index search_console_daily_client_day_idx on public.search_console_daily(client_id,day);
create index analytics_page_daily_client_day_idx on public.analytics_page_daily(client_id,day);
create index client_integrations_sync_idx on public.client_integrations(provider,status,last_synced_at);

-- Existing rows retain their metrics JSON for backwards compatibility while explicit columns
-- become the normalized source used by new syncs and range charts.
update public.analytics_daily set
  users=coalesce((metrics->>'activeUsers')::integer,(metrics->>'users')::integer,0),
  new_users=coalesce((metrics->>'newUsers')::integer,0),
  sessions=coalesce((metrics->>'sessions')::integer,0),
  page_views=coalesce((metrics->>'screenPageViews')::integer,(metrics->>'pageViews')::integer,0)
where users=0 and new_users=0 and sessions=0 and page_views=0;

update public.search_console_daily set
  clicks=coalesce((metrics->>'clicks')::integer,0),
  impressions=coalesce((metrics->>'impressions')::integer,0),
  ctr=coalesce((metrics->>'ctr')::numeric,0),
  average_position=coalesce((metrics->>'position')::numeric,0)
where clicks=0 and impressions=0;

create function public.client_result_health()
returns table(provider text,status text,last_synced_at timestamptz)
language sql stable security definer set search_path='' as $$
  select i.provider,i.status,i.last_synced_at
  from public.client_integrations i
  where exists(select 1 from public.client_members m where m.client_id=i.client_id and m.user_id=(select auth.uid()))
    and i.provider in ('google_analytics','search_console')
$$;
revoke all on function public.client_result_health() from public,anon;
grant execute on function public.client_result_health() to authenticated;
