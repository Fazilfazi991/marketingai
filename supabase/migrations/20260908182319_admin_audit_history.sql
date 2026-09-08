-- Audit history is immutable through the Data API. A locked-down trigger writes
-- events in the same transaction as the operation being recorded.
revoke insert, update, delete on table public.audit_logs from authenticated;
grant select on table public.audit_logs to authenticated;

create function private.record_client_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_client uuid;
  target_org uuid;
  target_entity uuid;
  event_metadata jsonb := '{}'::jsonb;
begin
  target_client := case when tg_table_name = 'clients' then new.id else new.client_id end;
  target_entity := case when tg_table_name = 'business_profiles' then new.client_id else new.id end;
  select c.organization_id into target_org from public.clients c where c.id = target_client;
  if tg_table_name = 'client_access' then
    event_metadata := jsonb_build_object('access_type', new.access_type, 'status', new.status);
  elsif tg_table_name = 'client_service_scopes' then
    event_metadata := jsonb_build_object('service', new.label, 'enabled', new.enabled, 'quantity', new.monthly_quantity);
  elsif tg_table_name = 'delivery_periods' then
    event_metadata := jsonb_build_object('month', new.month);
  elsif tg_table_name = 'clients' then
    event_metadata := jsonb_build_object('name', new.name, 'health', new.health_status, 'lifecycle', new.lifecycle_status);
  end if;
  insert into public.audit_logs(organization_id, client_id, actor_id, action, entity_type, entity_id, metadata)
  values (target_org, target_client, (select auth.uid()), tg_table_name || '.' || lower(tg_op), tg_table_name, target_entity, event_metadata);
  return new;
end
$$;
revoke all on function private.record_client_audit() from public, anon, authenticated;

create trigger audit_clients after insert or update on public.clients for each row execute function private.record_client_audit();
create trigger audit_business_profiles after insert or update on public.business_profiles for each row execute function private.record_client_audit();
create trigger audit_client_access after insert or update on public.client_access for each row execute function private.record_client_audit();
create trigger audit_client_service_scopes after insert or update on public.client_service_scopes for each row execute function private.record_client_audit();
create trigger audit_delivery_periods after insert or update on public.delivery_periods for each row execute function private.record_client_audit();

create index if not exists audit_logs_client_created_idx
on public.audit_logs(client_id, created_at desc)
where client_id is not null;
