create function public.regenerate_social_image(target_content uuid, requested_model text default 'placeholder')
returns table(image_version integer,image_status text,image_model text,image_storage_path text)
language plpgsql security invoker set search_path=''
as $$
declare target_client uuid;target_prompt text;next_version integer;
begin
  select c.client_id,c.creative_brief into target_client,target_prompt from public.content_items c where c.id=target_content and c.content_kind='social_post' for update;
  if target_client is null then raise exception 'social content not found';end if;
  if not exists(select 1 from public.clients c where c.id=target_client and private.is_org_admin(c.organization_id)) then raise exception 'partner access required';end if;
  select coalesce(max(g.version),0)+1 into next_version from public.image_generations g where g.content_item_id=target_content;
  insert into public.image_generations(client_id,content_item_id,prompt,model,version,status) values(target_client,target_content,coalesce(target_prompt,'Creative brief pending'),coalesce(nullif(requested_model,''),'placeholder'),next_version,'placeholder');
  return query select next_version,'placeholder'::text,coalesce(nullif(requested_model,''),'placeholder'),null::text;
end $$;
revoke all on function public.regenerate_social_image(uuid,text) from public,anon;
grant execute on function public.regenerate_social_image(uuid,text) to authenticated;
