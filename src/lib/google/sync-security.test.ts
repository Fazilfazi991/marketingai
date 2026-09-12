import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), admin: vi.fn(), token: vi.fn(), oauth:vi.fn(), ga: vi.fn(), gsc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.session }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("./service-account", () => ({ getGoogleAccessToken: mocks.token }));
vi.mock('./oauth-service',()=>({oauthAccessToken:mocks.oauth}));
vi.mock("./analytics", () => ({ fetchGa4Report: mocks.ga, fetchSearchConsoleReport: mocks.gsc }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { POST } from "@/app/api/automations/google-sync/route";
import { syncGoogleNow } from "@/app/admin/automations/actions";

const org = "10000000-0000-4000-8000-000000000001";
const otherOrg = "10000000-0000-4000-8000-000000000002";
const own = "40000000-0000-4000-8000-000000000001";
const other = "40000000-0000-4000-8000-000000000002";
type Row = Record<string, unknown>;
let rows: Record<string, Row[]>;
let writes: string[];
let payloads: {table:string;value:unknown}[];
// Intentionally NO simulated RLS: only predicates issued by the real boundary isolate rows.
function database() {
  return { auth: { getUser: async () => ({ data: { user: { id: "admin" } }, error: null }) }, from(table: string) {
    let selected = [...(rows[table] ?? [])];
    let writing = false;
    const finish = () => ({ data: selected, error: null });
    const query = {
      select() { return query; },
      eq(key: string, value: unknown) { selected = selected.filter(row => row[key] === value); return query; },
      in(key: string, values: unknown[]) { selected = selected.filter(row => values.includes(row[key])); return query; },
      is(key: string, value: unknown) { selected = selected.filter(row => row[key] === value); return query; },
      order() { return query; }, limit(n: number) { selected = selected.slice(0, n); return query; },
      single: async () => ({ data: selected.length === 1 ? selected[0] : null, error: null }),
      maybeSingle: async () => ({ data: selected.length === 1 ? selected[0] : null, error: null }),
      update(value:unknown) { writing = true; payloads.push({table,value}); return query; }, insert(value:unknown) { writing = true; payloads.push({table,value}); return query; }, upsert(value:unknown) { writing = true; payloads.push({table,value}); return query; },
      then(resolve: (result: ReturnType<typeof finish>) => unknown) { if (writing) writes.push(table); return Promise.resolve(finish()).then(resolve); },
    };
    return query;
  } };
}
const request = (id: string | undefined = own, headers: Record<string, string> = {}) => new NextRequest("https://qa.example/api/automations/google-sync", { method: "POST", headers: { origin: "https://qa.example", ...headers }, body: JSON.stringify({ ...(id ? { client_id: id } : {}), from: "2026-06-01", to: "2026-06-28" }) });
beforeEach(() => {
  vi.clearAllMocks(); vi.unstubAllEnvs(); writes = [];payloads=[];
  rows = {
    organization_members: [{ user_id: "admin", role: "admin", status: "active", organization_id: org }],
    clients: [own, other].map((id, index) => ({ id, organization_id: index ? otherOrg : org, is_demo: false, lifecycle_status: "active", deleted_at: null })),
    client_integrations: [own, other].map(client_id => ({ id: client_id, client_id, provider: "google_analytics", status: "connected", external_reference: "123", configuration: { propertyId: "123" } })),
  };
  mocks.session.mockResolvedValue(database()); mocks.admin.mockReturnValue(database());
  mocks.token.mockResolvedValue("test-only-token"); mocks.ga.mockResolvedValue({ rows: [] }); mocks.gsc.mockResolvedValue({ rows: [] });
  mocks.oauth.mockResolvedValue('test-only-oauth-token');
});
describe("actual Google sync authorization boundary", () => {
  it("allows own eligible client without escalating to service role", async () => { expect((await POST(request())).status).toBe(200); expect(mocks.ga).toHaveBeenCalledOnce(); expect(mocks.admin).not.toHaveBeenCalled(); });
  it("rejects another organization's client even without RLS", async () => { expect((await POST(request(other))).status).toBe(403); expect(mocks.token).not.toHaveBeenCalled(); expect(writes).toEqual([]); });
  it.each(["forged", "40000000-0000-4000-8000-000000000099"])("rejects forged ID %s", async id => { expect([400,403]).toContain((await POST(request(id))).status); expect(mocks.token).not.toHaveBeenCalled(); });
  it("rejects missing membership", async () => { rows.organization_members = []; expect((await POST(request())).status).toBe(401); expect(mocks.token).not.toHaveBeenCalled(); });
  it.each([["admin", "inactive"], ["staff", "active"], ["staff", "inactive"]])("rejects %s %s", async (role, status) => { Object.assign(rows.organization_members[0], { role, status }); expect((await POST(request())).status).toBe(401); expect(writes).toEqual([]); });
  it.each([{ deleted_at: "2026-01-01" }, { is_demo: true }, { lifecycle_status: "inactive" }])("rejects ineligible client %j", async change => { Object.assign(rows.clients[0], change); expect((await POST(request())).status).toBe(403); expect(mocks.token).not.toHaveBeenCalled(); });
  it.each([{ integrations: [] }, { integrations: [{ provider: "google_analytics", external_reference: "invalid" }] }, { integrations: [{ provider: "search_console", external_reference: "not-a-property" }] }])("rejects missing/invalid integration before credentials or writes", async ({ integrations }) => { rows.client_integrations = integrations.map(row => ({ ...row, client_id: own, status: "connected" })); expect((await POST(request())).status).toBe(207); expect(mocks.token).not.toHaveBeenCalled(); expect(writes).toEqual([]); });
  it("batch mode stays inside the caller organization", async () => { const response = await POST(request("")); const result = await response.json(); expect(result.clients.map((row: {client_id: string}) => row.client_id)).toEqual([own]); });
  it("webhook fails closed without server-side organization scope", async () => { vi.stubEnv("N8N_WEBHOOK_SECRET", "test-secret"); vi.stubEnv("GOOGLE_SYNC_ORGANIZATION_ID", ""); expect((await POST(request(own, { "x-growth1000-key": "test-secret" }))).status).toBe(401); expect(mocks.admin).not.toHaveBeenCalled(); });
  it("service-role webhook cannot cross configured organization", async () => { vi.stubEnv("N8N_WEBHOOK_SECRET", "test-secret"); vi.stubEnv("GOOGLE_SYNC_ORGANIZATION_ID", org); expect((await POST(request(other, { "x-growth1000-key": "test-secret" }))).status).toBe(403); expect(mocks.token).not.toHaveBeenCalled(); });
  it("scoped admin action rejects other org and keeps session RLS for own client", async () => { expect((await syncGoogleNow(other)).ok).toBe(false); expect(mocks.token).not.toHaveBeenCalled(); expect((await syncGoogleNow(own)).ok).toBe(true); expect(mocks.admin).not.toHaveBeenCalled(); });
  it('OAuth sync uses authorized organization and stored connection, never service-account credentials',async()=>{
    vi.stubEnv('GOOGLE_OAUTH_ENABLED','true');Object.assign(rows.client_integrations[0],{auth_method:'google_oauth',google_connection_id:own,configuration:{propertyId:'123',authMethod:'google_oauth'}});
    mocks.ga.mockResolvedValue({rows:[{dimensionValues:[{value:'20260601'},{value:'/page'}],metricValues:[{value:'0'},{value:'0'},{value:'0'},{value:'0'}]}],dailyRows:[{dimensionValues:[{value:'20260601'}],metricValues:[{value:'0'},{value:'0'},{value:'0'},{value:'0'}]}],pagePaginationComplete:true});
    expect((await POST(request())).status).toBe(200);expect(mocks.token).not.toHaveBeenCalled();expect(mocks.oauth).toHaveBeenCalledWith(org,own,process.env);
    const points=payloads.filter(p=>['analytics_daily','analytics_page_daily'].includes(p.table));expect(points).toHaveLength(2);
    for(const item of points)expect(item.value).toEqual([expect.objectContaining({client_id:own,users:0,page_views:0})]);
    expect(JSON.stringify(payloads)).not.toContain('test-only-oauth-token');
  });
  it('uses the date-only GA4 report for site totals instead of summing non-additive page metrics',async()=>{
    vi.stubEnv('GOOGLE_OAUTH_ENABLED','true');Object.assign(rows.client_integrations[0],{auth_method:'google_oauth',google_connection_id:own,configuration:{propertyId:'123',authMethod:'google_oauth'}});
    mocks.ga.mockResolvedValue({rows:[
      {dimensionValues:[{value:'20260601'},{value:'/one'}],metricValues:[{value:'3'},{value:'2'},{value:'4'},{value:'8'}]},
      {dimensionValues:[{value:'20260601'},{value:'/two'}],metricValues:[{value:'3'},{value:'1'},{value:'4'},{value:'6'}]},
    ],dailyRows:[{dimensionValues:[{value:'20260601'}],metricValues:[{value:'4'},{value:'2'},{value:'6'},{value:'14'}]}],pagePaginationComplete:true});
    expect((await POST(request())).status).toBe(200);
    const daily = payloads.find(p=>p.table==='analytics_daily')?.value as Row[];
    const pages = payloads.find(p=>p.table==='analytics_page_daily')?.value as Row[];
    expect(daily).toEqual([expect.objectContaining({users:4,new_users:2,sessions:6,page_views:14})]);
    expect(pages).toHaveLength(2);
    expect(pages.reduce((n,row)=>n+Number(row.users),0)).toBe(6);
  });
  it.each([undefined,'',' ', 'NaN'])('missing GA4 metric %s never becomes a zero observation',async value=>{
    mocks.ga.mockResolvedValue({rows:[{dimensionValues:[{value:'20260601'},{value:'/page'}],metricValues:[{value},{value:'0'},{value:'0'},{value:'1'}]}]});
    expect((await POST(request())).status).toBe(207);expect(payloads.filter(p=>p.table.startsWith('analytics_'))).toEqual([]);
  });
  it('missing Search Console metric is not zero-coerced',async()=>{
    Object.assign(rows.client_integrations[0],{provider:'search_console',external_reference:'sc-domain:qa.example',configuration:{siteUrl:'sc-domain:qa.example'}});
    mocks.gsc.mockResolvedValue({rows:[{keys:['2026-06-01','query','https://qa.example/'],clicks:undefined,impressions:10,ctr:0,position:1}]});
    expect((await POST(request())).status).toBe(207);expect(payloads.some(p=>p.table==='search_console_daily')).toBe(false);
  });
  it('no observations writes no invented historical rows',async()=>{expect((await POST(request())).status).toBe(200);expect(payloads.some(p=>p.table.startsWith('analytics_'))).toBe(false);});
  it('OAuth-marked source fails closed while feature is disabled',async()=>{rows.client_integrations[0].configuration={propertyId:'123',authMethod:'google_oauth'};expect((await POST(request())).status).toBe(207);expect(mocks.token).not.toHaveBeenCalled();});
});
