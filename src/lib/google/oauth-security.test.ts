import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
vi.mock('server-only',()=>({}));
const mocks=vi.hoisted(()=>({session:vi.fn(),admin:vi.fn(),sync:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.session}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocks.admin}));
vi.mock('./sync',()=>({syncGoogleClient:mocks.sync}));
import { GET, POST } from '@/app/api/integrations/google/route';
import { GET as callback } from '@/app/api/integrations/google/callback/route';
import { authorization, CALLBACK_PATH, GOOGLE_SCOPES, GoogleError, hash, oauthConfig, seal, unseal } from './oauth-core';
import { completeGoogle, googleContext, oauthAccessToken, startGoogle } from './oauth-service';
const org='10000000-0000-4000-8000-000000000001',foreignOrg='10000000-0000-4000-8000-000000000002';
const client='40000000-0000-4000-8000-000000000001',other='40000000-0000-4000-8000-000000000002';
const connection='60000000-0000-4000-8000-000000000001',user='70000000-0000-4000-8000-000000000001';
type Row=Record<string,unknown>;
let tables:Record<string,Row[]>, writes:string[], signedIn:boolean, sessionId:string, refreshFailure:boolean;
let rpc:ReturnType<typeof vi.fn>;
function database() {
  return {auth:{getUser:async()=>({data:{user:signedIn?{id:user}:null},error:null}),getClaims:async()=>({data:{claims:{sub:user,session_id:sessionId}},error:null})},rpc,
    from(table:string){
      let columns='',operation='',payload:Row|Row[]={},limit=Infinity;
      const filters:((row:Row)=>boolean)[]=[];
      const finish=()=>{
        let selected=(tables[table]??[]).filter(row=>filters.every(f=>f(row))).slice(0,limit);
        if(operation){writes.push(table);if(operation==='delete')tables[table]=(tables[table]??[]).filter(row=>!selected.includes(row));
          if(operation==='update')selected.forEach(row=>Object.assign(row,payload));
          if(operation==='insert'){selected=(Array.isArray(payload)?payload:[payload]).map(row=>({id:connection,...row}));tables[table]=[...(tables[table]??[]),...selected];}}
        if(columns)selected=selected.map(row=>Object.fromEntries(columns.split(',').map(key=>[key,row[key]])));
        return {data:selected,error:null};
      };
      const q={select(c:string){columns=c;return q;},eq(k:string,v:unknown){filters.push(r=>r[k]===v);return q;},neq(k:string,v:unknown){filters.push(r=>r[k]!==v);return q;},is(k:string,v:unknown){filters.push(r=>r[k]===v);return q;},in(k:string,v:unknown[]){filters.push(r=>v.includes(r[k]));return q;},lt(k:string,v:string){filters.push(r=>String(r[k])<v);return q;},gt(k:string,v:string){filters.push(r=>String(r[k])>v);return q;},order(){return q;},limit(n:number){limit=n;return q;},
        delete(){operation='delete';return q;},insert(p:Row|Row[]){operation='insert';payload=p;return q;},update(p:Row){operation='update';payload=p;return q;},
        async maybeSingle(){const result=finish();return {...result,data:result.data.length===1?result.data[0]:null};},async single(){return q.maybeSingle();},
        then(resolve:(v:ReturnType<typeof finish>)=>unknown){return Promise.resolve(finish()).then(resolve);},
      };return q;
    }};
}
const request=(body:Row,origin='https://qa.example')=>new NextRequest('https://qa.example/api/integrations/google',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({client_id:client,...body})});
const get=(id=client,conn='')=>new NextRequest(`https://qa.example/api/integrations/google?client_id=${id}${conn?`&connection_id=${conn}`:''}`);
beforeEach(()=>{
  vi.clearAllMocks();vi.unstubAllEnvs();writes=[];signedIn=true;sessionId='session-one';refreshFailure=false;
  vi.stubEnv('GOOGLE_OAUTH_ENABLED','true');vi.stubEnv('GOOGLE_OAUTH_CLIENT_ID','test-client-id');vi.stubEnv('GOOGLE_OAUTH_CLIENT_SECRET','test-secret');
  vi.stubEnv('GOOGLE_OAUTH_REDIRECT_URI',`https://qa.example${CALLBACK_PATH}`);vi.stubEnv('GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY',Buffer.alloc(32,7).toString('base64'));
  tables={clients:[{id:client,organization_id:org,is_demo:false,lifecycle_status:'active',deleted_at:null,slug:'qa',name:'QA'},{id:other,organization_id:foreignOrg,is_demo:false,lifecycle_status:'active',deleted_at:null}],
    organization_members:[{user_id:user,organization_id:org,role:'admin',status:'active'}],google_connections:[{id:connection,organization_id:org,google_subject:'subject',account_email:'qa@example.com',encrypted_refresh_token:seal('private-refresh',`google:${org}:subject`),scopes:[...GOOGLE_SCOPES],status:'connected'}],google_oauth_states:[],client_integrations:[]};
  rpc=vi.fn().mockResolvedValue({error:null});mocks.session.mockResolvedValue(database());mocks.admin.mockImplementation(database);
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
    if(url==='https://oauth2.googleapis.com/token')return refreshFailure?Response.json({error:'invalid_grant',secret:'DO NOT LEAK'},{status:400}):Response.json({access_token:'private-access',token_type:'Bearer',expires_in:3600,scope:GOOGLE_SCOPES.join(' ')});
    if(url.startsWith('https://analyticsadmin.googleapis.com/'))return Response.json({accountSummaries:[{displayName:'QA account',propertySummaries:[{property:'properties/123',displayName:'QA GA4'}]}]});
    if(url==='https://www.googleapis.com/webmasters/v3/sites')return Response.json({siteEntry:[{siteUrl:'sc-domain:qa.example',permissionLevel:'siteFullUser'},{siteUrl:'sc-domain:denied.example',permissionLevel:'siteUnverifiedUser'}]});
    if(url==='https://openidconnect.googleapis.com/v1/userinfo')return Response.json({sub:'subject',email:'qa@example.com',email_verified:true});
    if(url==='https://oauth2.googleapis.com/revoke')return new Response('');
    throw new Error('Unexpected endpoint');
  }));
});
describe('managed Google actual request boundaries',()=>{
  it.each(['client','staff'])('rejects %s configuration before privileged reads',async role=>{tables.organization_members[0].role=role;expect((await POST(request({action:'connect'}))).status).toBe(403);expect(mocks.admin).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();});
  it('rejects inactive admin',async()=>{tables.organization_members[0].status='inactive';expect((await GET(get())).status).toBe(403);});
  it('rejects no session',async()=>{signedIn=false;expect((await GET(get())).status).toBe(403);expect(mocks.admin).not.toHaveBeenCalled();});
  it.each(['forged',other])('rejects arbitrary or cross-org client %s',async id=>{expect((await GET(get(id))).status).toBe(403);expect(mocks.admin).not.toHaveBeenCalled();});
  it.each([{is_demo:true},{lifecycle_status:'paused'},{deleted_at:'2026-01-01'}])('rejects ineligible client %j',async change=>{Object.assign(tables.clients[0],change);expect((await POST(request({action:'connect'}))).status).toBe(403);});
  it('rejects cross-site mutation',async()=>{expect((await POST(request({action:'connect'},'https://evil.example'))).status).toBe(403);expect(writes).toEqual([]);});
  it('accepts the configured browser origin when Next reconstructs a localhost alias',async()=>{
    vi.stubEnv('GOOGLE_OAUTH_REDIRECT_URI',`http://127.0.0.1:3000${CALLBACK_PATH}`);
    const req=new NextRequest('http://localhost:3000/api/integrations/google',{method:'POST',headers:{origin:'http://127.0.0.1:3000','sec-fetch-site':'same-origin','Content-Type':'application/json'},body:JSON.stringify({client_id:client,action:'connect'})});
    expect((await POST(req)).status).toBe(200);
  });
  it('rejects cross-site fetch metadata even with a matching origin',async()=>{
    const req=request({action:'connect'});req.headers.set('sec-fetch-site','cross-site');
    expect((await POST(req)).status).toBe(403);expect(writes).toEqual([]);
  });
  it('projects metadata without tokens, subject or encrypted values',async()=>{const res=await GET(get());expect(res.status).toBe(200);const body=await res.text();expect(body).toContain('qa@example.com');expect(body).not.toMatch(/private-|encrypted|subject|scopes/);});
  it('isolates available properties from another organization',async()=>{tables.google_connections[0].organization_id=foreignOrg;expect((await GET(get(client,connection))).status).toBe(403);expect(fetch).not.toHaveBeenCalled();});
  it.each([{ga4:'999',gsc:''},{ga4:'',gsc:'sc-domain:foreign.example'},{ga4:'',gsc:'sc-domain:denied.example'},{ga4:'',gsc:''}])('rejects unverified property selection %j',async selected=>{expect((await POST(request({action:'bind',connection_id:connection,...selected}))).status).toBe(400);expect(rpc).not.toHaveBeenCalled();});
  it('binds only explicit accessible properties through transactional scoped RPC',async()=>{expect((await POST(request({action:'bind',connection_id:connection,ga4:'123',gsc:'sc-domain:qa.example'}))).status).toBe(200);expect(rpc).toHaveBeenCalledWith('manage_google_binding',expect.objectContaining({actor:user,org,target_client:client,connection,operation:'bind',ga4:'123',gsc:'sc-domain:qa.example'}));expect(mocks.sync).not.toHaveBeenCalled();});
  it('disconnect is only a client mapping operation, never token revocation',async()=>{expect((await POST(request({action:'disconnect',connection_id:connection}))).status).toBe(200);expect(rpc).toHaveBeenCalledWith('manage_google_binding',expect.objectContaining({target_client:client,operation:'disconnect'}));expect(fetch).not.toHaveBeenCalled();expect(tables.google_connections[0].status).toBe('connected');});
  it('refuses shared revocation when DB reports dependents',async()=>{rpc.mockResolvedValue({error:{code:'23514'}});expect((await POST(request({action:'revoke',connection_id:connection}))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();});
  it('refresh revocation becomes needs_reconnection without leaking Google errors',async()=>{refreshFailure=true;const res=await GET(get(client,connection));expect(res.status).toBe(400);expect(await res.text()).not.toContain('DO NOT LEAK');expect(tables.google_connections[0].status).toBe('needs_reconnection');});
  it('transient refresh failure does not falsely claim revocation',async()=>{vi.mocked(fetch).mockResolvedValue(new Response('private body',{status:500}));await expect(oauthAccessToken(org,connection)).rejects.toMatchObject({code:'sync_error'});expect(tables.google_connections[0].status).toBe('connected');});
  it('Sync accepts only stored property context and completed dates',async()=>{expect((await POST(request({action:'sync',from:'2026-06-01',to:'2026-06-28',ga4:'999'}))).status).toBe(400);expect(mocks.sync).not.toHaveBeenCalled();expect((await POST(request({action:'sync',from:'2026-06-01',to:'2026-06-28'}))).status).toBe(200);expect(mocks.sync).toHaveBeenCalledWith(expect.anything(),client,{from:'2026-06-01',to:'2026-06-28'},process.env,org);});
});
describe('OAuth state, callbacks and cryptography',()=>{
  it('uses offline, read-only authorization with PKCE and random state',()=>{const a=authorization(),b=authorization(),url=new URL(a.url);expect(a.state).not.toBe(b.state);expect(url.searchParams.get('access_type')).toBe('offline');expect(url.searchParams.get('code_challenge_method')).toBe('S256');expect(url.searchParams.get('scope')).not.toMatch(/gmail|drive|calendar|analytics.edit/);expect(url.searchParams.has('client_secret')).toBe(false);});
  it('encrypts, authenticates, and binds ciphertext to organization/account',()=>{const value=seal('secret','org-a');expect(value).not.toContain('secret');expect(unseal(value,'org-a')).toBe('secret');expect(()=>unseal(value,'org-b')).toThrow(GoogleError);expect(()=>unseal(value.slice(0,-3)+'abc','org-a')).toThrow(GoogleError);});
  it('fails closed without configuration or a 32-byte key',()=>{vi.stubEnv('GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY','invalid');expect(()=>oauthConfig()).toThrow();});
  it('rejects non-local HTTP callback',()=>{vi.stubEnv('GOOGLE_OAUTH_REDIRECT_URI',`http://qa.example${CALLBACK_PATH}`);expect(()=>oauthConfig()).toThrow();});
  it('accepts the exact future Gro Production callback without weakening host checks',()=>{vi.stubEnv('GOOGLE_OAUTH_REDIRECT_URI',`https://gro.expert${CALLBACK_PATH}`);expect(oauthConfig()).toMatchObject({origin:'https://gro.expert',redirect:`https://gro.expert${CALLBACK_PATH}`});});
  it('writes state only as a hash and encrypted verifier',async()=>{const flow=await startGoogle(await googleContext(client));expect(tables.google_oauth_states[0].state_hash).toBe(hash(flow.state));expect(JSON.stringify(tables.google_oauth_states)).not.toContain(flow.state);});
  it('rejects state tampering',async()=>{const flow=await startGoogle(await googleContext(client));await expect(completeGoogle(flow.state,'wrong','code')).rejects.toMatchObject({code:'state'});expect(fetch).not.toHaveBeenCalled();});
  it('rejects callback without initiating session',async()=>{const flow=await startGoogle(await googleContext(client));signedIn=false;await expect(completeGoogle(flow.state,flow.state,'code')).rejects.toMatchObject({code:'forbidden'});expect(fetch).not.toHaveBeenCalled();});
  it('rejects same user in a different login session',async()=>{const flow=await startGoogle(await googleContext(client));sessionId='different';await expect(completeGoogle(flow.state,flow.state,'code')).rejects.toMatchObject({code:'state'});expect(fetch).not.toHaveBeenCalled();});
  it('rejects changed client organization',async()=>{const flow=await startGoogle(await googleContext(client));tables.clients[0].organization_id=foreignOrg;await expect(completeGoogle(flow.state,flow.state,'code')).rejects.toMatchObject({code:'forbidden'});});
  it('rejects expired state',async()=>{const flow=await startGoogle(await googleContext(client));tables.google_oauth_states[0].expires_at='2000-01-01';await expect(completeGoogle(flow.state,flow.state,'code')).rejects.toMatchObject({code:'state'});});
  it('preserves same-account refresh token and consumes callback once',async()=>{const encrypted=tables.google_connections[0].encrypted_refresh_token;const flow=await startGoogle(await googleContext(client));const result=await completeGoogle(flow.state,flow.state,'code');expect(result.connectionId).toBe(connection);expect(tables.google_connections[0].encrypted_refresh_token).toBe(encrypted);await expect(completeGoogle(flow.state,flow.state,'code')).rejects.toMatchObject({code:'state'});expect(mocks.sync).not.toHaveBeenCalled();});
  it('concurrent callback replay has one winner',async()=>{const flow=await startGoogle(await googleContext(client));const results=await Promise.allSettled([completeGoogle(flow.state,flow.state,'code'),completeGoogle(flow.state,flow.state,'code')]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);});
  it('does not preserve a different Google account refresh token',async()=>{const flow=await startGoogle(await googleContext(client),connection);const original=vi.mocked(fetch).getMockImplementation()!;vi.mocked(fetch).mockImplementation((...args)=>String(args[0]).includes('userinfo')?Promise.resolve(Response.json({sub:'another',email:'another@example.com',email_verified:true})):original(...args));await expect(completeGoogle(flow.state,flow.state,'code')).rejects.toMatchObject({code:'selection'});});
  it('callback strips sensitive parameters and returns client picker without syncing',async()=>{const flow=await startGoogle(await googleContext(client));const req=new NextRequest(`https://qa.example${CALLBACK_PATH}?code=private-code&state=${flow.state}`,{headers:{cookie:`g1000_google_oauth=${flow.state}`,host:'qa.example'}});const result=await callback(req);expect(result.status).toBe(303);expect(result.headers.get('location')).toBe(`https://qa.example/admin/clients/qa/integrations?connection=${connection}`);expect(result.headers.get('referrer-policy')).toBe('no-referrer');expect(mocks.sync).not.toHaveBeenCalled();});
  it('accepts a valid callback when Next reconstructs a localhost alias',async()=>{
    vi.stubEnv('GOOGLE_OAUTH_REDIRECT_URI',`http://127.0.0.1:3000${CALLBACK_PATH}`);
    const flow=await startGoogle(await googleContext(client));
    const req=new NextRequest(`http://localhost:3000${CALLBACK_PATH}?code=private-code&state=${flow.state}`,{headers:{cookie:`g1000_google_oauth=${flow.state}`,host:'127.0.0.1:3000','x-forwarded-proto':'http'}});
    const result=await callback(req);expect(result.status).toBe(303);expect(result.headers.get('location')).toBe(`http://127.0.0.1:3000/admin/clients/qa/integrations?connection=${connection}`);
  });
  it('rejects a callback delivered to an unexpected host before consuming state',async()=>{
    const flow=await startGoogle(await googleContext(client));
    const req=new NextRequest(`https://qa.example${CALLBACK_PATH}?code=private-code&state=${flow.state}`,{headers:{cookie:`g1000_google_oauth=${flow.state}`,host:'evil.example'}});
    expect((await callback(req)).status).toBe(400);expect(tables.google_oauth_states).toHaveLength(1);expect(fetch).not.toHaveBeenCalled();
  });
  it('local migration restricts token tables and serializes shared revocation',()=>{const sql=readFileSync('supabase/migrations/20260912105216_managed_google_oauth.sql','utf8');expect(sql).toContain('revoke all on public.google_connections,public.google_oauth_states from public,anon,authenticated');expect(sql).toContain('for update');expect(sql).toContain("status <> 'not_connected'");expect(sql).toContain("current_user not in ('service_role','postgres')");expect(sql).not.toMatch(/security definer/i);});
});
