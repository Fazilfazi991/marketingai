-- Disposable local replay only. Reproduces observed Preview defaults, NOT a migration.
create role supabase_admin nologin;
grant usage on schema public to postgres,anon,authenticated,service_role;
alter default privileges for role postgres in schema public grant all on tables to postgres,anon,authenticated,service_role;
alter default privileges for role postgres in schema public grant all on sequences to postgres,anon,authenticated,service_role;
alter default privileges for role postgres in schema public grant execute on functions to postgres,anon,authenticated,service_role;
alter default privileges for role supabase_admin in schema public grant all on tables to postgres,anon,authenticated,service_role;
alter default privileges for role supabase_admin in schema public grant all on sequences to postgres,anon,authenticated,service_role;
alter default privileges for role supabase_admin in schema public grant execute on functions to postgres,anon,authenticated,service_role;
