// Deterministic Phase 3A evidence/benchmark preparation. No provider calls and no database writes.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { assertQaProject } from './qa-project-guard.mjs';

const ref=assertQaProject('cwamjlqqacjfppnqquuw');
const client='40000000-0000-4000-8000-000000000001';
const output=resolve(process.env.PHASE3A_BENCHMARK_OUTPUT ?? '');
if (!process.env.PHASE3A_BENCHMARK_OUTPUT || output.startsWith(resolve(process.cwd()))) throw new Error('Benchmark output must be an explicit path outside the repository.');
const sql=`select json_build_object(
 'client',(select row_to_json(c) from (select id,name,organization_id,is_demo,lifecycle_status,deleted_at from clients where id='${client}') c),
 'profile',(select row_to_json(b) from (select description,target_customers,value_proposition,tone_of_voice,offers,important_claims,prohibited_claims from business_profiles where client_id='${client}') b),
 'services',(select coalesce(json_agg(s),'[]'::json) from (select name from business_services where client_id='${client}' and status='active' order by id limit 20) s),
 'locations',(select coalesce(json_agg(l),'[]'::json) from (select name from business_locations where client_id='${client}' and status='active' order by id limit 20) l),
 'faqs',(select coalesce(json_agg(f),'[]'::json) from (select question,answer from business_faqs where client_id='${client}' and verified=true order by id limit 5) f),
 'pages',(select coalesce(json_agg(p),'[]'::json) from (select id,url,title,meta_description,h1,status_code,indexable,last_inspected_at from seo_pages where client_id='${client}' order by id) p),
 'analytics',(select coalesce(json_agg(a),'[]'::json) from (select day,metrics from analytics_daily where client_id='${client}' and source='google_analytics' and is_demo=false order by day) a),
 'search',(select coalesce(json_agg(g),'[]'::json) from (select id,day,query,page,metrics from search_console_daily where client_id='${client}' and source='search_console' and is_demo=false order by day,id) g),
 'reports',(select count(*) from reports where client_id='${client}'),
 'imports',(select coalesce(json_agg(i),'[]'::json) from (select source,date_from,date_to,row_count,coverage,imported_at from data_imports where client_id='${client}' order by imported_at) i)
) as snapshot`;
const queryStarted=Date.now();
const raw=execFileSync('powershell.exe',['-NoProfile','-Command',`npx.cmd --no-install supabase db query --linked --project-ref ${ref} "${sql.replace(/\s+/g,' ').replaceAll('"','`"')}"`],{encoding:'utf8',windowsHide:true,maxBuffer:5_000_000});
const queryDurationMs=Date.now()-queryStarted;
const data=JSON.parse(raw.slice(raw.indexOf('{'))).rows[0].snapshot;
assert.equal(data.client.id,client);assert.equal(data.client.is_demo,false);assert.equal(data.client.deleted_at,null);assert.equal(data.client.lifecycle_status,'active');
assert.equal(data.reports,0);assert.equal(data.pages.length,8);assert.ok(data.analytics.length>0);assert.ok(data.search.length>0);

async function load(path) {
  const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const {newEvidence,addWebsiteEvidence,addSearchEvidence,metricFact}=await load('src/lib/growth-agent/evidence.ts');
const {growthCapability}=await load('src/lib/growth-agent/capability.ts');
const {routeGrowthIntent}=await load('src/lib/growth-agent/intent.ts');
const calculationStarted=Date.now();
const evidence=newEvidence();
const analyticsPeriod={from:'2026-08-15',to:'2026-09-11'},searchPeriod={from:'2026-08-14',to:'2026-09-10'};
for(const [key,label] of [['activeUsers','GA4 daily active users'],['sessions','GA4 daily sessions'],['screenPageViews','GA4 daily page views']]) {
  const fact=metricFact(`analytics.${key}`,'analytics',label,data.analytics.map(row=>({day:row.day,value:row.metrics?.[key]})),analyticsPeriod);
  if(fact)evidence.facts.push(fact);
}
addSearchEvidence(evidence,data.search.map(row=>({day:row.day,query:row.query,page:row.page,clicks:row.metrics?.clicks,impressions:row.metrics?.impressions,position:row.metrics?.position})),searchPeriod);
addWebsiteEvidence(evidence,data.pages);
evidence.sources={
  business:{state:data.profile?'available':'missing',through:null},
  website:{state:'available',through:data.pages.map(row=>row.last_inspected_at).filter(Boolean).sort().at(-1) ?? null},
  analytics:{state:'available',through:data.analytics.map(row=>row.day).sort().at(-1)},
  search:{state:'available',through:data.search.map(row=>row.day).sort().at(-1)},
  seo:{state:'missing',through:null},history:{state:'missing',through:null},
};
evidence.limitations.push('GA4 has 16 observed days in the requested 56-day window; unreturned days remain missing, not zero.');
evidence.limitations.push('Search Console has 14 observed days and 34 stored query/page rows; provider pagination was exhausted, but Google does not guarantee an exhaustive export.');
evidence.limitations.push('GA4 daily totals use a date-only report; page-level active users and sessions are not additive site totals.');
const business={name:data.client.name,description:data.profile?.description ?? '',services:data.services.map(row=>row.name),locations:data.locations.map(row=>row.name),targetCustomers:data.profile?.target_customers ?? '',valueProposition:data.profile?.value_proposition ?? '',offers:data.profile?.offers ?? '',importantClaims:data.profile?.important_claims ?? '',prohibitedClaims:data.profile?.prohibited_claims ?? '',tone:data.profile?.tone_of_voice ?? '',verifiedFaqs:data.faqs};
const contextFor=question=>({scope:{clientId:client,organizationId:data.client.organization_id,userId:'benchmark-only'},question,intent:routeGrowthIntent(question),business,evidence:structuredClone(evidence),conversation:[],contextDurationMs:queryDurationMs});
const capabilityQuestions={
  website_health:'How is my website health?',website_performance:'How is my website performing?',google_visibility:'How are we doing on Google?',organic_change:'What changed compared with the previous 28 days?',page_opportunity:'Which page should we improve first?',query_opportunity:'Which Google searches have the biggest opportunity?',recommendations:'What should I focus on this week?',missing_data:'What information are you still missing?'
};
const stateLabel=state=>({supported:'SUPPORTED',limited:'PARTIALLY SUPPORTED',insufficient_data:'INSUFFICIENT DATA',unsupported:'OUT OF SCOPE',request:'OUT OF SCOPE'}[state]);
const capability=Object.fromEntries(Object.entries(capabilityQuestions).map(([id,question])=>{const result=growthCapability(contextFor(question));return[id,{status:stateLabel(result.state),reason:result.reason}]}));
capability.ads={status:'OUT OF SCOPE',reason:'No paid advertising evidence is ingested.'};
capability.whatsapp={status:'OUT OF SCOPE',reason:'No WhatsApp evidence is ingested.'};
const sourceFacts=source=>evidence.facts.filter(fact=>source.includes(fact.source)).map(fact=>fact.id);
const commonForbidden=['Do not claim a missing day had zero traffic.','Do not sum page-level users or sessions as unique site totals.','Do not claim Search Console rows are exhaustive.','Do not attribute causation to an observed correlation.','Do not claim conversions, leads, ads or WhatsApp outcomes without evidence.'];
const specs=[
  {id:'website-performance',question:'How is my website performing?',sources:['analytics','website'],optionalInterpretations:['Describe the available traffic snapshot and bounded website inventory without implying trend or causality.']},
  {id:'google-performance',question:'How are we doing on Google?',sources:['search'],optionalInterpretations:['Describe measured visibility and evidence-linked opportunity while treating Search Console coverage as incomplete.']},
  {id:'page-priority',question:'Which page should I improve first?',sources:['website','search'],optionalInterpretations:['Select a page only through an allowed recommendation whose evidence references are present.']},
  {id:'query-opportunity',question:'Which search query has the strongest opportunity?',sources:['search'],optionalInterpretations:['Use the supplied impression-weighted opportunity ordering; do not present it as an exhaustive query universe.']},
  {id:'current-focus',question:'What should I focus on right now?',sources:['website','analytics','search'],optionalInterpretations:['Offer only an evidence-linked current priority; do not imply a weekly comparison or guaranteed result.']},
  {id:'current-data-summary',question:'What can you tell me from the data we currently have?',sources:['business','website','analytics','search'],optionalInterpretations:['Summarize what is measured and distinguish every limitation from an observed zero.']},
  {id:'missing-evidence',question:'What information are you missing?',sources:['business','website','analytics','search'],optionalInterpretations:['Explain missing comparable history, incomplete source coverage, and unavailable conversion or attribution evidence.']},
  {id:'period-improvement',question:'Has my traffic improved compared with the previous period?',sources:['analytics','search'],optionalInterpretations:['State that the comparison cannot be made because a complete comparable previous period is unavailable.']},
];
const cases=specs.map(({id,question,sources,optionalInterpretations})=>{
  const evidenceReferences=sourceFacts(sources);
  const allowedRecommendationIds=evidence.recommendations.filter(rec=>rec.evidenceIds.every(factId=>evidenceReferences.includes(factId))).map(rec=>rec.id);
  return {
    id,question,context:contextFor(question),dataSourcesUsed:sources,
    evidenceReferences,
    mandatoryFacts:evidenceReferences.map(factId=>({factId})),
    optionalInterpretations,
    allowedRecommendationIds,
    missingDataDisclosures:evidence.limitations,
    prohibitedClaims:commonForbidden,
  };
});
const evidenceCalculationMs=Date.now()-calculationStarted;
const snapshotDigest=createHash('sha256').update(JSON.stringify({business,pages:data.pages,analytics:data.analytics,search:data.search,evidence})).digest('hex');
const artifact={createdAt:new Date().toISOString(),projectRef:ref,clientId:client,snapshotDigest,periods:{analytics:{requested:{from:'2026-07-18',to:'2026-09-11'},current:analyticsPeriod,previous:{from:'2026-07-18',to:'2026-08-14'}},search:{requested:{from:'2026-07-17',to:'2026-09-10'},current:searchPeriod,previous:{from:'2026-07-17',to:'2026-08-13'}}},business,evidence,capability,cases,providerCallsMade:false,performance:{contextConstructionMs:queryDurationMs,evidenceCalculationMs}};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(artifact,null,2),{encoding:'utf8',mode:0o600});
console.log(JSON.stringify({artifact:output,snapshotDigest,counts:{websitePages:data.pages.length,analyticsDays:data.analytics.length,searchRows:data.search.length,facts:evidence.facts.length,recommendations:evidence.recommendations.length,benchmarks:cases.length},capability,benchmarkQuestions:cases.map(item=>item.question),performance:artifact.performance,providerCallsMade:false},null,2));
