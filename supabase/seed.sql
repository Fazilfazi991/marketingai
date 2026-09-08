-- Deterministic application seed records. Auth demo users are created by scripts/seed-demo-users.mjs once a local/hosted project is connected.
insert into public.organizations(id,name,slug,is_demo) values ('10000000-0000-4000-8000-000000000001','Growth1000 Demo Company','growth1000-demo',true);
insert into public.plans(id,organization_id,name,monthly_amount) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Start',499),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Growth',999),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Scale',1999);
insert into public.plan_deliverables(plan_id,deliverable_type,label,quantity) values
('20000000-0000-4000-8000-000000000002','social_post','Social posts',12),('20000000-0000-4000-8000-000000000002','seo_article','SEO articles',2),('20000000-0000-4000-8000-000000000002','seo_review','SEO review',1),('20000000-0000-4000-8000-000000000002','website_check','Website check',1),('20000000-0000-4000-8000-000000000002','monthly_report','Monthly report',1);
insert into public.clients(id,organization_id,name,slug,industry,city,is_demo,lifecycle_status,health_status) values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ABC Interiors','abc-interiors','Interior Design / Renovation','Dubai',true,'active','needs_attention');
insert into public.client_subscriptions(client_id,plan_id,starts_on,next_due_on,payment_status,monthly_amount) values ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','2026-09-01','2026-10-01','paid',999);
insert into public.business_profiles(client_id,description,target_customers,value_proposition,tone_of_voice,website,prohibited_claims) values ('30000000-0000-4000-8000-000000000001','Dubai interior design and renovation studio.','Villa and apartment owners in Dubai and Sharjah.','Thoughtful, practical spaces built around everyday life.','Warm, expert, clear','https://example.invalid','Never invent prices, guarantees, certifications or testimonials.');
insert into public.business_services(client_id,name) values ('30000000-0000-4000-8000-000000000001','Kitchen Renovation'),('30000000-0000-4000-8000-000000000001','Villa Renovation'),('30000000-0000-4000-8000-000000000001','Wardrobes'),('30000000-0000-4000-8000-000000000001','Interior Fit-out');
insert into public.business_locations(client_id,name) values ('30000000-0000-4000-8000-000000000001','Dubai'),('30000000-0000-4000-8000-000000000001','Sharjah');
insert into public.client_access(client_id,access_type,status) values ('30000000-0000-4000-8000-000000000001','Website','connected'),('30000000-0000-4000-8000-000000000001','Google Analytics','connected'),('30000000-0000-4000-8000-000000000001','Search Console','connected'),('30000000-0000-4000-8000-000000000001','Instagram','connected'),('30000000-0000-4000-8000-000000000001','Facebook','connected'),('30000000-0000-4000-8000-000000000001','WhatsApp','pending');
insert into public.content_items(client_id,content_kind,month,platform,topic,concept,caption,hashtags,creative_brief,recommended_publish_at,status,internal_notes)
select '30000000-0000-4000-8000-000000000001','social','2026-11-01',v.platform,v.topic,'A practical, design-led post for Dubai homeowners.',v.caption,'#DubaiInteriors #InteriorDesignUAE #HomeRenovation','Premium editorial interior composition; natural light; no text overlay.',v.publish_at,v.status,'Use verified services and locations only.'
from (values
('Instagram + Facebook','From dated to designed','A kitchen should work as beautifully as it looks.','2026-11-05 11:00+04'::timestamptz,'ready_to_post'),
('Instagram','Villa renovation checklist','Planning a villa renovation? Start with how you live.','2026-11-08 18:30+04'::timestamptz,'ready_to_post'),
('Instagram + Facebook','Storage that disappears','The best wardrobes create calm without calling attention to themselves.','2026-11-12 12:00+04'::timestamptz,'scheduled'),
('Instagram','Material moodboard','Warm stone, brushed metal and natural timber.','2026-11-15 10:30+04'::timestamptz,'published'),
('Facebook','Before the renovation','Good outcomes start long before demolition.','2026-11-18 18:00+04'::timestamptz,'needs_review'),
('Instagram + Facebook','Wardrobe details','Quiet luxury lives in the details.','2026-11-20 11:30+04'::timestamptz,'ready_to_post'),
('Instagram','Open-plan balance','An open-plan home still needs distinct moments.','2026-11-22 19:00+04'::timestamptz,'needs_review'),
('Instagram + Facebook','Site progress','From drawings to site: careful coordination matters.','2026-11-24 13:00+04'::timestamptz,'published'),
('Instagram','Kitchen workflow','A beautiful kitchen becomes effortless when zones follow how you move.','2026-11-26 18:30+04'::timestamptz,'scheduled'),
('Facebook','Renovation questions','What should you ask a fit-out team before appointing them?','2026-11-27 12:00+04'::timestamptz,'approved'),
('Instagram + Facebook','Dubai design','Designed for Dubai living.','2026-11-29 11:00+04'::timestamptz,'published'),
('Instagram','November recap','A month of thoughtful details and spaces taking shape.','2026-11-30 19:30+04'::timestamptz,'published')) as v(platform,topic,caption,publish_at,status);

insert into public.content_items(client_id,content_kind,month,topic,concept,target_keyword,body,seo_metadata,status,internal_notes) values
('30000000-0000-4000-8000-000000000001','blog','2026-09-01','The complete guide to villa renovation in Dubai','Practical homeowner planning guide','villa renovation dubai','Renovating a villa is easier when the decisions happen in the right order.',jsonb_build_object('title','Villa Renovation Dubai: A Practical Homeowner Guide','description','Plan a Dubai villa renovation with a clear guide to scope, timelines and selecting an interior fit-out partner.'),'internal_review','Do not invent costs, timelines or authority approvals.'),
('30000000-0000-4000-8000-000000000001','blog','2026-09-01','Kitchen layouts that work for Dubai homes','Compare practical layouts and circulation','kitchen renovation dubai','The right layout makes a kitchen feel calm long before finishes are selected.',jsonb_build_object('title','Kitchen Renovation Dubai: Layout Planning Guide','description','Compare practical kitchen layouts, storage ideas and circulation tips for Dubai homes.'),'draft','Use only verified ABC Interiors services.'),
('30000000-0000-4000-8000-000000000001','blog','2026-08-01','Interior fit-out checklist for business owners','Commercial fit-out preparation checklist','interior fit out dubai','Clear requirements reduce costly changes once work begins.',jsonb_build_object('title','Interior Fit-Out Dubai: Client Checklist','description','Prepare for an interior fit-out with a clear checklist for scope, approvals and delivery.'),'published','Published manually to the client website.');

insert into public.seo_keywords(client_id,keyword,intent,target_url,current_position,previous_position,priority,status,notes) values
('30000000-0000-4000-8000-000000000001','kitchen renovation dubai','commercial','/kitchen-renovation',8,11,'high','improving','Strengthen service proof and FAQs.'),
('30000000-0000-4000-8000-000000000001','villa renovation dubai','commercial','/villa-renovation',14,19,'high','opportunity','Publish supporting guide and add internal links.'),
('30000000-0000-4000-8000-000000000001','custom wardrobes dubai','commercial','/wardrobes',21,19,'medium','tracking','Add materials and project photography.'),
('30000000-0000-4000-8000-000000000001','interior fit out dubai','commercial','/fit-out',17,18,'medium','improving','Expand process section.');

insert into public.seo_pages(client_id,url,title,target_keyword,status,meta_description,notes) values
('30000000-0000-4000-8000-000000000001','/kitchen-renovation','Kitchen Renovation Dubai','kitchen renovation dubai','live','Practical kitchen renovation services for Dubai homes.','Add verified project examples.'),
('30000000-0000-4000-8000-000000000001','/villa-renovation','Villa Renovation Dubai','villa renovation dubai','optimizing','Thoughtful villa renovation and interior fit-out in Dubai.','Supporting guide in internal review.'),
('30000000-0000-4000-8000-000000000001','/wardrobes','Custom Wardrobes Dubai','custom wardrobes dubai','needs_attention','Plan fitted wardrobes around storage and everyday use.','Needs original photography.');

insert into public.seo_tasks(client_id,opportunity,title,target_url,impact,status,notes) values
('30000000-0000-4000-8000-000000000001','content','Publish villa renovation planning guide','/villa-renovation','high','in_progress','Support the service page with a useful guide and contextual links.'),
('30000000-0000-4000-8000-000000000001','on_page','Add project proof to wardrobe page','/wardrobes','high','open','Add original photography and a verified case-study section.'),
('30000000-0000-4000-8000-000000000001','metadata','Improve fit-out title and description','/fit-out','medium','complete','Aligned metadata with the primary commercial query.');
insert into public.seo_tasks(client_id,opportunity,title,target_url,impact,status,notes) values
('30000000-0000-4000-8000-000000000001','technical','Add renovation FAQ schema','/villa-renovation','medium','awaiting_review','Review the proposed verified questions before implementation.');

insert into public.automation_jobs(id,organization_id,workflow_key,name,status,configuration,schedule,next_run_at,last_run_at,n8n_workflow_id) values
('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','MONTHLY_SOCIAL','Monthly social preparation','active','{"review_boundary":"needs_review","content_count":12}','0 8 1 * *','2026-10-01 08:00+04','2026-09-01 08:04+04','SNsT3tzXQNT4KMHh'),
('70000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','MONTHLY_BLOG','Monthly blog preparation','active','{"review_boundary":"internal_review","content_count":2}','0 8 2 * *','2026-10-02 08:00+04','2026-09-02 08:02+04','pcQN9KSzSGg0fHVR'),
('70000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','SEO_REVIEW','SEO review','active','{"review_boundary":"awaiting_review"}','0 9 5 * *','2026-10-05 09:00+04','2026-09-05 09:01+04','4SbYlnVSwlkow8hM'),
('70000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','MONTHLY_REPORT','Monthly report','active','{"review_boundary":"draft"}','0 10 L * *','2026-09-30 10:00+04','2026-08-31 10:03+04','FVdVKXFldvRu9yU6');

insert into public.automation_runs(id,job_id,client_id,started_at,finished_at,status,input_reference,output_reference,cost,provider,model) values
('71000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','2026-09-01 08:04+04','2026-09-01 08:05+04','succeeded','{"month":"2026-09"}','{"content_records":12,"status":"needs_review"}',0.1842,'openai-compatible','demo'),
('71000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','2026-08-31 10:03+04','2026-08-31 10:03+04','failed','{"month":"2026-08"}','{}',null,null,null);
insert into public.automation_errors(run_id,error_code,message,details) values ('71000000-0000-4000-8000-000000000002','DATA_SOURCE_UNAVAILABLE','Analytics data was unavailable; no report was published.','{"retryable":true}');
