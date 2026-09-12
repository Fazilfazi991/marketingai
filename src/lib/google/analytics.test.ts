import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only',()=>({}));
const mocks = vi.hoisted(()=>({json:vi.fn()}));
vi.mock('./oauth-core',()=>({googleJson:mocks.json}));
import { fetchGa4Report, fetchSearchConsoleReport } from './analytics';

beforeEach(()=>{ mocks.json.mockReset(); });

describe('Google aggregate fetch contracts',()=>{
  it('requests independent GA4 date totals and page rows',async()=>{
    mocks.json.mockImplementation(async (_url:string,init:RequestInit)=>{
      const body=JSON.parse(String(init.body));
      return body.dimensions.length===1
        ? {rowCount:1,rows:[{dimensionValues:[{value:'20260601'}],metricValues:[{value:'4'},{value:'2'},{value:'6'},{value:'14'}]}]}
        : {rowCount:2,rows:[{dimensionValues:[{value:'20260601'},{value:'/one'}],metricValues:[]},{dimensionValues:[{value:'20260601'},{value:'/two'}],metricValues:[]}]};
    });
    const result=await fetchGa4Report({accessToken:'test',ga4PropertyId:'123',searchConsoleSiteUrl:''},{from:'2026-06-01',to:'2026-06-28'});
    expect(result.dailyRows).toHaveLength(1);expect(result.rows).toHaveLength(2);expect(result.pagePaginationComplete).toBe(true);
    const bodies=mocks.json.mock.calls.map(call=>JSON.parse(String(call[1].body)));
    expect(bodies.some(body=>body.dimensions.map((d:{name:string})=>d.name).join(',')==='date')).toBe(true);
    expect(bodies.some(body=>body.dimensions.map((d:{name:string})=>d.name).join(',')==='date,pagePath')).toBe(true);
  });

  it('pages Search Console until an empty page and records the provider limitation',async()=>{
    const full=Array.from({length:25000},(_,index)=>({keys:['2026-06-01',`q${index}`,'https://qa.example/'],clicks:1,impressions:2,ctr:.5,position:1}));
    mocks.json.mockResolvedValueOnce({rows:full}).mockResolvedValueOnce({rows:[{keys:['2026-06-02','last','https://qa.example/'],clicks:1,impressions:2,ctr:.5,position:1}]}).mockResolvedValueOnce({rows:[]});
    const result=await fetchSearchConsoleReport({accessToken:'test',ga4PropertyId:'',searchConsoleSiteUrl:'sc-domain:qa.example'},{from:'2026-06-01',to:'2026-06-28'});
    expect(result.rows).toHaveLength(25001);expect(result.pageRequests).toBe(3);expect(result.paginationComplete).toBe(true);
    const starts=mocks.json.mock.calls.map(call=>JSON.parse(String(call[1].body)).startRow);
    expect(starts).toEqual([0,25000,25001]);
  });
});
