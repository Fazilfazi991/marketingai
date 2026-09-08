begin;
select plan(8);
insert into auth.users(id,email) values
 ('94000000-0000-4000-8000-000000000001','client-a@example.test'),
 ('94000000-0000-4000-8000-000000000002','client-b@example.test');
insert into public.profiles(id,full_name) values
 ('94000000-0000-4000-8000-000000000001','Client A'),
 ('94000000-0000-4000-8000-000000000002','Client B');
insert into public.organizations(id,name,slug) values('95000000-0000-4000-8000-000000000001','Isolation Org','isolation-org');
insert into public.clients(id,organization_id,name,slug,is_demo) values
 ('96000000-0000-4000-8000-000000000001','95000000-0000-4000-8000-000000000001','Client A','client-a',false),
 ('96000000-0000-4000-8000-000000000002','95000000-0000-4000-8000-000000000001','Client B','client-b',false);
insert into public.client_members(client_id,user_id) values
 ('96000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000001'),
 ('96000000-0000-4000-8000-000000000002','94000000-0000-4000-8000-000000000002');
insert into public.leads(client_id,source,name,status) values
 ('96000000-0000-4000-8000-000000000001','manual','Lead A','new'),
 ('96000000-0000-4000-8000-000000000002','manual','Lead B','new');
insert into public.analytics_daily(client_id,day,metrics,is_demo) values
 ('96000000-0000-4000-8000-000000000001',current_date,'{"users":11}',false),
 ('96000000-0000-4000-8000-000000000002',current_date,'{"users":22}',false);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"94000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select results_eq($$select name from public.clients order by name$$,array['Client A'::text],'Client A sees only its client row');
select results_eq($$select name from public.leads$$,array['Lead A'::text],'Client A sees only its lead');
select results_eq($$select (metrics->>'users')::int from public.analytics_daily$$,array[11],'Client A sees only its analytics');
select results_eq($$select count(*)::bigint from public.client_members$$,array[1::bigint],'Client A sees only its membership');
select set_config('request.jwt.claims','{"sub":"94000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select results_eq($$select name from public.clients order by name$$,array['Client B'::text],'Client B sees only its client row');
select results_eq($$select name from public.leads$$,array['Lead B'::text],'Client B sees only its lead');
select results_eq($$select (metrics->>'users')::int from public.analytics_daily$$,array[22],'Client B sees only its analytics');
select results_eq($$select count(*)::bigint from public.client_members$$,array[1::bigint],'Client B sees only its membership');
select * from finish();
rollback;
