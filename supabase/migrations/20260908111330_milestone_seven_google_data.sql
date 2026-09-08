create table public.data_imports (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  source text not null check (source in ('google_analytics','search_console')), source_property text not null,
  date_from date not null, date_to date not null check (date_to >= date_from),
  status text not null default 'running' check (status in ('running','completed','failed')), is_demo boolean not null default false,
  raw_response jsonb, row_count integer not null default 0 check (row_count >= 0), error_message text,
  imported_at timestamptz not null default now(), imported_by uuid references public.profiles(id),
  check ((status = 'failed' and error_message is not null) or status <> 'failed')
);
create index data_imports_client_source_idx on public.data_imports(client_id, source, imported_at desc);
alter table public.data_imports enable row level security;
create policy "authorized client imports" on public.data_imports for select to authenticated using (private.can_access_client(client_id));
grant select on public.data_imports, public.analytics_daily, public.search_console_daily to authenticated;
revoke insert, update, delete on public.data_imports from anon, authenticated;
