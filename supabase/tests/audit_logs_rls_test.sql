begin;
select plan(4);

select has_function('private', 'record_client_audit', 'audit trigger function exists');

insert into auth.users(id, email) values
  ('91000000-0000-4000-8000-000000000001', 'audit-admin@example.test'),
  ('91000000-0000-4000-8000-000000000002', 'audit-outsider@example.test');
insert into public.profiles(id, full_name) values
  ('91000000-0000-4000-8000-000000000001', 'Audit Admin'),
  ('91000000-0000-4000-8000-000000000002', 'Audit Outsider');
insert into public.organizations(id, name, slug) values
  ('92000000-0000-4000-8000-000000000001', 'Audit Test Org', 'audit-test-org');
insert into public.organization_members(organization_id, user_id, role) values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'admin');
insert into public.clients(id, organization_id, name, slug) values
  ('93000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', 'Audit Client', 'audit-client');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok(
  $$update public.clients set health_status = 'needs_attention' where id = '93000000-0000-4000-8000-000000000001'$$,
  'an admin can update their client'
);

select results_eq(
  $$select count(*)::bigint from public.audit_logs where client_id = '93000000-0000-4000-8000-000000000001' and action = 'clients.update'$$,
  array[1::bigint],
  'a client update creates one audit event in the same transaction'
);

select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok(
  $$delete from public.audit_logs where client_id = '93000000-0000-4000-8000-000000000001'$$,
  '42501',
  'audit history cannot be deleted through the authenticated API'
);

select * from finish();
rollback;
