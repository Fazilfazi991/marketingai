-- Generated content assets are attached only by an authenticated Growth1000 partner.
create policy "admins attach generated content assets" on public.content_assets
for insert to authenticated
with check (
  exists (
    select 1
    from public.content_items item
    join public.clients client on client.id = item.client_id
    where item.id = content_item_id
      and item.client_id = (select asset.client_id from public.assets asset where asset.id = asset_id)
      and private.is_org_admin(client.organization_id)
  )
);

create policy "admins detach generated content assets" on public.content_assets
for delete to authenticated
using (
  exists (
    select 1
    from public.content_items item
    join public.clients client on client.id = item.client_id
    where item.id = content_item_id
      and private.is_org_admin(client.organization_id)
  )
);
