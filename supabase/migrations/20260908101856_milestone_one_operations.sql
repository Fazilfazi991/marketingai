-- Milestone 1 operations: recurring plan obligations, approval mode and storage isolation.
create table public.delivery_periods (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null check (date_trunc('month', month)::date = month),
  status text not null default 'open',
  generated_at timestamptz not null default now(),
  generated_by uuid references public.profiles(id),
  unique(client_id, month)
);
create table public.delivery_obligations (
  id uuid primary key default gen_random_uuid(),
  delivery_period_id uuid not null references public.delivery_periods(id) on delete cascade,
  plan_deliverable_id uuid not null references public.plan_deliverables(id),
  deliverable_type text not null,
  label text not null,
  promised_quantity integer not null check(promised_quantity > 0),
  delivered_quantity integer not null default 0 check(delivered_quantity >= 0),
  status text not null default 'pending',
  unique(delivery_period_id, plan_deliverable_id)
);
alter table public.clients add column content_approval_mode text not null default 'internal_only' check(content_approval_mode in ('internal_only','client_approval_required'));
alter table public.delivery_periods enable row level security;
alter table public.delivery_obligations enable row level security;

create policy "authorized users read delivery periods" on public.delivery_periods for select to authenticated using (private.can_access_client(client_id));
create policy "authorized users read delivery obligations" on public.delivery_obligations for select to authenticated using (exists(select 1 from public.delivery_periods p where p.id=delivery_period_id and private.can_access_client(p.client_id)));
create policy "admins manage delivery periods" on public.delivery_periods for all to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
create policy "admins manage delivery obligations" on public.delivery_obligations for all to authenticated using (exists(select 1 from public.delivery_periods p join public.clients c on c.id=p.client_id where p.id=delivery_period_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.delivery_periods p join public.clients c on c.id=p.client_id where p.id=delivery_period_id and private.is_org_admin(c.organization_id)));

create function private.generate_monthly_obligations(target_client uuid, target_month date)
returns uuid language plpgsql security invoker set search_path='' as $$
declare period_id uuid; active_plan uuid; normalized_month date := date_trunc('month',target_month)::date;
begin
  if not exists(select 1 from public.clients c where c.id=target_client and private.is_org_admin(c.organization_id)) then raise exception 'not authorized'; end if;
  select s.plan_id into active_plan from public.client_subscriptions s where s.client_id=target_client and s.status='active' order by s.starts_on desc limit 1;
  if active_plan is null then raise exception 'no active plan'; end if;
  insert into public.delivery_periods(client_id,month,generated_by) values(target_client,normalized_month,(select auth.uid())) on conflict(client_id,month) do update set generated_at=now() returning id into period_id;
  insert into public.delivery_obligations(delivery_period_id,plan_deliverable_id,deliverable_type,label,promised_quantity)
  select period_id,d.id,d.deliverable_type,d.label,d.quantity from public.plan_deliverables d where d.plan_id=active_plan and d.cadence='monthly'
  on conflict(delivery_period_id,plan_deliverable_id) do nothing;
  return period_id;
end $$;
revoke all on function private.generate_monthly_obligations(uuid,date) from public,anon;
grant execute on function private.generate_monthly_obligations(uuid,date) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('client-assets','client-assets',false,52428800,array['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf','video/mp4']) on conflict(id) do nothing;
create policy "authorized users read client assets" on storage.objects for select to authenticated using (bucket_id='client-assets' and private.can_access_client(((storage.foldername(name))[1])::uuid));
create policy "admins upload client assets" on storage.objects for insert to authenticated with check (bucket_id='client-assets' and exists(select 1 from public.clients c where c.id=((storage.foldername(name))[1])::uuid and private.is_org_admin(c.organization_id)));
create policy "admins update client assets" on storage.objects for update to authenticated using (bucket_id='client-assets' and exists(select 1 from public.clients c where c.id=((storage.foldername(name))[1])::uuid and private.is_org_admin(c.organization_id))) with check (bucket_id='client-assets' and exists(select 1 from public.clients c where c.id=((storage.foldername(name))[1])::uuid and private.is_org_admin(c.organization_id)));
grant select,insert,update,delete on public.delivery_periods,public.delivery_obligations to authenticated;

-- Membership lookups must bypass organization_members RLS to avoid recursive policy evaluation.
-- They remain private, check auth.uid() internally, expose no caller-controlled user id, and are executable only by authenticated users.
alter function private.is_org_admin(uuid) security definer;
alter function private.can_access_client(uuid) security definer;
create function private.is_org_staff(org_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org_id and m.user_id=(select auth.uid()) and m.role in ('admin','staff') and m.status='active')
$$;
revoke all on function private.is_org_staff(uuid) from public,anon;
grant execute on function private.is_org_staff(uuid) to authenticated;

create policy "members read plans" on public.plans for select to authenticated using (private.is_org_staff(organization_id) or exists(select 1 from public.clients c join public.client_members cm on cm.client_id=c.id where c.organization_id=plans.organization_id and cm.user_id=(select auth.uid())));
create policy "admins manage plans" on public.plans for all to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "members read plan deliverables" on public.plan_deliverables for select to authenticated using (exists(select 1 from public.plans p where p.id=plan_id and (private.is_org_staff(p.organization_id) or exists(select 1 from public.clients c join public.client_members cm on cm.client_id=c.id where c.organization_id=p.organization_id and cm.user_id=(select auth.uid())))));
create policy "admins manage plan deliverables" on public.plan_deliverables for all to authenticated using (exists(select 1 from public.plans p where p.id=plan_id and private.is_org_admin(p.organization_id))) with check (exists(select 1 from public.plans p where p.id=plan_id and private.is_org_admin(p.organization_id)));
create policy "authorized users read subscriptions" on public.client_subscriptions for select to authenticated using (private.can_access_client(client_id));
create policy "admins manage subscriptions" on public.client_subscriptions for all to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));
create policy "members read client membership" on public.client_members for select to authenticated using (user_id=(select auth.uid()) or private.can_access_client(client_id));
create policy "admins manage client membership" on public.client_members for all to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)));

do $$ declare t text; begin foreach t in array array['business_profiles','business_services','business_locations','business_faqs','client_access','client_integrations','assets','tasks','content_items','seo_keywords','seo_pages','seo_tasks','reports','analytics_daily','search_console_daily'] loop
  execute format('create policy "admins manage client rows" on public.%I for all to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))',t);
end loop; end $$;
create policy "staff updates operational tasks" on public.tasks for update to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id))) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)));
create policy "staff updates approved content" on public.content_items for update to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)) and status in ('approved','ready_to_post','scheduled','published','issue')) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_staff(c.organization_id)) and status in ('approved','ready_to_post','scheduled','published','issue'));
create policy "clients update own business profile" on public.business_profiles for update to authenticated using (exists(select 1 from public.client_members cm where cm.client_id=client_id and cm.user_id=(select auth.uid()))) with check (exists(select 1 from public.client_members cm where cm.client_id=client_id and cm.user_id=(select auth.uid())));
create policy "authorized users read task comments" on public.task_comments for select to authenticated using (exists(select 1 from public.tasks t where t.id=task_id and private.can_access_client(t.client_id) and (not is_internal or exists(select 1 from public.clients c where c.id=t.client_id and private.is_org_staff(c.organization_id)))));
create policy "staff create task comments" on public.task_comments for insert to authenticated with check (author_id=(select auth.uid()) and exists(select 1 from public.tasks t join public.clients c on c.id=t.client_id where t.id=task_id and private.is_org_staff(c.organization_id)));
create policy "staff read task activity" on public.task_activity for select to authenticated using (exists(select 1 from public.tasks t join public.clients c on c.id=t.client_id where t.id=task_id and private.is_org_staff(c.organization_id)));
create policy "authorized users read content assets" on public.content_assets for select to authenticated using (exists(select 1 from public.content_items i where i.id=content_item_id and private.can_access_client(i.client_id)));
create policy "staff read content approvals" on public.content_approvals for select to authenticated using (exists(select 1 from public.content_items i join public.clients c on c.id=i.client_id where i.id=content_item_id and private.is_org_staff(c.organization_id)));
create policy "admins manage content approvals" on public.content_approvals for all to authenticated using (exists(select 1 from public.content_items i join public.clients c on c.id=i.client_id where i.id=content_item_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.content_items i join public.clients c on c.id=i.client_id where i.id=content_item_id and private.is_org_admin(c.organization_id)));
create policy "staff read automation jobs" on public.automation_jobs for select to authenticated using (private.is_org_staff(organization_id));
create policy "admins manage automation jobs" on public.automation_jobs for all to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "staff read automation runs" on public.automation_runs for select to authenticated using (exists(select 1 from public.automation_jobs j where j.id=job_id and private.is_org_staff(j.organization_id)));
create policy "staff read automation errors" on public.automation_errors for select to authenticated using (exists(select 1 from public.automation_runs r join public.automation_jobs j on j.id=r.job_id where r.id=run_id and private.is_org_staff(j.organization_id)));
create policy "admins read audit logs" on public.audit_logs for select to authenticated using (private.is_org_admin(organization_id));
