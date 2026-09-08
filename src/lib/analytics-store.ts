"use client";
import { useSyncExternalStore } from "react";
export type AnalyticsPoint={day:string;users:number;sessions:number;clicks:number;impressions:number};
export type SearchRow={query:string;page:string;clicks:number;impressions:number;position:number};
export type DataImport={id:number;source:"Google Analytics 4"|"Search Console";property:string;range:string;status:"Completed"|"Failed";rows:number;at:string;isDemo:boolean;error?:string};
const points:AnalyticsPoint[]=[{day:"1 Sep",users:48,sessions:61,clicks:14,impressions:430},{day:"8 Sep",users:57,sessions:72,clicks:17,impressions:510},{day:"15 Sep",users:65,sessions:81,clicks:20,impressions:590},{day:"22 Sep",users:72,sessions:91,clicks:23,impressions:670},{day:"29 Sep",users:81,sessions:104,clicks:27,impressions:760}];
export const searchRows:SearchRow[]=[{query:"villa renovation dubai",page:"/services/villa-renovation",clicks:148,impressions:1860,position:5.4},{query:"interior design company dubai",page:"/",clicks:121,impressions:2310,position:8.2},{query:"custom wardrobes dubai",page:"/services/wardrobes",clicks:84,impressions:970,position:6.8},{query:"kitchen renovation dubai",page:"/services/kitchens",clicks:73,impressions:1120,position:9.1}];
let imports:DataImport[]=[{id:1,source:"Google Analytics 4",property:"Demo property · ABC Interiors",range:"1–30 Sep 2026",status:"Completed",rows:30,at:"30 Sep · 23:45",isDemo:true},{id:2,source:"Search Console",property:"Demo property · sc-domain:abcinteriors.ae",range:"1–30 Sep 2026",status:"Completed",rows:124,at:"30 Sep · 23:48",isDemo:true}];
let version=0;const listeners=new Set<()=>void>();
export function getAnalyticsSnapshot(){return {version,points,searchRows,imports}}
export function subscribeAnalytics(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn)}
export function useAnalytics(){return useSyncExternalStore(subscribeAnalytics,getAnalyticsSnapshot,getAnalyticsSnapshot)}
export function refreshDemoImport(){const id=Math.max(...imports.map(x=>x.id),0)+1;imports=[{id,source:"Google Analytics 4",property:"Demo property · ABC Interiors",range:"1–30 Sep 2026",status:"Completed",rows:30,at:"Just now",isDemo:true},...imports];version++;listeners.forEach(fn=>fn());return imports[0]}
export const analyticsSummary={users:1842,sessions:2369,clicks:624,impressions:18420};
