-- The client portal is results-only. Remove the earlier self-service permissions
-- while preserving all internal admin/staff operations.
drop policy if exists "client creates own requests" on public.client_requests;
drop policy if exists "clients submit content decisions" on public.content_approvals;
drop policy if exists "clients read own content approvals" on public.content_approvals;
drop policy if exists "clients transition approved content" on public.content_items;
drop policy if exists "clients update own business profile" on public.business_profiles;
drop policy if exists "clients add asset metadata" on public.assets;
drop policy if exists "authorized users read service scopes" on public.client_service_scopes;
create policy "staff read service scopes" on public.client_service_scopes for select to authenticated using (
  exists(select 1 from public.clients c where c.id = client_id and private.is_org_staff(c.organization_id))
);

drop policy if exists "authorized users read delivery periods" on public.delivery_periods;
drop policy if exists "authorized users read delivery obligations" on public.delivery_obligations;
create policy "staff read delivery periods" on public.delivery_periods for select to authenticated using (
  exists(select 1 from public.clients c where c.id = client_id and private.is_org_staff(c.organization_id))
);
create policy "staff read delivery obligations" on public.delivery_obligations for select to authenticated using (
  exists(select 1 from public.delivery_periods p join public.clients c on c.id = p.client_id where p.id = delivery_period_id and private.is_org_staff(c.organization_id))
);

drop policy if exists "authorized users read task comments" on public.task_comments;
create policy "staff read task comments" on public.task_comments for select to authenticated using (
  exists(select 1 from public.tasks t join public.clients c on c.id = t.client_id where t.id = task_id and private.is_org_staff(c.organization_id))
);
drop policy if exists "authorized users read content assets" on public.content_assets;
create policy "staff read content assets" on public.content_assets for select to authenticated using (
  exists(select 1 from public.content_items i join public.clients c on c.id = i.client_id where i.id = content_item_id and private.is_org_staff(c.organization_id))
);

-- Clients only receive reports that an admin has explicitly published.
drop policy if exists "authorized client rows" on public.reports;
create policy "staff read reports" on public.reports for select to authenticated using (
  exists(select 1 from public.clients c where c.id = client_id and private.is_org_staff(c.organization_id))
);
create policy "clients read published reports" on public.reports for select to authenticated using (
  status = 'published' and exists(
    select 1 from public.client_members cm
    where cm.client_id = reports.client_id and cm.user_id = (select auth.uid())
  )
);

drop policy if exists "clients upload own files" on storage.objects;
drop policy if exists "clients replace own files" on storage.objects;
drop policy if exists "clients delete own files" on storage.objects;
drop policy if exists "authorized users read client assets" on storage.objects;
create policy "staff read client assets" on storage.objects for select to authenticated using (
  bucket_id = 'client-assets' and exists (
    select 1 from public.clients c
    where c.id = ((storage.foldername(name))[1])::uuid
      and private.is_org_staff(c.organization_id)
  )
);

drop trigger if exists create_task_from_client_request on public.client_requests;
drop function if exists private.request_to_task();

-- Remove client-readable generic policies from internal operational tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'business_profiles','business_services','business_locations','business_faqs',
    'client_access','client_integrations','assets','tasks','content_items',
    'seo_keywords','seo_pages','seo_tasks','client_requests'
  ] loop
    execute format('drop policy if exists "authorized client rows" on public.%I', table_name);
    execute format(
      'create policy "staff read operational rows" on public.%I for select to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)))',
      table_name
    );
  end loop;
end $$;

-- Clients need selected ranking results, never SEO notes or implementation state.
create function public.client_keyword_results()
returns table(keyword text, current_position integer, previous_position integer)
language sql stable security definer set search_path = '' as $$
  select k.keyword, k.current_position, k.previous_position
  from public.seo_keywords k
  where exists (
    select 1 from public.client_members cm
    where cm.client_id = k.client_id and cm.user_id = (select auth.uid())
  )
    and k.current_position is not null
  order by k.current_position
  limit 10
$$;
revoke all on function public.client_keyword_results() from public, anon;
grant execute on function public.client_keyword_results() to authenticated;

create or replace function private.enforce_social_transition()
returns trigger language plpgsql security definer set search_path = '' as $$
declare staff_member boolean; admin_member boolean;
begin
  if old.status = new.status then return new; end if;
  select private.is_org_admin(c.organization_id), private.is_org_staff(c.organization_id)
    into admin_member, staff_member from public.clients c where c.id = old.client_id;
  if not staff_member then raise exception 'not authorized to change content status'; end if;
  if not admin_member and not (
    old.status in ('ready_to_post','scheduled','issue')
    and new.status in ('scheduled','published','issue','ready_to_post')
  ) then raise exception 'staff transition not permitted'; end if;
  if new.status = 'scheduled' then
    new.scheduled_at = coalesce(new.scheduled_at, now());
    new.scheduled_by = (select auth.uid());
  end if;
  if new.status = 'published' then
    new.published_at = coalesce(new.published_at, now());
    new.published_by = (select auth.uid());
  end if;
  return new;
end $$;
revoke all on function private.enforce_social_transition() from public, anon, authenticated;
