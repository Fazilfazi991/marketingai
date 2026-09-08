-- Operational blogs and SEO. Publishing remains a deliberate human action outside Growth1000.
alter table public.content_items drop constraint content_status_valid;
alter table public.content_items add constraint content_status_valid check(status in ('idea','generating','needs_review','approved','ready_to_post','scheduled','published','issue','research','topic_selected','brief','draft','internal_review','ready_to_publish'));
alter table public.content_items add constraint content_kind_valid check(content_kind in ('social_post','blog'));

alter table public.seo_keywords add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now(), add constraint seo_keyword_position_valid check(current_position is null or current_position > 0), add constraint seo_keyword_previous_position_valid check(previous_position is null or previous_position > 0), add constraint seo_keyword_priority_valid check(priority is null or priority in ('low','medium','high')), add constraint seo_keyword_status_valid check(status is null or status in ('tracking','opportunity','improving','paused'));
create unique index seo_keywords_client_keyword_idx on public.seo_keywords(client_id,lower(keyword));
create index seo_keywords_priority_idx on public.seo_keywords(client_id,priority,status);

alter table public.seo_pages add column meta_description text, add column notes text, add column updated_at timestamptz not null default now(), add constraint seo_page_status_valid check(status is null or status in ('planned','optimizing','live','needs_attention'));
create unique index seo_pages_client_url_idx on public.seo_pages(client_id,url);

alter table public.seo_tasks add column title text, add column target_url text, add column impact text, add column notes text, add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now(), add constraint seo_task_impact_valid check(impact is null or impact in ('low','medium','high')), add constraint seo_task_status_valid check(status is null or status in ('open','in_progress','awaiting_review','approved','complete'));
create index seo_tasks_work_queue_idx on public.seo_tasks(client_id,status,impact);
create index blog_pipeline_idx on public.content_items(client_id,status,updated_at) where content_kind='blog';

do $$ declare t text; begin
  foreach t in array array['content_items','seo_keywords','seo_pages','seo_tasks'] loop
    execute format('create policy "admins manage %1$s" on public.%1$I for all to authenticated using (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id))) with check (exists(select 1 from public.clients c where c.id=client_id and private.is_org_admin(c.organization_id)))',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;
