import {describe,expect,it,vi} from "vitest";

vi.mock("server-only",()=>({}));
vi.mock("node:dns/promises",()=>({lookup:vi.fn(async(host:string)=>host==="public.example"?[{address:"93.184.216.34",family:4}]:host==="private.example"?[{address:"10.0.0.7",family:4}]:[{address:"::1",family:6}])}));
import {validatePublicHttpUrl,WEBSITE_INVENTORY_LIMITS} from "./website-inventory";

describe("website inventory SSRF guard",()=>{
 it.each(["http://localhost:3000","http://127.0.0.1","http://10.1.2.3","file:///etc/passwd","http://service.internal"])("rejects unsafe target %s",async value=>{await expect(validatePublicHttpUrl(value)).rejects.toThrow()});
 it("allows a verified public HTTP target",async()=>{await expect(validatePublicHttpUrl("https://public.example/path#x")).resolves.toMatchObject({hostname:"public.example",hash:""})});
 it("rejects cross-host crawl targets",async()=>{await expect(validatePublicHttpUrl("https://other.example","public.example")).rejects.toThrow(/cannot leave/)});
 it("keeps SME-safe crawl limits",()=>{expect(WEBSITE_INVENTORY_LIMITS.pages).toBeLessThanOrEqual(50);expect(WEBSITE_INVENTORY_LIMITS.requestTimeoutMs).toBeLessThanOrEqual(10_000);expect(WEBSITE_INVENTORY_LIMITS.maxBytes).toBeLessThanOrEqual(1_000_000)});
});
