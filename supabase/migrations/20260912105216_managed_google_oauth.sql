-- LOCAL PROPOSAL ONLY. No backfill, property replacement, or token migration.
create table public.google_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  connected_by_profile_id uuid not null references public.profiles(id),
  google_subject text not null,
  account_email text not null,
  encrypted_refresh_token text,
  scopes text[] not null,
  status text not null check(status in ('connected','needs_reconnection','revoking','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,google_subject), unique(id,organization_id),
  -- Google revocation affects the account's grant to this OAuth application, not one DB row.
  -- Never share that grant across organizations. Reuse within the organization is supported.
  unique(google_subject)
);
create table public.google_oauth_states (
  state_hash text primary key,
  user_id uuid not null references public.profiles(id),
  organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id),
  session_hash text not null,
  encrypted_verifier text not null,
  reconnect_id uuid references public.google_connections(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index google_oauth_states_expiry on public.google_oauth_states(expires_at);
alter table public.client_integrations
  add column google_connection_id uuid references public.google_connections(id),
  add column auth_method text not null default 'service_account'
    check(auth_method in ('service_account','google_oauth')),
  add constraint google_connection_method check (
    (auth_method='service_account' and google_connection_id is null) or
    (auth_method='google_oauth' and google_connection_id is not null
      and provider in ('google_analytics','search_console'))
  );
create index client_integrations_google_connection on public.client_integrations(google_connection_id);
alter table public.google_connections enable row level security;
alter table public.google_oauth_states enable row level security;
revoke all on public.google_connections,public.google_oauth_states from public,anon,authenticated;
grant select,insert,update,delete on public.google_connections,public.google_oauth_states to service_role;

-- Prevent a browser Data API write from replacing OAuth mappings with unverified IDs.
-- The privileged application path checks active admin membership before this boundary.
create function private.guard_google_binding() returns trigger
language plpgsql security invoker set search_path='' as $$
declare org uuid;
begin
  if (TG_OP <> 'INSERT' and old.auth_method='google_oauth') or
     (TG_OP <> 'DELETE' and new.auth_method='google_oauth') then
    if current_user not in ('service_role','postgres') then
      raise exception 'Use managed Google integration' using errcode='42501';
    end if;
    if TG_OP <> 'DELETE' then
      select organization_id into org from public.clients where id=new.client_id
        and lifecycle_status='active' and not is_demo and deleted_at is null;
      if org is null or not exists(select 1 from public.google_connections
        where id=new.google_connection_id and organization_id=org) then
        raise exception 'Invalid Google binding' using errcode='42501';
      end if;
    end if;
  end if;
  if TG_OP='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.guard_google_binding() from public,anon,authenticated;
create trigger managed_google_binding_guard before insert or update or delete
on public.client_integrations for each row execute function private.guard_google_binding();

-- One transaction for both property mappings. Lock the shared connection against revocation.
-- No token or account metadata returned; invoker, service-role-only RPC.
create function public.manage_google_binding(
  actor uuid, org uuid, target_client uuid, connection uuid,
  operation text, ga4 text default null, ga4_name text default null, gsc text default null
) returns void language plpgsql security invoker set search_path='' as $$
declare connection_status text;
begin
  if not exists(select 1 from public.organization_members where user_id=actor
      and organization_id=org and role='admin' and status='active') or
    not exists(select 1 from public.clients where id=target_client and organization_id=org
      and lifecycle_status='active' and not is_demo and deleted_at is null) then
    raise exception 'Forbidden' using errcode='42501';
  end if;
  select status into connection_status from public.google_connections
    where id=connection and organization_id=org for update;
  if connection_status is null then raise exception 'Forbidden' using errcode='42501'; end if;
  if operation='disconnect' then
    update public.client_integrations set status='not_connected',next_sync_at=null
      where client_id=target_client and google_connection_id=connection;
  elsif operation='begin_revoke' then
    if exists(select 1 from public.client_integrations where google_connection_id=connection
      and status <> 'not_connected') then
      raise exception 'Disconnect every dependent client first' using errcode='23514';
    end if;
    update public.google_connections set status='revoking',updated_at=now() where id=connection;
  elsif operation='bind' then
    if connection_status<>'connected' or (ga4 is null and gsc is null)
      or (ga4 is not null and ga4 !~ '^[0-9]+$') then
      raise exception 'Invalid selection' using errcode='23514';
    end if;
    insert into public.client_integrations(client_id,provider,status,is_demo,external_reference,
      configuration,auth_method,google_connection_id,next_sync_at)
    values (target_client,'google_analytics',case when ga4 is null then 'not_connected' else 'connected' end,
      false,ga4,jsonb_build_object('propertyId',ga4,'propertyName',ga4_name,'authMethod','google_oauth'),
      'google_oauth',connection,null),
      (target_client,'search_console',case when gsc is null then 'not_connected' else 'connected' end,
      false,gsc,jsonb_build_object('siteUrl',gsc,'authMethod','google_oauth'),'google_oauth',connection,null)
    on conflict(client_id,provider) do update set
      status=excluded.status,external_reference=excluded.external_reference,
      configuration=excluded.configuration,auth_method=excluded.auth_method,
      google_connection_id=excluded.google_connection_id,next_sync_at=null,
      last_sync_status=null,last_sync_error=null;
  else raise exception 'Invalid operation' using errcode='23514'; end if;
end $$;
revoke all on function public.manage_google_binding(uuid,uuid,uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.manage_google_binding(uuid,uuid,uuid,uuid,text,text,text,text) to service_role;

-- Existing historical imports are unchanged. New imports can record honest coverage.
alter table public.data_imports add column coverage jsonb;
