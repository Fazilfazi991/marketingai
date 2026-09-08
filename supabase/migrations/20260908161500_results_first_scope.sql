-- Results-first scope: leads are a durable client-owned record.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null check (source in ('website_form','website_chatbot','whatsapp','manual','instagram','facebook','google_business','phone','other')),
  source_detail text,
  name text,
  phone text,
  email text,
  service text,
  location text,
  message text,
  qualification_summary text,
  lead_quality text not null default 'unqualified' check (lead_quality in ('unqualified','qualified','high_intent','disqualified')),
  status text not null default 'new' check (status in ('new','contacted','qualified','won','lost','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_client_created_idx on public.leads(client_id,created_at desc);
create index leads_client_source_created_idx on public.leads(client_id,source,created_at desc);
alter table public.leads enable row level security;
create policy "authorized users read client leads" on public.leads for select to authenticated using (private.can_access_client(client_id));
create policy "admins manage client leads" on public.leads for all to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
grant select,insert,update,delete on public.leads to authenticated;
