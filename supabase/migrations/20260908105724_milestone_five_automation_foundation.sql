-- Reusable automation lifecycle. Secrets remain in environment or n8n credentials, never in configuration JSON.
alter table public.automation_jobs
  add column schedule text,
  add column next_run_at timestamptz,
  add column last_run_at timestamptz,
  add column n8n_workflow_id text,
  add column updated_at timestamptz not null default now(),
  add constraint automation_job_status_valid check(status in ('active','paused','disabled')),
  add constraint automation_workflow_key_valid check(workflow_key in ('MONTHLY_SOCIAL','MONTHLY_BLOG','SEO_REVIEW','MONTHLY_REPORT'));

alter table public.automation_runs
  add column external_run_id text,
  add column provider text,
  add column model text,
  add column metadata jsonb not null default '{}',
  add constraint automation_run_status_valid check(status in ('queued','running','succeeded','failed','cancelled')),
  add constraint automation_run_cost_valid check(cost is null or cost >= 0),
  add constraint automation_run_finished_valid check((status in ('queued','running') and finished_at is null) or (status in ('succeeded','failed','cancelled') and finished_at is not null));

create index automation_jobs_schedule_idx on public.automation_jobs(status,next_run_at) where status='active';
create index automation_runs_history_idx on public.automation_runs(job_id,started_at desc);
create index automation_runs_client_idx on public.automation_runs(client_id,started_at desc);
create unique index automation_runs_external_idx on public.automation_runs(external_run_id) where external_run_id is not null;

create policy "admins manage automation runs" on public.automation_runs for all to authenticated using (exists(select 1 from public.automation_jobs j where j.id=job_id and private.is_org_admin(j.organization_id))) with check (exists(select 1 from public.automation_jobs j where j.id=job_id and private.is_org_admin(j.organization_id)));
create policy "admins manage automation errors" on public.automation_errors for all to authenticated using (exists(select 1 from public.automation_runs r join public.automation_jobs j on j.id=r.job_id where r.id=run_id and private.is_org_admin(j.organization_id))) with check (exists(select 1 from public.automation_runs r join public.automation_jobs j on j.id=r.job_id where r.id=run_id and private.is_org_admin(j.organization_id)));
grant select,insert,update,delete on public.automation_jobs,public.automation_runs,public.automation_errors to authenticated;

create function private.claim_due_automation_jobs(claim_limit integer default 20) returns setof public.automation_jobs language sql security invoker set search_path='' as $$
  update public.automation_jobs set last_run_at=now(),next_run_at=case workflow_key when 'MONTHLY_SOCIAL' then date_trunc('month',now())+interval '1 month' when 'MONTHLY_BLOG' then date_trunc('month',now())+interval '1 month 1 day' when 'SEO_REVIEW' then date_trunc('month',now())+interval '1 month 4 days' else date_trunc('month',now())+interval '2 months - 1 day' end,updated_at=now()
  where id in (select id from public.automation_jobs where status='active' and next_run_at<=now() order by next_run_at for update skip locked limit claim_limit)
  returning *
$$;
revoke all on function private.claim_due_automation_jobs(integer) from public,anon,authenticated;
grant execute on function private.claim_due_automation_jobs(integer) to service_role;
