-- External systems retry webhooks. Preserve one normalized lead per source event.
alter table public.leads add column external_id text;
alter table public.leads add constraint leads_external_id_length check (external_id is null or char_length(external_id) between 1 and 200);
alter table public.leads add constraint leads_client_source_external_unique unique (client_id, source, external_id);
