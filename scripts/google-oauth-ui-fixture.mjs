// Local, synthetic UI fixture. Never connects to Supabase or Google; no credentials.
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const viteRequire=createRequire(createRequire(require.resolve('vitest/package.json')).resolve('vite/package.json'));
const {build}=viteRequire('esbuild');
const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {GoogleIntegration} from './src/components/google-integration';
createRoot(document.getElementById('root')).render(<GoogleIntegration clientId="40000000-0000-4000-8000-000000000001" clientName="Synthetic QA business" ready={!location.search.includes('disabled')} initial={{connections:location.search.includes('disabled')?[]:[{id:'60000000-0000-4000-8000-000000000001',account_email:'synthetic@example.invalid',status:'connected'}],integrations:[]}} initialRange={{from:'2026-06-01',to:'2026-06-28'}} />);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,outdir:'fixture-output',entryNames:'fixture',define:{'process.env.NODE_ENV':'"development"'},jsx:'automatic'});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text,css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
let integrations=[];
const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.url==='/fixture.js'){res.setHeader('Content-Type','text/javascript');res.end(js);return;}
  if(req.url==='/fixture.css'){res.setHeader('Content-Type','text/css');res.end(css);return;}
  if(req.url.startsWith('/api/integrations/google')){
    res.setHeader('Content-Type','application/json');
    if(req.method==='POST'){
      let raw='';for await(const chunk of req)raw+=chunk;
      const body=JSON.parse(raw);
      if(body.action==='connect'){res.end(JSON.stringify({error:'Synthetic fixture: real OAuth consent is intentionally not run.'}));return;}
      if(body.action==='bind')integrations=[{provider:'google_analytics',external_reference:body.ga4,status:body.ga4?'connected':'not_connected',google_connection_id:body.connection_id,auth_method:'google_oauth',last_synced_at:null},{provider:'search_console',external_reference:body.gsc,status:body.gsc?'connected':'not_connected',google_connection_id:body.connection_id,auth_method:'google_oauth',last_synced_at:null}];
      if(body.action==='disconnect')integrations=integrations.map(i=>({...i,status:'not_connected'}));
      res.end(JSON.stringify({ok:true}));return;
    }
    if(req.url.includes('connection_id='))res.end(JSON.stringify({ga4:[{id:'123',name:'Synthetic Analytics',account:'Synthetic QA account'}],gsc:[{id:'sc-domain:synthetic.example',permission:'siteFullUser'}]}));
    else res.end(JSON.stringify({connections:[{id:'60000000-0000-4000-8000-000000000001',account_email:'synthetic@example.invalid',status:'connected'}],integrations}));return;
  }
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><style>:root{--ink:#18201d;--muted:#6b7470;--line:#e5e9e6;--paper:#f5f7f5;--brand:#6554d9;--green:#147a58}*{box-sizing:border-box}body{margin:0;padding:20px;background:var(--paper);font-family:Arial,sans-serif}.button{font:inherit;padding:10px 15px;border:1px solid var(--brand);border-radius:8px;background:var(--brand);color:white;cursor:pointer}.button.secondary{background:white;color:var(--ink);border-color:var(--line)}@media(max-width:500px){body{padding:10px}}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`);
});
server.listen(3027,'127.0.0.1',()=>console.log('Synthetic Google UI fixture: http://127.0.0.1:3027 — no external services'));
