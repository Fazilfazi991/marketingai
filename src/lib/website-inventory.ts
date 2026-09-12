import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- accepts the authenticated Supabase server client across schema versions. */

import {lookup} from "node:dns/promises";
import {createHash} from "node:crypto";

export const WEBSITE_INVENTORY_LIMITS={pages:40,sitemaps:4,requestTimeoutMs:8000,maxBytes:1_000_000} as const;

const privateV4=(ip:string)=>{
 const parts=ip.split(".").map(Number);if(parts.length!==4||parts.some(Number.isNaN))return false;
 const[a,b]=parts;return a===10||a===127||a===0||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a>=224;
};
const privateV6=(ip:string)=>{const value=ip.toLowerCase().replace(/^\[|\]$/g,"");return value==="::"||value==="::1"||value.startsWith("fc")||value.startsWith("fd")||value.startsWith("fe8")||value.startsWith("fe9")||value.startsWith("fea")||value.startsWith("feb")||value.startsWith("::ffff:127.")||value.startsWith("::ffff:10.")||value.startsWith("::ffff:192.168.")};

export async function validatePublicHttpUrl(raw:string,allowedHost?:string){
 let url:URL;try{url=new URL(raw)}catch{throw new Error("Website URL is invalid.")}
 if(!["http:","https:"].includes(url.protocol))throw new Error("Only public HTTP websites can be inspected.");
 if(url.username||url.password)throw new Error("Website URLs cannot contain credentials.");
 const host=url.hostname.toLowerCase().replace(/\.$/,"");
 if(!host||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host.endsWith(".internal"))throw new Error("Local or private websites cannot be inspected.");
 if(allowedHost&&host!==allowedHost&&host!==`www.${allowedHost}`&&allowedHost!==`www.${host}`)throw new Error("Inspection cannot leave the configured client website.");
 const addresses=await lookup(host,{all:true,verbatim:true});
 if(!addresses.length||addresses.some(({address,family})=>family===4?privateV4(address):privateV6(address)))throw new Error("Website resolved to a private or unsafe network address.");
 url.hash="";return url;
}

export function isInventoryPageUrl(url: URL) {
 let path: string; try { path = decodeURIComponent(url.pathname); } catch { return false; }
 return !url.search && !/(?:^|\/)(?:api|_next|admin|staff|dashboard|account|auth|login|logout|sign-in|signin|signup|sign-up|register|callback|reset-password|verify|apply|submit|upload|delete|unsubscribe|checkout|payment|cart|portal)(?:[/.\-]|$)/i.test(path);
}
export function robotsAllows(body: string, url: URL) {
 const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
 let current = { agents: [] as string[], rules: [] as { allow: boolean; path: string }[] };
 for (const raw of body.split(/\r?\n/)) {
  const line = raw.split('#')[0].trim(), split = line.indexOf(':'); if (split < 0) continue;
  const key = line.slice(0,split).toLowerCase(), value = line.slice(split+1).trim();
  if (key === 'user-agent') { if (current.rules.length) { groups.push(current); current = { agents: [], rules: [] }; } current.agents.push(value.toLowerCase()); }
  else if ((key === 'allow' || key === 'disallow') && value && current.agents.length) current.rules.push({ allow: key === 'allow', path: value });
 }
 groups.push(current);
 const specific = groups.filter(group => group.agents.some(agent => agent !== '*' && 'growth1000websiteinventory'.includes(agent)));
 const applicable = specific.length ? specific : groups.filter(group => group.agents.includes('*'));
 const matching = applicable.flatMap(group => group.rules).filter(rule => new RegExp('^' + rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')).test(url.pathname));
 matching.sort((a,b) => b.path.length-a.path.length || Number(b.allow)-Number(a.allow));
 return matching[0]?.allow ?? true;
}
async function boundedFetch(raw:string,allowedHost:string,accept:string,allowed?: (url: URL) => boolean){
 let current=await validatePublicHttpUrl(raw,allowedHost);
 for(let redirects=0;redirects<=3;redirects+=1){
  if (allowed && !allowed(current)) throw new Error("Skipped restricted public inventory URL.");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),WEBSITE_INVENTORY_LIMITS.requestTimeoutMs);
  try {
  const response=await fetch(current,{headers:{Accept:accept,"User-Agent":"Growth1000WebsiteInventory/1.0"},redirect:"manual",signal:controller.signal,cache:"no-store"});
  if([301,302,303,307,308].includes(response.status)){const location=response.headers.get("location");if(!location)throw new Error("Website returned an invalid redirect.");current=await validatePublicHttpUrl(new URL(location,current).toString(),allowedHost);continue}
  const length=Number(response.headers.get("content-length")||0);if(length>WEBSITE_INVENTORY_LIMITS.maxBytes)throw new Error("Website response exceeded the inspection size limit.");
  const reader=response.body?.getReader(), chunks: Uint8Array[]=[]; let bytes=0;
  if(reader) { for (;;) { const { done, value }=await reader.read(); if(done)break; bytes+=value.byteLength; if(bytes>WEBSITE_INVENTORY_LIMITS.maxBytes){await reader.cancel();throw new Error("Website response exceeded the inspection size limit.")} chunks.push(value); } }
  const body=Buffer.concat(chunks).toString("utf8");return{response,body,url:current};
  } finally { clearTimeout(timer); }
 }
 throw new Error("Website redirected too many times.");
}

const decode=(value:string)=>value.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const match=(html:string,pattern:RegExp)=>decode(pattern.exec(html)?.[1]??"");
const links=(html:string,base:URL)=>[...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)].flatMap(item=>{try{return[new URL(item[1],base).toString()]}catch{return[]}});
const sitemapUrls=(xml:string)=>[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(item=>decode(item[1]));
const robotsSitemaps=(body:string)=>body.split(/\r?\n/).flatMap(line=>/^sitemap:\s*(\S+)/i.exec(line)?.[1]?[RegExp.$1]:[]);
const classify=(url:URL,title:string)=>{const value=`${url.pathname} ${title}`.toLowerCase();if(url.pathname==="/"||!url.pathname)return"homepage";if(/blog|article|news|insight/.test(value))return"blog";if(/contact/.test(value))return"contact";if(/about|company|team/.test(value))return"about";if(/location|dubai|sharjah|abu-dhabi/.test(value))return"location";if(/service|renovation|design|fit-out|wardrobe|kitchen|solution/.test(value))return"service";if(/product|shop|catalog/.test(value))return"product";return"other"};

export type InspectedPage={url:string;canonicalUrl:string;title:string;metaDescription:string;h1:string;headings:string[];pageType:string;contentExcerpt:string;statusCode:number;indexable:boolean;contentHash:string};

export async function inspectWebsite(rootRaw:string):Promise<{rootUrl:string;discovered:number;pages:InspectedPage[];skipped:string[];failures:string[]}>{
 const root=await validatePublicHttpUrl(rootRaw),host=root.hostname.toLowerCase();
 const queue:string[]=[root.toString()],seen=new Set<string>(),sitemaps=new Set<string>([new URL("/sitemap.xml",root).toString()]);
 let robotsBody = "";
 try{const robots=await boundedFetch(new URL("/robots.txt",root).toString(),host,"text/plain"); if (robots.response.status !== 404 && !robots.response.ok) throw new Error("robots unavailable"); robotsBody = robots.response.status === 404 ? "" : robots.body; for(const item of robotsSitemaps(robots.body).slice(0,WEBSITE_INVENTORY_LIMITS.sitemaps))sitemaps.add(item)}catch{throw new Error("Unable to verify crawl permission from robots.txt.")}
 const allowed = (url: URL) => isInventoryPageUrl(url) && robotsAllows(robotsBody, url);
 if (!allowed(root)) throw new Error("Root website is not permitted for inventory.");
 for(const sitemap of [...sitemaps].slice(0,WEBSITE_INVENTORY_LIMITS.sitemaps)){try{const result=await boundedFetch(sitemap,host,"application/xml,text/xml");for(const item of sitemapUrls(result.body).slice(0,200))queue.push(item)}catch{}}
 if(!queue.length)queue.push(root.toString());
 const pages:InspectedPage[]=[]; const skipped: string[] = [], failures: string[] = [];
 while(queue.length&&seen.size<WEBSITE_INVENTORY_LIMITS.pages){const raw=queue.shift()!;let candidate:URL;try{candidate=await validatePublicHttpUrl(raw,host)}catch{continue}const key=candidate.toString().replace(/\/$/,"");if(seen.has(key))continue;seen.add(key); if (!allowed(candidate)) { skipped.push(candidate.toString()); continue; }
  try{const{response,body,url}=await boundedFetch(candidate.toString(),host,"text/html,application/xhtml+xml",allowed);const contentType=response.headers.get("content-type")??"";if(!contentType.includes("text/html")){skipped.push(candidate.toString());continue;}const canonicalRaw=/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["']/i.exec(body)?.[1]??/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*canonical/i.exec(body)?.[1];let canonical=url;try{if(canonicalRaw)canonical=await validatePublicHttpUrl(new URL(canonicalRaw,url).toString(),host)}catch{}
   const title=match(body,/<title[^>]*>([\s\S]*?)<\/title>/i),description=match(body,/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)||match(body,/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i),h1=match(body,/<h1[^>]*>([\s\S]*?)<\/h1>/i),headings=[...body.matchAll(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/gi)].map(item=>decode(item[1])).filter(Boolean).slice(0,20),text=decode(body.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"")),robots=match(body,/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i).toLowerCase();
   pages.push({url:url.toString(),canonicalUrl:canonical.toString(),title,metaDescription:description,h1,headings,pageType:classify(url,title),contentExcerpt:text.slice(0,5000),statusCode:response.status,indexable:response.ok&&!robots.includes("noindex"),contentHash:createHash("sha256").update(text).digest("hex")});
   if(pages.length<WEBSITE_INVENTORY_LIMITS.pages)for(const item of links(body,url)){try{const child=new URL(item);if(queue.length<200&&child.hostname.toLowerCase().replace(/^www\./,"")===host.replace(/^www\./,"")&&!seen.has(child.toString().replace(/\/$/,"")))queue.push(item)}catch{}}
  }catch{failures.push(candidate.toString())}
 }
 return{rootUrl:root.toString(),discovered:new Set([...seen,...queue.map(url=>url.replace(/\/$/,""))]).size,pages,skipped,failures};
}

export async function refreshWebsiteInventory(supabase:any,clientId:string,rootUrl:string,userId:string){
 const{data:run,error:runError}=await supabase.from("website_inventory_runs").insert({client_id:clientId,root_url:rootUrl,status:"running",created_by:userId}).select("id").single();if(runError)throw runError;
 try{const result=await inspectWebsite(rootUrl);for(const page of result.pages){const{error}=await supabase.from("seo_pages").upsert({client_id:clientId,url:page.url,canonical_url:page.canonicalUrl,title:page.title,meta_title:page.title,meta_description:page.metaDescription,h1:page.h1,headings:page.headings,page_type:page.pageType,content_excerpt:page.contentExcerpt,status_code:page.statusCode,indexable:page.indexable,content_hash:page.contentHash,last_inspected_at:new Date().toISOString(),inventory_run_id:run.id,status:page.indexable?"live":"needs_attention"},{onConflict:"client_id,url"});if(error)throw error}
  await supabase.from("website_inventory_runs").update({status:"completed",pages_discovered:result.discovered,pages_inspected:result.pages.length,finished_at:new Date().toISOString()}).eq("id",run.id);return result;
 }catch(error){await supabase.from("website_inventory_runs").update({status:"failed",finished_at:new Date().toISOString(),error_message:(error instanceof Error?error.message:"Inventory failed").slice(0,1000)}).eq("id",run.id);throw error}
}
