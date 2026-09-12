import {describe,expect,it,vi} from "vitest";

vi.mock("server-only",()=>({}));
vi.mock("node:dns/promises",()=>({lookup:vi.fn(async(host:string)=>host==="public.example"?[{address:"93.184.216.34",family:4}]:host==="private.example"?[{address:"10.0.0.7",family:4}]:[{address:"::1",family:6}])}));
import {validatePublicHttpUrl,WEBSITE_INVENTORY_LIMITS,isInventoryPageUrl,robotsAllows,inspectWebsite} from "./website-inventory";

describe("website inventory SSRF guard",()=>{
 it.each(["http://localhost:3000","http://127.0.0.1","http://10.1.2.3","file:///etc/passwd","http://service.internal"])("rejects unsafe target %s",async value=>{await expect(validatePublicHttpUrl(value)).rejects.toThrow()});
 it("allows a verified public HTTP target",async()=>{await expect(validatePublicHttpUrl("https://public.example/path#x")).resolves.toMatchObject({hostname:"public.example",hash:""})});
 it("rejects cross-host crawl targets",async()=>{await expect(validatePublicHttpUrl("https://other.example","public.example")).rejects.toThrow(/cannot leave/)});
 it("keeps SME-safe crawl limits",()=>{expect(WEBSITE_INVENTORY_LIMITS.pages).toBeLessThanOrEqual(50);expect(WEBSITE_INVENTORY_LIMITS.requestTimeoutMs).toBeLessThanOrEqual(10_000);expect(WEBSITE_INVENTORY_LIMITS.maxBytes).toBeLessThanOrEqual(1_000_000)});
});

describe("bounded manual inventory", () => {
 it.each(["/account", "/auth/callback", "/dashboard/jobs", "/jobs?delete=1", "/apply/123", "/api/data", "/%6Cogin"])("excludes private/action URL %s", path => { expect(isInventoryPageUrl(new URL(path,"https://public.example"))).toBe(false); });
 it("permits meaningful public landing pages", () => { for(const path of ["/", "/candidates", "/employers", "/how-it-works", "/about", "/contact"]) expect(isInventoryPageUrl(new URL(path,"https://public.example"))).toBe(true); });
 it("respects disallow, specific agent groups and longest allow", () => {
  const robots="User-agent: *\nDisallow: /private\nAllow: /private/public\n";
  expect(robotsAllows(robots,new URL("https://public.example/private/secret"))).toBe(false);
  expect(robotsAllows(robots,new URL("https://public.example/private/public"))).toBe(true);
  expect(robotsAllows("User-agent: Growth1000WebsiteInventory\nDisallow: /\nUser-agent: *\nAllow: /",new URL("https://public.example/"))).toBe(false);
 });
 it("does not fetch restricted links and always inspects homepage", async () => {
  const fetchMock=vi.fn(async (url: URL) => {
   if(url.pathname==="/robots.txt") return new Response("User-agent: *\nDisallow: /private",{headers:{"content-type":"text/plain"}});
   if(url.pathname==="/sitemap.xml") return new Response("<urlset><url><loc>https://public.example/about</loc></url></urlset>",{headers:{"content-type":"application/xml"}});
   return new Response('<title>Public</title><h1>Public</h1><a href="/login">Login</a><a href="/private">Private</a><a href="/contact?submit=true">Action</a>',{headers:{"content-type":"text/html"}});
  });
  vi.stubGlobal("fetch",fetchMock);
  try { const result=await inspectWebsite("https://public.example"); expect(result.pages.map(page=>new URL(page.url).pathname)).toEqual(["/","/about"]); expect(result.skipped).toHaveLength(3); expect(fetchMock.mock.calls.map(([url])=>url.pathname)).not.toContain("/private"); } finally { vi.unstubAllGlobals(); }
 });
});
