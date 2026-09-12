// Read-only replay of the actual deterministic evidence functions on Preview rows.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { assertQaProject } from './qa-project-guard.mjs';
const ref=assertQaProject('cwamjlqqacjfppnqquuw');
const client='40000000-0000-4000-8000-000000000001';
const run='ebbccb68-53cb-487d-9971-42073e372f21';
const sql=`select json_build_object(
 'pages',(select coalesce(json_agg(p),'[]'::json) from (select id,client_id,url,title,meta_description,h1,status_code,indexable,last_inspected_at from seo_pages where inventory_run_id='${run}') p),
 'profile',(select description from business_profiles where client_id='${client}'),
 'ga4',(select count(*) from analytics_daily where client_id='${client}'),
 'gsc',(select count(*) from search_console_daily where client_id='${client}'),
 'seo',(select count(*) from seo_keywords where client_id='${client}'),
 'otherOwners',(select count(*) from seo_pages where inventory_run_id='${run}' and client_id<>'${client}'),
 'demo',(select is_demo from clients where id='${client}')) as audit`;
const output=execFileSync('powershell.exe',['-NoProfile','-Command',`npx.cmd --no-install supabase db query --linked --project-ref ${ref} "${sql.replace(/\s+/g,' ').replaceAll('"','`"')}"`],{encoding:'utf8',windowsHide:true});
const data=JSON.parse(output.slice(output.indexOf('{'))).rows[0].audit;
assert.equal(data.demo,false); assert.equal(data.otherOwners,0); assert.ok(data.pages.length>0);
assert.ok(data.pages.every(row=>row.client_id===client && ['kaamcareer.com','www.kaamcareer.com'].includes(new URL(row.url).hostname)));
async function load(path) { const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64')); }
const {newEvidence,addWebsiteEvidence}=await load('src/lib/growth-agent/evidence.ts');
const {growthCapability}=await load('src/lib/growth-agent/capability.ts');
const {routeGrowthIntent}=await load('src/lib/growth-agent/intent.ts');
const evidence=newEvidence(); addWebsiteEvidence(evidence,data.pages);
evidence.sources={business:{state:data.profile?'available':'missing',through:null},website:{state:'available',through:data.pages.map(row=>row.last_inspected_at).sort().at(-1)},analytics:{state:data.ga4?'available':'missing',through:null},search:{state:data.gsc?'available':'missing',through:null},seo:{state:data.seo?'available':'missing',through:null}};
assert.equal(data.ga4,0); assert.equal(data.gsc,0);
assert.ok(evidence.facts.every(fact=>fact.source==='website' && data.pages.some(row=>fact.id.startsWith('website.'+row.id))));
assert.ok(evidence.recommendations.every(rec=>rec.evidenceIds.every(id=>evidence.facts.some(fact=>fact.id===id))));
const matrix=['How is my website?','Which pages need attention?','What should we inspect first?','What information are you missing?','How are we doing on Google?','Why did traffic change?'].map(question=>({question,...growthCapability({question,intent:routeGrowthIntent(question),evidence})}));
console.log(JSON.stringify({checkedAt:new Date().toISOString(),client,run,inspectedRows:data.pages.length,ownershipVerified:true,googleRows:{ga4:data.ga4,gsc:data.gsc},evidence,matrix},null,2));
