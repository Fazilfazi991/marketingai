import {describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {identifySeoOpportunities} from "./seo-intelligence-service";
const page={id:"1",url:"https://example.com/villa",canonical_url:"https://example.com/villa",title:"Villa renovation",meta_description:"Plan a villa renovation",h1:"Villa renovation",page_type:"service",indexable:true,last_inspected_at:"2026-09-01"};
describe("SEO intelligence",()=>{
 it("turns striking-distance evidence into an actionable recommendation",()=>{const result=identifySeoOpportunities({current:[{day:"2026-09-01",query:"villa renovation dubai",page:page.url,metrics:{clicks:8,impressions:200,position:12.6}}],previous:[],pages:[page],services:["Villa Renovation"],previousTitles:[]});expect(result[0]).toMatchObject({opportunityType:"striking_distance",priority:"high",targetUrl:page.url});expect(result[0].observed).toContain("200 impressions")});
 it("never invents an internal URL for a service gap",()=>{const result=identifySeoOpportunities({current:[],previous:[],pages:[],services:["Kitchen Renovation"],previousTitles:[]});expect(result[0]).toMatchObject({opportunityType:"service_support",targetUrl:null})});
 it("deduplicates previously recommended titles",()=>{const title="Strengthen villa renovation dubai coverage near page one",result=identifySeoOpportunities({current:[{day:"2026-09-01",query:"villa renovation dubai",page:page.url,metrics:{clicks:8,impressions:200,position:12.6}}],previous:[],pages:[page],services:["Villa Renovation"],previousTitles:[title]});expect(result.some(item=>item.title===title)).toBe(false)});
});
