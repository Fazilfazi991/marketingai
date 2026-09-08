"use client";
import { useSyncExternalStore } from "react"; import { posts as seed } from "./demo-data";
export type SocialStatus="Idea"|"Generating"|"Needs review"|"Approved"|"Ready to schedule"|"Scheduled"|"Published"|"Issue";
export type SocialPost={id:number;client:string;month:string;date:string;time:string;platform:string;contentType:string;topic:string;concept:string;caption:string;hashtags:string;creativeBrief:string;notes:string;issueNote:string;status:SocialStatus;color:string;history:string[]};
let current:SocialPost[]=seed.map(p=>({...p,client:"ABC Interiors",month:"November 2026",contentType:p.platform.includes("Instagram")?"Carousel":"Single image",concept:`A practical, design-led post about ${p.topic.toLowerCase()} for Dubai homeowners.`,hashtags:"#DubaiInteriors #InteriorDesignUAE #HomeRenovation",creativeBrief:`Editorial interior composition in ${p.color} tones, premium natural light, no text overlay.`,notes:"Use verified services and locations only.",issueNote:"",status:p.status as SocialStatus,history:[`Seeded as ${p.status}`]}));
const initial=current;const listeners=new Set<()=>void>();
function emit(){listeners.forEach(listener=>listener())}
export function useSocialPosts(){return useSyncExternalStore((listener)=>{listeners.add(listener);return()=>listeners.delete(listener)},()=>current,()=>initial)}
export function updateSocialPost(id:number,patch:Partial<SocialPost>,activity?:string){current=current.map(p=>p.id===id?{...p,...patch,history:activity?[activity,...p.history]:p.history}:p);emit()}
export function updateSocialPosts(ids:number[],patch:Partial<SocialPost>,activity:string){current=current.map(p=>ids.includes(p.id)?{...p,...patch,history:[activity,...p.history]}:p);emit()}
export function resetSocialStore(){current=initial.map(p=>({...p,history:[...p.history]}));emit()}
