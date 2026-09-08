create policy "admins delete client assets" on storage.objects for delete to authenticated using (
  bucket_id='client-assets' and exists (
    select 1 from public.clients c
    where c.id=((storage.foldername(name))[1])::uuid and private.is_org_admin(c.organization_id)
  )
);
create policy "clients delete own files" on storage.objects for delete to authenticated using (
  bucket_id='client-assets'
  and private.is_client_member(((storage.foldername(name))[1])::uuid)
  and owner_id=(select auth.uid()::text)
);
