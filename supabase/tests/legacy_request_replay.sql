-- Disposable local database only, starting at canonical pre-Phase-2.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('e0000000-0000-0000-0000-000000000001');
insert into public.profiles(id,full_name) values ('e0000000-0000-0000-0000-000000000001','Synthetic legacy client');
insert into public.organizations(id,name,slug) values ('e0000000-0000-0000-0000-000000000002','Legacy QA','legacy-qa');
insert into public.clients(id,organization_id,name,slug) values ('e0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000002','Legacy QA','legacy-client');
insert into public.client_requests(client_id,requester_id,request_type,title,status,created_at)
select 'e0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000001','old_custom_type','Legacy '||n,case n when 1 then 'received' else 'old_custom_status' end,'2025-01-01'::timestamptz from generate_series(1,2)n;
create temp table before_requests as select * from public.client_requests;
\ir ../migrations/20260911204412_growth_agent_conversations.sql
do $$ begin
if (select count(*) from public.client_requests)<>2 then raise exception 'Legacy rows lost'; end if;
if exists(select 1 from public.client_requests r join before_requests b using(id) where (to_jsonb(r)-'conversation_id'-'updated_at'-'latest_update')<>to_jsonb(b)) then raise exception 'Legacy fields changed';end if;
if exists(select 1 from public.client_requests where conversation_id is not null or latest_update is not null or updated_at is null) then raise exception 'Bad legacy defaults';end if;
if exists(select 1 from public.request_events) then raise exception 'Fabricated history';end if;
if has_table_privilege('authenticated','public.client_requests','UPDATE') then raise exception 'Direct update retained';end if;
raise notice 'PASS: legacy rows, custom values, timestamps preserved; new defaults valid; no fabricated linkage/history; authenticated update revoked';
end $$;
commit;
