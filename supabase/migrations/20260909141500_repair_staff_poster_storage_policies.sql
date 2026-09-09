-- Repair Preview environments where the Goal 3A schema was applied before the
-- staff poster policies were included. Keep access limited to the existing
-- organization membership check and client-scoped storage path.
drop policy if exists "staff read client assets" on storage.objects;
create policy "staff read client assets" on storage.objects
for select to authenticated
using (
  bucket_id = 'client-assets'
  and exists (
    select 1
    from public.clients c
    where c.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and private.is_org_staff(c.organization_id)
  )
);

drop policy if exists "staff upload client posters" on storage.objects;
create policy "staff upload client posters" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'client-assets'
  and exists (
    select 1
    from public.clients c
    where c.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and private.is_org_staff(c.organization_id)
  )
);

drop policy if exists "staff update client posters" on storage.objects;
create policy "staff update client posters" on storage.objects
for update to authenticated
using (
  bucket_id = 'client-assets'
  and exists (
    select 1
    from public.clients c
    where c.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and private.is_org_staff(c.organization_id)
  )
)
with check (
  bucket_id = 'client-assets'
  and exists (
    select 1
    from public.clients c
    where c.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and private.is_org_staff(c.organization_id)
  )
);
