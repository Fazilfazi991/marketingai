import { createHash, timingSafeEqual } from "node:crypto";

export const siteSecretHash=(value:string)=>createHash("sha256").update(value).digest("hex");
export function matchesSiteSecret(candidate:string,storedHash:string){const a=Buffer.from(siteSecretHash(candidate),"hex"),b=Buffer.from(storedHash,"hex");return b.length===a.length&&timingSafeEqual(a,b)}
export function originMatches(configured:string|null,requestOrigin:string|null){if(!configured||!requestOrigin)return true;try{return new URL(configured).origin===new URL(requestOrigin).origin}catch{return false}}
export function obviousSpam(value:Record<string,unknown>){if(typeof value.company_website==="string"&&value.company_website.trim())return true;return(JSON.stringify(value).match(/https?:\/\//gi)??[]).length>5}
