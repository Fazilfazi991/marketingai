-- Keep the normalized page-level GA4 schema aligned with the sync payload.
alter table public.analytics_page_daily
  add column if not exists new_users integer not null default 0;
