-- Run only against a disposable database after the complete migration chain.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) select ('a0000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,8) n;
insert into public.profiles(id,full_name) select id,'QA role '||right(id::text,1) from auth.users where id::text like 'a0000000-%';
insert into public.organizations(id,name,slug) values ('b0000000-0000-0000-0000-000000000001','QA A','phase2-qa-a'),('b0000000-0000-0000-0000-000000000002','QA B','phase2-qa-b');
insert into public.clients(id,organization_id,name,slug) values
 ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','QA client A','qa-a'),
 ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002','QA client B','qa-b'),
 ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','QA other client in org A','qa-c');
insert into public.client_members(client_id,user_id) values
 ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001'),
 ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002'),
 ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000008');
insert into public.organization_members(organization_id,user_id,role,status) values
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','admin','active'),
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004','staff','active'),
 ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005','admin','active'),
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000006','staff','active'),
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000007','staff','inactive');
create function public.qa_assert(ok boolean,label text) returns void language plpgsql security invoker as $$ begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
create function public.qa_denied(statement text,label text) returns void language plpgsql security invoker as $$ begin
 begin execute statement; exception when insufficient_privilege then raise notice 'PASS: %',label; return; end;
 raise exception 'FAIL (allowed): %',label;
end $$;
create function public.qa_invalid(statement text,label text) returns void language plpgsql security invoker as $$ begin
 begin execute statement; exception when invalid_parameter_value then raise notice 'PASS: %',label; return; end;
 raise exception 'FAIL (allowed): %',label;
end $$;
select public.qa_assert(private.agent_classify('Why did website traffic fall?')='question','question classification');
select public.qa_assert(private.agent_classify('Can you add office renovation to our website?')='request','work classification');
select public.qa_assert(private.agent_classify('What should we improve this week?')='question','advisory question not execution');
select public.qa_assert(private.agent_classify('I want to promote a new service.')='request','service promotion request');
select public.qa_assert(private.agent_classify('I need a change on my website.')='request','website request suggestion');
set local role authenticated;
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000001';
select public.agent_send('Can you add office renovation to our website?','d0000000-0000-0000-0000-000000000001') as topic \gset
select set_config('qa.topic',:'topic',false);
select public.qa_assert((select count(*)=1 from public.agent_conversations),'client creates persisted topic');
select public.qa_assert((select count(*)=2 from public.agent_messages),'message and truthful receipt saved');
select public.qa_assert((select sender_type='client' from public.agent_messages order by created_at,id limit 1),'client message ordered before receipt');
select public.qa_assert((select count(*)=1 from public.client_requests where status='received' and request_type='website'),'request linked and categorized');
select public.qa_assert((select count(*)=1 from public.request_events),'received event saved');
select public.qa_assert(public.agent_send('Can you add office renovation to our website?','d0000000-0000-0000-0000-000000000001')=:'topic','retry returns same conversation');
select public.qa_assert((select count(*)=2 from public.agent_messages),'retry does not duplicate messages');
select public.qa_invalid($$select public.agent_send('Different text','d0000000-0000-0000-0000-000000000001')$$,'same key different payload rejected');
select public.qa_invalid($$select public.agent_send(' ','d0000000-0000-0000-0000-000000000009')$$,'empty message rejected');
select public.qa_invalid($$select public.agent_send(E'\n\t','d0000000-0000-0000-0000-000000000009')$$,'whitespace-only direct RPC rejected');
select public.qa_invalid($$select public.agent_send(repeat('x',4001),'d0000000-0000-0000-0000-000000000009')$$,'oversized message rejected');
select public.qa_denied($$insert into public.agent_messages(conversation_id,sender_type,body) values(current_setting('qa.topic')::uuid,'staff','Forged reply')$$,'client cannot forge staff message');
select public.qa_denied($$insert into public.agent_internal_notes(conversation_id,author_id,body,submission_key) values(current_setting('qa.topic')::uuid,auth.uid(),'Forged note',gen_random_uuid())$$,'client cannot create internal note');
select public.qa_denied($$update public.client_requests set status='completed'$$,'direct client status change rejected');
select public.qa_denied($$update public.agent_conversations set assigned_user_id=auth.uid()$$,'direct assignment rejected');
select public.qa_denied($$select public.agent_manage(current_setting('qa.topic')::uuid,'status','completed',gen_random_uuid())$$,'client cannot invoke staff status RPC');
select public.qa_denied($$select private.agent_manage(current_setting('qa.topic')::uuid,'reply','Forged',gen_random_uuid())$$,'private API also authorizes');
select public.agent_send('Why did website traffic fall?','d0000000-0000-0000-0000-000000000002') as question \gset
select set_config('qa.question',:'question',false);
select public.qa_assert((select count(*)=1 from public.client_requests),'question does not silently become work');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000002';
select public.qa_assert((select count(*)=0 from public.agent_conversations),'other tenant cannot read conversations');
select public.qa_assert((select count(*)=0 from public.agent_messages),'other tenant cannot read messages');
select public.qa_assert((select count(*)=0 from public.client_requests),'guessed request ID cannot read');
select public.qa_assert((select count(*)=0 from public.request_events),'other tenant cannot read events');
select public.qa_denied($$select public.agent_send('Cross tenant followup',gen_random_uuid(),current_setting('qa.topic')::uuid)$$,'cross tenant followup rejected');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000008';
select public.qa_assert((select count(*)=0 from public.agent_messages),'same organization other client cannot read messages');
select public.qa_assert((select count(*)=0 from public.client_requests),'same organization other client cannot guess request ID');
select public.qa_denied($$select public.agent_send('Same org cross client',gen_random_uuid(),current_setting('qa.topic')::uuid)$$,'same organization cross-client write rejected');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000004';
select public.qa_assert((select count(*)=0 from public.agent_conversations),'unassigned staff cannot read');
select public.qa_denied($$select public.agent_manage(current_setting('qa.topic')::uuid,'reply','Not assigned',gen_random_uuid())$$,'unassigned staff cannot reply');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000003';
select public.qa_assert((select count(*)=2 from public.agent_conversations),'admin sees incoming questions and requests');
select public.qa_denied($$select public.agent_manage(current_setting('qa.topic')::uuid,'assign','a0000000-0000-0000-0000-000000000005',gen_random_uuid())$$,'cross organization assignment rejected');
select public.qa_denied($$select public.agent_manage(current_setting('qa.topic')::uuid,'assign','a0000000-0000-0000-0000-000000000007',gen_random_uuid())$$,'inactive staff assignment rejected');
select public.agent_manage(:'topic','assign','a0000000-0000-0000-0000-000000000004',gen_random_uuid());
select public.agent_manage(:'question','request','',gen_random_uuid());
select public.qa_assert((select count(*)=2 from public.client_requests),'staff can reclassify question as request');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000004';
select public.qa_assert((select count(*)=1 from public.agent_conversations),'assigned staff reads only assigned topic');
select public.qa_assert((select count(*)=1 from public.client_requests),'assigned staff reads request');
select public.agent_manage(:'topic','status','reviewing',gen_random_uuid());
select public.agent_manage(:'topic','status','in_progress',gen_random_uuid());
select public.agent_manage(:'topic','status','needs_approval',gen_random_uuid());
select public.agent_manage(:'topic','status','completed',gen_random_uuid());
select public.qa_assert((select status='completed' from public.client_requests),'staff updates statuses');
select public.qa_assert((select count(*)=5 from public.request_events),'status history preserved');
select public.agent_manage(:'topic','reply','Your website update is ready for review.','d0000000-0000-0000-0000-000000000003');
select public.agent_manage(:'topic','reply','Your website update is ready for review.','d0000000-0000-0000-0000-000000000003');
select public.qa_assert((select count(*)=1 from public.agent_messages where sender_type='staff'),'staff reply idempotent');
select public.agent_manage(:'topic','note','Internal planning: never client-visible.','d0000000-0000-0000-0000-000000000004');
select public.qa_assert((select count(*)=1 from public.agent_internal_notes),'assigned staff reads internal note');
select public.qa_denied($$select public.agent_manage(current_setting('qa.topic')::uuid,'assign','a0000000-0000-0000-0000-000000000006',gen_random_uuid())$$,'staff cannot reassign work');
select public.qa_invalid($$select public.agent_manage(current_setting('qa.topic')::uuid,'status','published',gen_random_uuid())$$,'invalid internal status rejected');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000001';
select public.qa_assert((select count(*)=1 from public.agent_messages where sender_type='staff'),'reply appears to correct client');
select public.qa_assert((select count(*)=0 from public.agent_internal_notes),'internal notes hidden from client');
select public.qa_assert((select count(*)=6 from public.notifications),'actual reply/status/reclassification notifications only');
select public.qa_assert(not exists(select 1 from public.notifications where body like '%Internal planning%'),'internal note not leaked via notifications');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000005';
select public.qa_assert((select count(*)=0 from public.agent_conversations),'other organization admin isolated');
select public.qa_denied($$select public.agent_manage(current_setting('qa.topic')::uuid,'status','completed',gen_random_uuid())$$,'other organization admin cannot mutate');
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000003';
select public.qa_assert((select count(*)=3 from public.agent_owners()),'admin owner projection stays in own organization');
select public.agent_manage(:'question','question','',gen_random_uuid());
select public.qa_assert((select kind='question' from public.agent_conversations where id=:'question'),'false positive can be reclassified as question');
select public.qa_assert((select status='cancelled' from public.client_requests where conversation_id=:'question'),'reclassification preserves cancelled request history');
select public.agent_manage(:'question','request','',gen_random_uuid());
select public.qa_assert((select count(*)=2 from public.client_requests),'reclassification reuses original request');
select public.agent_manage(:'topic','assign','a0000000-0000-0000-0000-000000000006',gen_random_uuid());
set local request.jwt.claim.sub='a0000000-0000-0000-0000-000000000004';
select public.qa_assert((select count(*)=0 from public.agent_conversations),'reassignment revokes previous staff access');
select public.qa_assert((select count(*)=0 from public.agent_owners()),'staff cannot browse owner directory');
select public.qa_denied($$select public.agent_manage(current_setting('qa.topic')::uuid,'reply','Revoked owner',gen_random_uuid())$$,'reassigned staff cannot reply');
set local role anon;
select public.qa_denied($$select public.agent_send('Anonymous',gen_random_uuid())$$,'anonymous send rejected');
select public.qa_denied($$select * from public.agent_messages$$,'anonymous read rejected');
reset role;
-- Commit is intentional: the next psql connection proves actual reload persistence.
commit;
\connect
set role authenticated;
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000001';
select public.qa_assert((select count(*)=2 from public.agent_conversations),'conversation persists across database reconnection');
select public.qa_assert((select count(*)=5 from public.agent_messages),'messages persist across database reconnection');
select public.qa_assert((select count(*)=1 from public.client_requests where status='completed'),'request progress persists across reconnection');
reset role;
drop function public.qa_assert(boolean,text),public.qa_denied(text,text),public.qa_invalid(text,text);
