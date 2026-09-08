-- Users must be able to resolve only their own effective role. Organization admins
-- may inspect membership in their authorized organization; no membership list is public.
create policy "users read own client membership" on public.client_members for select to authenticated
using (user_id = (select auth.uid()));
create policy "organization admins read client membership" on public.client_members for select to authenticated
using (exists (
  select 1 from public.clients c
  where c.id = client_id and private.is_org_admin(c.organization_id)
));
grant select on public.client_members, public.organization_members to authenticated;
revoke all on public.client_members, public.organization_members from anon;
