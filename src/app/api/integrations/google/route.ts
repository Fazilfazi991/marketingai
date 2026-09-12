import { NextRequest, NextResponse } from 'next/server';
import { bindGoogle, disconnectGoogle, googleContext, googleDashboard, googleFreshness, googleProperties, revokeGoogle, startGoogle } from '@/lib/google/oauth-service';
import { GoogleError, oauthConfig, STATE_COOKIE } from '@/lib/google/oauth-core';
import { syncGoogleClient } from '@/lib/google/sync';
import { createClient } from '@/lib/supabase/server';
import { googleSyncRange } from '@/lib/google/sync-range';

const messages: Record<string,string> = {
  forbidden:'An active organization admin and active non-demo client are required.',
  configuration:'Google OAuth is awaiting approved environment configuration and migration.',
  state:'Google sign-in expired or could not be verified. Start Connect Google again.',
  needs_reconnection:'Google access needs reconnection. Reconnect and grant both read-only permissions.',
  access_removed:'Google property access was removed or the API is unavailable. Check Google permissions and enabled APIs.',
  selection:'Select properties from this Google account’s current accessible list.',
  shared_connection:'Disconnect every dependent client before revoking this shared account.',
  sync_error:'Google could not complete this operation. Check the connection and retry.',
};
function failure(e: unknown) {
  const code = e instanceof GoogleError ? e.code : 'sync_error';
  return NextResponse.json({error:messages[code]}, {status:code==='forbidden'?403:code==='configuration'?503:400,headers:{'Cache-Control':'no-store'}});
}
export async function GET(req: NextRequest) {
  try {
    const ctx = await googleContext(req.nextUrl.searchParams.get('client_id') ?? '');
    const connection = req.nextUrl.searchParams.get('connection_id');
    const result = req.nextUrl.searchParams.get('freshness')==='1' ? await googleFreshness(ctx) : connection ? await googleProperties(ctx,connection) : await googleDashboard(ctx);
    return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch(e) { return failure(e); }
}
export async function POST(req: NextRequest) {
  try {
    const cfg = oauthConfig();
    const requestOrigin = req.headers.get('origin');
    const fetchSite = req.headers.get('sec-fetch-site');
    if (requestOrigin !== cfg.origin || (fetchSite !== null && fetchSite !== 'same-origin')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('google_oauth_origin_rejected', {
          requestOrigin,
          fetchSite,
          configuredOrigin: cfg.origin,
        });
      }
      throw new GoogleError('forbidden');
    }
    const raw = await req.text(); if (raw.length>4096) throw new GoogleError('selection');
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k=>!['action','client_id','connection_id','ga4','gsc','from','to','ranges'].includes(k))) throw new GoogleError('selection');
    const ctx = await googleContext(typeof body.client_id==='string'?body.client_id:'');
    let payload: Record<string,unknown> = {ok:true};
    if (body.action==='connect') {
      const flow = await startGoogle(ctx,body.connection_id || undefined);
      const response = NextResponse.json({url:flow.url},{headers:{'Cache-Control':'no-store'}});
      response.cookies.set(STATE_COOKIE,flow.state,{httpOnly:true,secure:cfg.origin.startsWith('https:'),sameSite:'lax',maxAge:600,path:'/api/integrations/google'});
      return response;
    }
    if (body.action==='bind') await bindGoogle(ctx,body.connection_id,body.ga4,body.gsc);
    else if (body.action==='disconnect') await disconnectGoogle(ctx,body.connection_id);
    else if (body.action==='revoke') await revokeGoogle(ctx,body.connection_id);
    else if (body.action==='sync') {
      if (body.ga4!==undefined || body.gsc!==undefined || body.connection_id!==undefined) throw new GoogleError('selection');
      const db = await createClient(); if (!db) throw new GoogleError('forbidden');
      let ranges;
      if (body.ranges && typeof body.ranges==='object' && !Array.isArray(body.ranges) && body.from===undefined && body.to===undefined &&
        Object.keys(body.ranges).length===2 && Object.keys(body.ranges).every(k=>['google_analytics','search_console'].includes(k))) {
        const source = body.ranges as Record<string,{from?:unknown;to?:unknown}>;
        ranges = {google_analytics:googleSyncRange(source.google_analytics?.from,source.google_analytics?.to),search_console:googleSyncRange(source.search_console?.from,source.search_console?.to)};
      } else ranges = googleSyncRange(body.from,body.to);
      const sync = await syncGoogleClient(db,ctx.clientId,ranges,process.env,ctx.organizationId);
      payload = {ok:true,sync};
    } else throw new GoogleError('selection');
    return NextResponse.json(payload,{headers:{'Cache-Control':'no-store'}});
  } catch(e) { return failure(e); }
}
