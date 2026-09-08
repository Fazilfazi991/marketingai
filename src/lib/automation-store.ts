"use client";
import { useSyncExternalStore } from "react";

export type WorkflowKey="MONTHLY_SOCIAL"|"MONTHLY_BLOG"|"SEO_REVIEW"|"MONTHLY_REPORT";
export type AutomationJob={id:number;dbId?:string;key:WorkflowKey;name:string;schedule:string;status:"Active"|"Paused";lastRun:string;nextRun:string;health:"Healthy"|"Running"|"Failed"};
export type AutomationRun={id:number;dbId?:string;jobDbId?:string;jobId:number;client:string;workflow:WorkflowKey;started:string;finished:string|null;status:"Running"|"Succeeded"|"Failed";input:string;output:string;cost:number|null};
export type AutomationError={runId:number;runDbId?:string;code:string;message:string;time:string};

let jobs:AutomationJob[]=[
 {id:1,key:"MONTHLY_SOCIAL",name:"Monthly social preparation",schedule:"1st monthly · 08:00 GST",status:"Active",lastRun:"1 Sep · 08:04",nextRun:"1 Oct · 08:00",health:"Healthy"},
 {id:2,key:"MONTHLY_BLOG",name:"Monthly blog preparation",schedule:"2nd monthly · 08:00 GST",status:"Active",lastRun:"2 Sep · 08:02",nextRun:"2 Oct · 08:00",health:"Healthy"},
 {id:3,key:"SEO_REVIEW",name:"SEO review",schedule:"5th monthly · 09:00 GST",status:"Active",lastRun:"5 Sep · 09:01",nextRun:"5 Oct · 09:00",health:"Healthy"},
 {id:4,key:"MONTHLY_REPORT",name:"Monthly report",schedule:"Last day · 10:00 GST",status:"Active",lastRun:"31 Aug · 10:03",nextRun:"30 Sep · 10:00",health:"Failed"}
];
let runs:AutomationRun[]=[
 {id:104,jobId:1,client:"ABC Interiors",workflow:"MONTHLY_SOCIAL",started:"1 Sep · 08:04",finished:"1 Sep · 08:05",status:"Succeeded",input:"client_id + 2026-09",output:"12 content records · Needs review",cost:0.1842},
 {id:103,jobId:2,client:"ABC Interiors",workflow:"MONTHLY_BLOG",started:"2 Sep · 08:02",finished:"2 Sep · 08:03",status:"Succeeded",input:"client_id + 2026-09",output:"2 article tasks created",cost:0.061},
 {id:102,jobId:3,client:"ABC Interiors",workflow:"SEO_REVIEW",started:"5 Sep · 09:01",finished:"5 Sep · 09:02",status:"Succeeded",input:"client_id",output:"3 opportunities created",cost:0.028},
 {id:101,jobId:4,client:"ABC Interiors",workflow:"MONTHLY_REPORT",started:"31 Aug · 10:03",finished:"31 Aug · 10:03",status:"Failed",input:"client_id + 2026-08",output:"No report created",cost:null}
];
const errors:AutomationError[]=[{runId:101,code:"DATA_SOURCE_UNAVAILABLE",message:"Analytics data was not available. The run stopped without publishing a report.",time:"31 Aug · 10:03"}];
const listeners=new Set<()=>void>();const subscribe=(l:()=>void)=>{listeners.add(l);return()=>listeners.delete(l)};const emit=()=>listeners.forEach(l=>l());
export const useAutomationJobs=()=>useSyncExternalStore(subscribe,()=>jobs,()=>jobs);
export const useAutomationRuns=()=>useSyncExternalStore(subscribe,()=>runs,()=>runs);
export const useAutomationErrors=()=>useSyncExternalStore(subscribe,()=>errors,()=>errors);
export const getAutomationSnapshot=()=>({jobs,runs,errors});
export function setJobStatus(id:number,status:AutomationJob["status"]){jobs=jobs.map(j=>j.id===id?{...j,status}:j);emit()}
export function runAutomation(jobId:number){const job=jobs.find(j=>j.id===jobId);if(!job)return;const id=Date.now();jobs=jobs.map(j=>j.id===jobId?{...j,health:"Running",lastRun:"Just now"}:j);runs=[{id,jobId,client:"ABC Interiors",workflow:job.key,started:"Just now",finished:null,status:"Running",input:job.key==="SEO_REVIEW"?"client_id":"client_id + 2026-10",output:"Pending",cost:null},...runs];emit();setTimeout(()=>{runs=runs.map(r=>r.id===id?{...r,status:"Succeeded",finished:"Just now",output:job.key==="MONTHLY_SOCIAL"?"12 content records · Needs review":"Run output recorded",cost:0.042}:r);jobs=jobs.map(j=>j.id===jobId?{...j,health:"Healthy"}:j);emit()},650)}
export function retryRun(runId:number){const run=runs.find(r=>r.id===runId);if(run)runAutomation(run.jobId)}
