import { createHash, timingSafeEqual } from "node:crypto";

export const siteSecretHash=(value:string)=>createHash("sha256").update(value).digest("hex");
export function matchesSiteSecret(candidate:string,storedHash:string){const a=Buffer.from(siteSecretHash(candidate),"hex"),b=Buffer.from(storedHash,"hex");return b.length===a.length&&timingSafeEqual(a,b)}
export function normalizeOrigin(value:string|null){if(!value)return null;try{const url=new URL(value);return url.protocol==="https:"||url.protocol==="http:"?url.origin:null}catch{return null}}
export function originMatches(configured:string|null,requestOrigin:string|null){if(!requestOrigin)return true;if(!configured)return false;const expected=normalizeOrigin(configured),actual=normalizeOrigin(requestOrigin);return Boolean(expected&&actual&&expected===actual)}
export function obviousSpam(value:Record<string,unknown>){if(typeof value.company_website==="string"&&value.company_website.trim())return true;return(JSON.stringify(value).match(/https?:\/\//gi)??[]).length>5}
