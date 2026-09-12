import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { GoogleIntegration } from '@/components/google-integration';
import { loadAdminClient } from '@/lib/admin-data';
import { googleContext, googleDashboard } from '@/lib/google/oauth-service';
import { oauthConfig } from '@/lib/google/oauth-core';
import { initialGoogleSyncRange } from '@/lib/google/sync-range';

export default async function IntegrationsPage({params,searchParams}: {params:Promise<{slug:string}>;searchParams:Promise<{connection?:string}>}) {
  const {slug} = await params, client = await loadAdminClient(slug);
  if (!client) notFound();
  const ctx = await googleContext(client.id);
  let ready = false;
  try {oauthConfig();ready=true;} catch { /* Local feature stays closed until explicitly configured. */ }
  const initial = ready ? await googleDashboard(ctx) : {connections:[],integrations:[
    {provider:'google_analytics',external_reference:client.integrations.ga4PropertyId,status:client.integrations.ga4Status,last_synced_at:client.integrations.lastGa4Sync ?? null,last_sync_status:null,google_connection_id:null,auth_method:'service_account'},
    {provider:'search_console',external_reference:client.integrations.searchConsoleSiteUrl,status:client.integrations.searchStatus,last_synced_at:client.integrations.lastSearchSync ?? null,last_sync_status:null,google_connection_id:null,auth_method:'service_account'},
  ]};
  return <AppShell role="admin" title="Client integrations" subtitle={client.name}>
    <Link className="detail-back" href={`/admin/clients/${encodeURIComponent(slug)}`}>Back to {client.name}</Link>
    <GoogleIntegration clientId={client.id} clientName={client.name} ready={ready} initial={initial} selectedConnection={(await searchParams).connection}
      initialRange={initialGoogleSyncRange()} />
  </AppShell>;
}
