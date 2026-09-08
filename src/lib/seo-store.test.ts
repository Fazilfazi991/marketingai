import { describe,expect,it } from "vitest";
import { addBlog,addKeyword,getBlogSnapshot,getKeywordSnapshot,getOpportunitySnapshot,updateBlog,updateOpportunity } from "./seo-store";

describe("blog and SEO operations",()=>{
 it("moves a reviewed blog into the manual publishing queue",()=>{
  updateBlog(1,{status:"Ready to publish"});
  expect(getBlogSnapshot().find(x=>x.id===1)?.status).toBe("Ready to publish");
 });
 it("creates research and keyword records with safe initial states",()=>{
  const blogCount=getBlogSnapshot().length,keywordCount=getKeywordSnapshot().length;
  addBlog({title:"Dubai renovation planning",keyword:"renovation planning dubai",intent:"Informational",brief:"Verified planning guidance."});
  addKeyword({keyword:"renovation planning dubai",intent:"Informational",url:"/guides/renovation-planning",current:35,previous:35,priority:"Medium",status:"Tracking",notes:"New opportunity."});
  expect(getBlogSnapshot()).toHaveLength(blogCount+1);
  expect(getBlogSnapshot()[0].status).toBe("Research");
  expect(getKeywordSnapshot()).toHaveLength(keywordCount+1);
 });
 it("tracks opportunity progress",()=>{
  updateOpportunity(2,{status:"In progress"});
  expect(getOpportunitySnapshot().find(x=>x.id===2)?.status).toBe("In progress");
 });
});
