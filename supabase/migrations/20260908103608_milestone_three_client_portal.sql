-- Client portal permissions are tenant-scoped and exclude internal notes and automation runs.
create function private.is_client_member(target_client uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.client_members cm where cm.client_id=target_client and cm.user_id=(select auth.uid()))
$$;
revoke all on function private.is_client_member(uuid) from public,anon;
grant execute on function private.is_client_member(uuid) to authenticated;

create policy "clients add asset metadata" on public.assets for insert to authenticated with check (private.is_client_member(client_id) and created_by=(select auth.uid()) and source='uploaded');
create policy "clients upload own files" on storage.objects for insert to authenticated with check (bucket_id='client-assets' and private.is_client_member(((storage.foldername(name))[1])::uuid));
create policy "clients replace own files" on storage.objects for update to authenticated using (bucket_id='client-assets' and private.is_client_member(((storage.foldername(name))[1])::uuid) and owner_id=(select auth.uid()::text)) with check (bucket_id='client-assets' and private.is_client_member(((storage.foldername(name))[1])::uuid) and owner_id=(select auth.uid()::text));
create policy "clients read own content approvals" on public.content_approvals for select to authenticated using (reviewer_id=(select auth.uid()) and exists(select 1 from public.content_items i where i.id=content_item_id and private.is_client_member(i.client_id)));

create or replace function private.enforce_social_transition() returns trigger language plpgsql security definer set search_path='' as $$
declare staff_member boolean; admin_member boolean; client_member boolean;
begin
  if old.status = new.status then return new; end if;
  select private.is_org_admin(c.organization_id),private.is_org_staff(c.organization_id),private.is_client_member(c.id) into admin_member,staff_member,client_member from public.clients c where c.id=old.client_id;
  if not staff_member and not client_member then raise exception 'not authorized to change content status'; end if;
  if client_member and not staff_member and not (old.status='approved' and new.status in ('ready_to_post','idea')) then raise exception 'client transition not permitted'; end if;
  if staff_member and not admin_member and not (old.status in ('ready_to_post','scheduled','issue') and new.status in ('scheduled','published','issue','ready_to_post')) then raise exception 'staff transition not permitted'; end if;
  if new.status='scheduled' then new.scheduled_at=coalesce(new.scheduled_at,now());new.scheduled_by=(select auth.uid());end if;
  if new.status='published' then new.published_at=coalesce(new.published_at,now());new.published_by=(select auth.uid());end if;
  return new;
end $$;

create policy "clients transition approved content" on public.content_items for update to authenticated using (private.is_client_member(client_id) and status='approved') with check (private.is_client_member(client_id) and status in ('ready_to_post','idea'));

create function private.request_to_task() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.tasks(client_id,title,description,category,priority,status,source,related_type,related_id)
  values(new.client_id,new.title,new.description,new.request_type,'medium','not_started','client_request','client_request',new.id);
  insert into public.audit_logs(organization_id,client_id,actor_id,action,entity_type,entity_id)
  select c.organization_id,new.client_id,new.requester_id,'client_request_created','client_request',new.id from public.clients c where c.id=new.client_id;
  return new;
end $$;
revoke all on function private.request_to_task() from public,anon,authenticated;
create trigger create_task_from_client_request after insert on public.client_requests for each row execute function private.request_to_task();
