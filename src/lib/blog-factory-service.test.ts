import {describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {selectBlogCandidates} from "./blog-factory-service";
const opportunity=(id:string,query:string)=>({id,title:`Support ${query}`,affected_query:query,target_url:"https://example.com/service",opportunity_type:"striking_distance",evidence:{impressions:100},recommendation:"Publish useful supporting guidance",impact:"high"});
describe("blog topic selection",()=>{
 it("uses evidence-backed unique topics",()=>{expect(selectBlogCandidates({opportunities:[opportunity("1","villa renovation dubai"),opportunity("2","kitchen renovation dubai")],existingTopics:[],count:2})).toHaveLength(2)});
 it("prevents duplicate intent and quota filler",()=>{const result=selectBlogCandidates({opportunities:[opportunity("1","villa renovation dubai")],existingTopics:["guide to villa renovation dubai"],count:2});expect(result).toEqual([])});
 it("does not turn metadata repairs into articles",()=>{expect(selectBlogCandidates({opportunities:[{...opportunity("1","villa renovation"),opportunity_type:"metadata"}],existingTopics:[],count:1})).toEqual([])});
});
