-- Extend the existing transition guard for the Goal 3A manual production
-- stages. Staff remain limited to an explicit forward-only workflow (plus
-- reporting an issue); admins retain the broader review authority.
create or replace function private.enforce_social_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  staff_member boolean;
  admin_member boolean;
begin
  if old.status = new.status then
    return new;
  end if;

  select
    private.is_org_admin(c.organization_id),
    private.is_org_staff(c.organization_id)
  into admin_member, staff_member
  from public.clients c
  where c.id = old.client_id;

  if not staff_member then
    raise exception 'not authorized to change content status';
  end if;

  if not admin_member and not (
    (old.status = 'ready_for_design' and new.status in ('poster_created', 'issue'))
    or (old.status = 'poster_created' and new.status in ('ready_to_schedule', 'issue'))
    or (old.status in ('ready_to_schedule', 'ready_to_post') and new.status in ('scheduled', 'issue'))
    or (old.status = 'scheduled' and new.status in ('published', 'issue'))
    or (old.status = 'issue' and new.status in ('ready_for_design', 'ready_to_schedule', 'ready_to_post'))
  ) then
    raise exception 'staff transition not permitted';
  end if;

  if new.status = 'scheduled' then
    new.scheduled_at = coalesce(new.scheduled_at, now());
    new.scheduled_by = (select auth.uid());
  end if;

  if new.status = 'published' then
    new.published_at = coalesce(new.published_at, now());
    new.published_by = (select auth.uid());
  end if;

  return new;
end
$$;

revoke all on function private.enforce_social_transition() from public, anon, authenticated;
