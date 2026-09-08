-- Results-only clients must not see internal generation prompts, model metadata,
-- provider errors, or raw import operations. These remain operational staff data.
drop policy if exists "authorized users read image generations" on public.image_generations;
create policy "staff read image generations" on public.image_generations
for select to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = client_id and private.is_org_staff(c.organization_id)
  )
);

drop policy if exists "authorized client imports" on public.data_imports;
create policy "staff read data imports" on public.data_imports
for select to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = client_id and private.is_org_staff(c.organization_id)
  )
);
