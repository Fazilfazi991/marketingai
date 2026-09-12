-- Run only in a new, schema-only local rehearsal database. All fixtures roll back.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if current_database() not in ('growth1000_oauth_local_20260912','growth1000_oauth_local_20260912_final') or inet_server_addr() <> '127.0.0.1'::inet then
    raise exception 'Refusing non-local OAuth test database';
  end if;
end $$;
insert into auth.users(id,email) values ('70000000-0000-4000-8000-000000000001','oauth-test@example.invalid');
insert into public.profiles(id,full_name) values ('70000000-0000-4000-8000-000000000001','Disposable local OAuth test') on conflict(id) do nothing;
insert into public.organizations(id,name,slug) values
 ('10000000-0000-4000-8000-000000000001','Local OAuth A','local-oauth-a'),
 ('10000000-0000-4000-8000-000000000002','Local OAuth B','local-oauth-b');
insert into public.organization_members(organization_id,user_id,role,status) values
 ('10000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','admin','active');
insert into public.clients(id,organization_id,name,slug,lifecycle_status,is_demo) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Local one','one','active',false),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Local two','two','active',false),
 ('40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Local foreign','foreign','active',false);
insert into public.google_connections(id,organization_id,connected_by_profile_id,google_subject,account_email,encrypted_refresh_token,scopes,status) values
 ('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','local-only','local@example.invalid','not-a-real-token','{}','connected');
set local role service_role;
select public.manage_google_binding('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','bind','123','One','sc-domain:one.example');
select public.manage_google_binding('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001','bind','456','Two','sc-domain:two.example');
do $$ begin
  begin
    perform public.manage_google_binding('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000001','bind','789','Foreign',null);
    raise exception 'Cross-org binding was allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.manage_google_binding('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','begin_revoke');
    raise exception 'Shared revocation was allowed';
  exception when check_violation then null; end;
end $$;
select public.manage_google_binding('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','disconnect');
do $$ begin
  if (select count(*) from public.client_integrations where client_id='40000000-0000-4000-8000-000000000002' and status='connected')<>2 then raise exception 'Disconnect affected other client'; end if;
  if (select status from public.google_connections where id='60000000-0000-4000-8000-000000000001')<>'connected' then raise exception 'Shared token revoked'; end if;
  if (select external_reference from public.client_integrations where client_id='40000000-0000-4000-8000-000000000001' and provider='google_analytics')<>'123' then raise exception 'Reference lost'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000001',true);
do $$ begin
  begin perform 1 from public.google_connections; raise exception 'Token table exposed'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.google_oauth_states; raise exception 'State table exposed'; exception when insufficient_privilege then null; end;
  begin
    perform public.manage_google_binding('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','disconnect');
    raise exception 'Browser RPC exposed';
  exception when insufficient_privilege then null; end;
  begin
    update public.client_integrations set external_reference='forged'
      where client_id='40000000-0000-4000-8000-000000000002';
    raise exception 'Browser could overwrite OAuth mapping';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if has_table_privilege('anon','public.google_connections','SELECT') then raise exception 'Anon token exposure'; end if;
  if not (select relrowsecurity from pg_class where oid='public.google_connections'::regclass) then raise exception 'RLS missing'; end if;
end $$;
select 'PASS: actual PostgreSQL migration, scoped binding, shared disconnect/revocation guard, token/state/RPC grants and RLS' as result;
rollback;
