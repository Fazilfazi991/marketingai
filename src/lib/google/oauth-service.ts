import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertReadScopes, authorization, discoverProperties, exchangeToken, GoogleError, googleJson, hash, oauthConfig, seal, selectedProperties, unseal, UUID, type Env } from './oauth-core';
import { latestGa4CompletedObservation, latestSearchConsoleCompletedObservation } from './analytics';

export type GoogleContext = { userId:string; organizationId:string; clientId:string; slug:string; name:string; sessionHash:string };
type IntegrationConfig = {propertyId?:string;siteUrl?:string};
const configOf=(value:unknown):IntegrationConfig=>value && typeof value==='object' && !Array.isArray(value) ? value as IntegrationConfig : {};
export async function googleContext(clientId: string): Promise<GoogleContext> {
  if (!UUID.test(clientId)) throw new GoogleError('forbidden');
  const db = await createClient();
  if (!db) throw new GoogleError('forbidden');
  const {data:auth,error} = await db.auth.getUser();
  if (error || !auth.user) throw new GoogleError('forbidden');
  const {data:client,error:clientError} = await db.from('clients').select('id,organization_id,slug,name')
    .eq('id',clientId).eq('is_demo',false).eq('lifecycle_status','active').is('deleted_at',null).maybeSingle();
  if (clientError || !client) throw new GoogleError('forbidden');
  const {data:member,error:memberError} = await db.from('organization_members').select('organization_id')
    .eq('organization_id',client.organization_id).eq('user_id',auth.user.id).eq('role','admin').eq('status','active').maybeSingle();
  if (memberError || !member) throw new GoogleError('forbidden');
  // getClaims verifies the session JWT; session_id binds callbacks across access-token refreshes.
  const claims = await db.auth.getClaims();
  const session = claims.data?.claims.session_id;
  if (claims.error || typeof session !== 'string' || claims.data?.claims.sub !== auth.user.id) throw new GoogleError('forbidden');
  return { userId:auth.user.id,organizationId:client.organization_id,clientId,slug:client.slug,name:client.name,sessionHash:hash(session) };
}
function privileged() {
  const db = createAdminClient();
  if (!db) throw new GoogleError('configuration');
  return db;
}
function checked(error: unknown) { if (error) throw new GoogleError('sync_error'); }
type Connection = { id:string; organization_id:string; google_subject:string; account_email:string; encrypted_refresh_token:string|null; scopes:string[]; status:string };
async function connectionRow(db: SupabaseClient, org: string, id: string): Promise<Connection> {
  if (!UUID.test(id)) throw new GoogleError('forbidden');
  const {data,error} = await db.from('google_connections')
    .select('id,organization_id,google_subject,account_email,encrypted_refresh_token,scopes,status').eq('id',id).eq('organization_id',org).maybeSingle();
  if (error || !data) throw new GoogleError('forbidden');
  return data as Connection;
}
export async function startGoogle(ctx: GoogleContext, reconnectId?: string, env: Env = process.env) {
  const flow = authorization(env), db = privileged();
  if (reconnectId) await connectionRow(db,ctx.organizationId,reconnectId);
  // Remove only expired states for this initiating user; no persistent authorization codes.
  checked((await db.from('google_oauth_states').delete().eq('user_id',ctx.userId).lt('expires_at',new Date().toISOString())).error);
  checked((await db.from('google_oauth_states').insert({state_hash:hash(flow.state),user_id:ctx.userId,organization_id:ctx.organizationId,
    client_id:ctx.clientId,session_hash:ctx.sessionHash,encrypted_verifier:seal(flow.verifier,`state:${hash(flow.state)}`,env),
    reconnect_id:reconnectId ?? null,expires_at:new Date(Date.now()+600000).toISOString()})).error);
  return {state:flow.state,url:flow.url};
}
export async function completeGoogle(state: string, cookieState: string, code: string, env: Env = process.env) {
  const cfg = oauthConfig(env);
  if (!/^[A-Za-z0-9_-]{43}$/.test(state) || hash(state)!==hash(cookieState) || !code || code.length>4096) throw new GoogleError('state');
  const db = privileged();
  const {data:pending,error} = await db.from('google_oauth_states').select('client_id').eq('state_hash',hash(state)).maybeSingle();
  if (error || !pending) throw new GoogleError('state');
  const ctx = await googleContext(pending.client_id);
  // DELETE ... RETURNING is atomic: only one concurrent callback can consume this state.
  const {data:consumed,error:consumeError} = await db.from('google_oauth_states').delete().eq('state_hash',hash(state))
    .eq('user_id',ctx.userId).eq('organization_id',ctx.organizationId).eq('client_id',ctx.clientId)
    .eq('session_hash',ctx.sessionHash).gt('expires_at',new Date().toISOString()).select('encrypted_verifier,reconnect_id').maybeSingle();
  if (consumeError || !consumed) throw new GoogleError('state');
  const tokens = await exchangeToken({grant_type:'authorization_code',code,redirect_uri:cfg.redirect,code_verifier:unseal(consumed.encrypted_verifier,`state:${hash(state)}`,env)},env);
  assertReadScopes(tokens.scope);
  const identity = await googleJson<{sub?:string;email?:string;email_verified?:boolean}>('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`}});
  if (!identity.sub || !identity.email || identity.email_verified !== true) throw new GoogleError('needs_reconnection');
  if (consumed.reconnect_id) {
    const reconnect = await connectionRow(db,ctx.organizationId,consumed.reconnect_id);
    if (reconnect.google_subject !== identity.sub || ['revoking','revoked'].includes(reconnect.status)) throw new GoogleError('selection');
  }
  const {data:existing,error:existingError} = await db.from('google_connections').select('id,encrypted_refresh_token,status')
    .eq('organization_id',ctx.organizationId).eq('google_subject',identity.sub).maybeSingle();
  checked(existingError);
  if (existing?.status==='revoking') throw new GoogleError('shared_connection');
  const aad = `google:${ctx.organizationId}:${identity.sub}`;
  // A missing refresh token is reusable only for the same subject + organization, not a revoked grant.
  const refresh = tokens.refresh_token ? seal(tokens.refresh_token,aad,env) :
    existing?.status === 'connected' ? existing.encrypted_refresh_token : null;
  if (!refresh) throw new GoogleError('needs_reconnection');
  const row = {organization_id:ctx.organizationId,google_subject:identity.sub,account_email:identity.email,
    connected_by_profile_id:ctx.userId,encrypted_refresh_token:refresh,scopes:tokens.scope!.split(' '),status:'connected',updated_at:new Date().toISOString()};
  const result = existing ? await db.from('google_connections').update(row).eq('id',existing.id).eq('organization_id',ctx.organizationId)
    .neq('status','revoking').select('id').single() : await db.from('google_connections').insert(row).select('id').single();
  checked(result.error);
  if (!result.data) throw new GoogleError('sync_error');
  return {client:ctx,connectionId:result.data.id as string};
}
export async function oauthAccessToken(org: string, id: string, env: Env = process.env) {
  oauthConfig(env);
  const db = privileged(), row = await connectionRow(db,org,id);
  if (row.status !== 'connected' || !row.encrypted_refresh_token) throw new GoogleError('needs_reconnection');
  try {
    assertReadScopes(row.scopes.join(' '));
    const tokens = await exchangeToken({grant_type:'refresh_token',refresh_token:unseal(row.encrypted_refresh_token,`google:${org}:${row.google_subject}`,env)},env);
    if (tokens.scope) assertReadScopes(tokens.scope);
    // Access tokens are short-lived and memory-only; never persisted or returned to a UI.
    if (tokens.refresh_token) checked((await db.from('google_connections').update({encrypted_refresh_token:seal(tokens.refresh_token,`google:${org}:${row.google_subject}`,env),updated_at:new Date().toISOString()})
      .eq('id',id).eq('organization_id',org).eq('status','connected').eq('encrypted_refresh_token',row.encrypted_refresh_token)).error);
    return tokens.access_token;
  } catch (e) {
    if (e instanceof GoogleError && e.code==='needs_reconnection') checked((await db.from('google_connections').update({status:'needs_reconnection',updated_at:new Date().toISOString()}).eq('id',id).eq('organization_id',org).eq('status','connected')).error);
    throw e;
  }
}
export async function googleProperties(ctx: GoogleContext, id: string) {
  return discoverProperties(await oauthAccessToken(ctx.organizationId,id));
}
export async function googleDashboard(ctx: GoogleContext) {
  oauthConfig();
  const db = privileged();
  const [{data:connections,error},{data:integrations,error:integrationError}] = await Promise.all([
    db.from('google_connections').select('id,account_email,status').eq('organization_id',ctx.organizationId).neq('status','revoked').order('created_at'),
    db.from('client_integrations').select('provider,status,external_reference,last_synced_at,last_sync_status,google_connection_id,auth_method').eq('client_id',ctx.clientId).in('provider',['google_analytics','search_console']),
  ]);
  checked(error); checked(integrationError);
  return {connections:connections ?? [],integrations:integrations ?? []};
}
export async function googleFreshness(ctx: GoogleContext) {
  oauthConfig();
  const db=privileged();
  const {data,error}=await db.from('client_integrations').select('provider,external_reference,configuration,google_connection_id,auth_method,status')
    .eq('client_id',ctx.clientId).in('provider',['google_analytics','search_console']).in('status',['connected','sync_error']);
  checked(error);
  const integrations=(data ?? []) as {provider:'google_analytics'|'search_console';external_reference:string|null;configuration:unknown;google_connection_id:string|null;auth_method:string;status:string}[];
  if (!integrations.length || integrations.some(item=>item.auth_method!=='google_oauth'||!item.google_connection_id)) throw new GoogleError('configuration');
  const tokenByConnection=new Map<string,Promise<string>>();
  const access=(id:string)=>{if(!tokenByConnection.has(id))tokenByConnection.set(id,oauthAccessToken(ctx.organizationId,id));return tokenByConnection.get(id)!;};
  const results=await Promise.all(integrations.map(async item=>{
    const cfg=configOf(item.configuration),token=await access(item.google_connection_id!);
    const property=item.provider==='google_analytics' ? cfg.propertyId ?? item.external_reference ?? '' : cfg.siteUrl ?? item.external_reference ?? '';
    const observed=item.provider==='google_analytics'
      ? await latestGa4CompletedObservation({accessToken:token,ga4PropertyId:property,searchConsoleSiteUrl:''})
      : await latestSearchConsoleCompletedObservation({accessToken:token,ga4PropertyId:'',searchConsoleSiteUrl:property});
    if (!observed.day) throw new GoogleError('sync_error');
    return [item.provider,{property,latestCompletedObservation:observed.day,from:new Date(Date.parse(`${observed.day}T00:00:00Z`)-55*86400000).toISOString().slice(0,10),to:observed.day,fetchDurationMs:observed.fetchDurationMs}] as const;
  }));
  return Object.fromEntries(results);
}
export async function bindGoogle(ctx: GoogleContext,id: string,ga4: unknown,gsc: unknown) {
  // Re-fetch Google lists here, not just when displaying the picker.
  const selected = selectedProperties(await googleProperties(ctx,id),ga4,gsc);
  const db = privileged();
  checked((await db.rpc('manage_google_binding',{actor:ctx.userId,org:ctx.organizationId,target_client:ctx.clientId,connection:id,operation:'bind',...selected})).error);
}
export async function disconnectGoogle(ctx: GoogleContext,id: string) {
  oauthConfig(); const db = privileged(); await connectionRow(db,ctx.organizationId,id);
  checked((await db.rpc('manage_google_binding',{actor:ctx.userId,org:ctx.organizationId,target_client:ctx.clientId,connection:id,operation:'disconnect'})).error);
}
export async function revokeGoogle(ctx: GoogleContext,id: string) {
  oauthConfig(); const db = privileged(), row = await connectionRow(db,ctx.organizationId,id);
  const {error} = await db.rpc('manage_google_binding',{actor:ctx.userId,org:ctx.organizationId,target_client:ctx.clientId,connection:id,operation:'begin_revoke'});
  if (error) throw new GoogleError('shared_connection');
  // A failed revocation remains revoking and cannot be rebound; retry is explicit and safe.
  if (row.encrypted_refresh_token) {
    let response: Response;
    try { response = await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({token:unseal(row.encrypted_refresh_token,`google:${ctx.organizationId}:${row.google_subject}`)}),redirect:'error',signal:AbortSignal.timeout(15000)}); }
    catch { throw new GoogleError('sync_error'); }
    if (!response.ok) throw new GoogleError('sync_error');
  }
  checked((await db.from('google_connections').update({status:'revoked',encrypted_refresh_token:null,updated_at:new Date().toISOString()}).eq('id',id).eq('organization_id',ctx.organizationId).eq('status','revoking')).error);
}
