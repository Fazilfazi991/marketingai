-- Audit rows from tables whose primary/client identifiers are not structurally
-- identical. Reading through jsonb avoids referencing fields absent from NEW.
create or replace function private.record_client_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := to_jsonb(new);
  target_client uuid;
  target_org uuid;
  target_entity uuid;
  event_metadata jsonb := '{}'::jsonb;
begin
  target_client := case
    when tg_table_name = 'clients' then (row_data ->> 'id')::uuid
    else (row_data ->> 'client_id')::uuid
  end;
  target_entity := coalesce((row_data ->> 'id')::uuid, target_client);
  select c.organization_id into target_org
  from public.clients c where c.id = target_client;

  if tg_table_name = 'client_access' then
    event_metadata := jsonb_build_object('access_type', row_data ->> 'access_type', 'status', row_data ->> 'status');
  elsif tg_table_name = 'client_service_scopes' then
    event_metadata := jsonb_build_object(
      'service', row_data ->> 'label',
      'enabled', (row_data ->> 'enabled')::boolean,
      'quantity', (row_data ->> 'monthly_quantity')::integer
    );
  elsif tg_table_name = 'delivery_periods' then
    event_metadata := jsonb_build_object('month', row_data ->> 'month');
  elsif tg_table_name = 'clients' then
    event_metadata := jsonb_build_object(
      'name', row_data ->> 'name',
      'health', row_data ->> 'health_status',
      'lifecycle', row_data ->> 'lifecycle_status'
    );
  end if;

  insert into public.audit_logs(organization_id, client_id, actor_id, action, entity_type, entity_id, metadata)
  values (target_org, target_client, (select auth.uid()), tg_table_name || '.' || lower(tg_op), tg_table_name, target_entity, event_metadata);
  return new;
end
$$;

revoke all on function private.record_client_audit() from public, anon, authenticated;
