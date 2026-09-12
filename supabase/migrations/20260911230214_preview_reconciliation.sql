-- Growth1000 Preview forward-only reconciliation.
-- Precondition: exact target ref cwamjlqqacjfppnqquuw, verified backup restore,
-- reviewed migration-adoption manifest, and an explicit transaction.
-- This migration intentionally does not recreate the existing 41-table schema.

-- Recover the two canonical Goal 3B operational entries without changing any
-- existing job status, configuration, schedule, or run history.
insert into public.automation_jobs(
  organization_id,
  workflow_key,
  name,
  status,
  configuration
)
select
  o.id,
  v.workflow_key,
  v.name,
  'active',
  jsonb_build_object('manual_trigger', true, 'recurring_schedule', false)
from public.organizations o
cross join (
  values
    ('REFRESH_WEBSITE_INVENTORY', 'Refresh website inventory'),
    ('BLOG_FACTORY', 'Evidence-backed blog factory')
) as v(workflow_key, name)
on conflict (organization_id, workflow_key) do nothing;

-- RLS does not protect whole-table operations. Existing application clients
-- do not require TRUNCATE; retain service_role for controlled backend recovery.
revoke truncate on table
  public.analytics_daily,
  public.analytics_page_daily,
  public.assets,
  public.audit_logs,
  public.automation_errors,
  public.automation_jobs,
  public.automation_runs,
  public.business_faqs,
  public.business_locations,
  public.business_profiles,
  public.business_services,
  public.client_access,
  public.client_integrations,
  public.client_members,
  public.client_requests,
  public.client_service_scopes,
  public.client_sites,
  public.clients,
  public.content_approvals,
  public.content_assets,
  public.content_items,
  public.data_imports,
  public.delivery_obligations,
  public.delivery_periods,
  public.image_generations,
  public.leads,
  public.notifications,
  public.organization_members,
  public.organizations,
  public.profiles,
  public.reports,
  public.search_console_daily,
  public.seo_keywords,
  public.seo_pages,
  public.seo_reviews,
  public.seo_tasks,
  public.social_monthly_strategies,
  public.task_activity,
  public.task_comments,
  public.tasks,
  public.website_inventory_runs
from public, anon, authenticated;

-- Harden future public application tables created by the observed owner.
-- Growth1000 Preview's public application tables are all owned by postgres.
-- The dashboard SQL runner cannot alter supabase_admin's default privileges,
-- and that role does not own any of the reconciled application tables.
alter default privileges for role postgres in schema public
  revoke truncate on tables from public, anon, authenticated;
