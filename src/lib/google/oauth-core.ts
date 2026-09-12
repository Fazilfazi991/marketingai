import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const GOOGLE_SCOPES = [
  'openid', 'email',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
] as const;
export const CALLBACK_PATH = '/api/integrations/google/callback';
export const STATE_COOKIE = 'g1000_google_oauth';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type Env = Record<string,string|undefined>;
export class GoogleError extends Error {
  constructor(public code: 'forbidden'|'configuration'|'state'|'needs_reconnection'|'access_removed'|'sync_error'|'selection'|'shared_connection') { super(code); }
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function oauthConfig(env: Env = process.env) {
  if (env.GOOGLE_OAUTH_ENABLED !== 'true' || !env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) throw new GoogleError('configuration');
  let redirect: URL;
  try { redirect = new URL(env.GOOGLE_OAUTH_REDIRECT_URI ?? ''); } catch { throw new GoogleError('configuration'); }
  if (redirect.pathname !== CALLBACK_PATH || redirect.search || redirect.hash || redirect.username || redirect.password ||
    (redirect.protocol !== 'https:' && !(redirect.protocol === 'http:' && ['localhost','127.0.0.1'].includes(redirect.hostname)))) throw new GoogleError('configuration');
  encryptionKey(env);
  return { clientId: env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET, redirect: redirect.href, origin: redirect.origin };
}
function encryptionKey(env: Env) {
  const value = env.GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY ?? '';
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32 || key.toString('base64') !== value) throw new GoogleError('configuration');
  return key;
}
export function seal(value: string, context: string, env: Env = process.env) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', encryptionKey(env), iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join('.');
}
export function unseal(value: string, context: string, env: Env = process.env) {
  try {
    const [version,iv,tag,data,...rest] = value.split('.');
    if (version !== 'v1' || rest.length || !data) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm',encryptionKey(env),Buffer.from(iv,'base64url'));
    decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(Buffer.from(tag,'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');
  } catch { throw new GoogleError('needs_reconnection'); }
}
export function authorization(env: Env = process.env) {
  const cfg = oauthConfig(env), state = randomBytes(32).toString('base64url'), verifier = randomBytes(32).toString('base64url');
  const params = new URLSearchParams({ client_id:cfg.clientId,redirect_uri:cfg.redirect,response_type:'code',
    scope:GOOGLE_SCOPES.join(' '),state,access_type:'offline',prompt:'consent select_account',
    code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256' });
  return { state,verifier,url:`https://accounts.google.com/o/oauth2/v2/auth?${params}` };
}
export async function googleJson<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url,{...init,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)}); }
  catch { throw new GoogleError('sync_error'); }
  if (!response.ok) {
    // Never propagate Google response bodies, request URLs, authorization codes or tokens.
    if (response.status === 401) throw new GoogleError('needs_reconnection');
    if (response.status === 403) throw new GoogleError('access_removed');
    if (response.status === 400 && url === 'https://oauth2.googleapis.com/token') {
      const body = await response.json().catch(()=>null);
      if (body?.error === 'invalid_grant') throw new GoogleError('needs_reconnection');
    }
    throw new GoogleError('sync_error');
  }
  try { return await response.json() as T; } catch { throw new GoogleError('sync_error'); }
}
export type Tokens = { access_token: string; refresh_token?: string; scope?: string; expires_in: number; token_type: string };
export async function exchangeToken(values: Record<string,string>, env: Env = process.env) {
  const cfg = oauthConfig(env);
  const result = await googleJson<Tokens>('https://oauth2.googleapis.com/token',{ method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({...values,client_id:cfg.clientId,client_secret:cfg.clientSecret}) });
  if (!result.access_token || result.token_type?.toLowerCase() !== 'bearer' || !(result.expires_in > 0)) throw new GoogleError('needs_reconnection');
  return result;
}
export function assertReadScopes(scope: string|undefined) {
  const granted = new Set(scope?.split(' ') ?? []);
  if (!GOOGLE_SCOPES.slice(2).every(s=>granted.has(s))) throw new GoogleError('needs_reconnection');
}
export type Properties = { ga4: {id:string;name:string;account:string}[]; gsc: {id:string;permission:string}[] };
export async function discoverProperties(token: string): Promise<Properties> {
  const headers = {Authorization:`Bearer ${token}`}, ga4: Properties['ga4'] = [];
  let pageToken = '';
  const seen = new Set<string>();
  for (let page=0;page<25;page++) {
    const query = new URLSearchParams({pageSize:'200',...(pageToken ? {pageToken} : {})});
    const result = await googleJson<{accountSummaries?:{displayName?:string;propertySummaries?:{property?:string;displayName?:string}[]}[];nextPageToken?:string}>(
      `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?${query}`,{headers});
    for (const account of result.accountSummaries ?? []) for (const p of account.propertySummaries ?? []) {
      if (/^properties\/\d+$/.test(p.property ?? '')) ga4.push({id:p.property!.split('/')[1],name:p.displayName ?? p.property!,account:account.displayName ?? ''});
    }
    pageToken = result.nextPageToken ?? '';
    if (!pageToken) break;
    if (seen.has(pageToken) || page===24) throw new GoogleError('sync_error');
    seen.add(pageToken);
  }
  const sites = await googleJson<{siteEntry?:{siteUrl?:string;permissionLevel?:string}[]}>(
    'https://www.googleapis.com/webmasters/v3/sites',{headers});
  return {ga4,gsc:(sites.siteEntry ?? []).filter(s=>s.siteUrl && ['siteOwner','siteFullUser','siteRestrictedUser'].includes(s.permissionLevel ?? '')).map(s=>({id:s.siteUrl!,permission:s.permissionLevel!}))};
}
export function selectedProperties(properties: Properties, ga4: unknown, gsc: unknown) {
  if (typeof ga4 !== 'string' || typeof gsc !== 'string' || (!ga4 && !gsc)) throw new GoogleError('selection');
  const analytics = properties.ga4.find(p=>p.id===ga4), search = properties.gsc.find(p=>p.id===gsc);
  if ((ga4 && !analytics) || (gsc && !search)) throw new GoogleError('selection');
  return { ga4: analytics?.id ?? null,ga4_name:analytics?.name ?? null,gsc:search?.id ?? null };
}
