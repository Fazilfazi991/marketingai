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
