"use client";
import { useSyncExternalStore } from "react";

export type BlogStatus="Research"|"Topic selected"|"Brief"|"Draft"|"Internal review"|"Ready to publish"|"Published";
export type BlogItem={id:number;title:string;keyword:string;intent:string;brief:string;excerpt:string;metaTitle:string;metaDescription:string;status:BlogStatus;owner:string;updated:string};
export type SeoKeyword={id:number;keyword:string;intent:string;url:string;current:number;previous:number;priority:"High"|"Medium"|"Low";status:"Tracking"|"Opportunity"|"Improving";notes:string};
export type SeoOpportunity={id:number;title:string;page:string;impact:"High"|"Medium"|"Low";status:"Open"|"In progress"|"Awaiting review"|"Approved"|"Complete";detail:string};

let blogs:BlogItem[]=[
 {id:1,title:"The complete guide to villa renovation in Dubai",keyword:"villa renovation dubai",intent:"Commercial",brief:"A practical planning guide covering scope, permissions, sequencing and choosing a fit-out partner.",excerpt:"Renovating a villa is easier when the decisions happen in the right order. This guide explains the stages from brief to handover.",metaTitle:"Villa Renovation Dubai: A Practical Homeowner Guide",metaDescription:"Plan a Dubai villa renovation with a clear guide to scope, timelines, approvals and selecting the right interior fit-out partner.",status:"Internal review",owner:"Fazil",updated:"Today"},
 {id:2,title:"Kitchen layouts that work for Dubai homes",keyword:"kitchen renovation dubai",intent:"Commercial",brief:"Compare galley, L-shape and island layouts with storage and circulation advice.",excerpt:"The right layout makes a kitchen feel calm long before finishes are selected.",metaTitle:"Kitchen Renovation Dubai: Layout Planning Guide",metaDescription:"Compare practical kitchen layouts, storage ideas and circulation tips for Dubai apartments and villas.",status:"Draft",owner:"Maya",updated:"6 Sep"},
 {id:3,title:"Built-in wardrobes: materials and planning",keyword:"custom wardrobes dubai",intent:"Commercial",brief:"Explain internal planning, finish options and durable hardware without unverified price claims.",excerpt:"A useful wardrobe starts with what needs to fit inside it.",metaTitle:"Custom Wardrobes Dubai: Planning and Materials",metaDescription:"Learn how to plan fitted wardrobes around storage needs, finishes and everyday use.",status:"Brief",owner:"Fazil",updated:"4 Sep"},
 {id:4,title:"Interior fit-out checklist for business owners",keyword:"interior fit out dubai",intent:"Commercial",brief:"A checklist for commercial clients preparing a fit-out brief.",excerpt:"Clear requirements reduce costly changes once work begins.",metaTitle:"Interior Fit-Out Dubai: Client Checklist",metaDescription:"Prepare for an interior fit-out with a clear checklist for scope, approvals and delivery.",status:"Published",owner:"Fazil",updated:"29 Aug"}
];
let keywords:SeoKeyword[]=[
 {id:1,keyword:"kitchen renovation dubai",intent:"Commercial",url:"/kitchen-renovation",current:8,previous:11,priority:"High",status:"Improving",notes:"Strengthen service proof and FAQs."},
 {id:2,keyword:"villa renovation dubai",intent:"Commercial",url:"/villa-renovation",current:14,previous:19,priority:"High",status:"Opportunity",notes:"Publish supporting guide and add internal links."},
 {id:3,keyword:"custom wardrobes dubai",intent:"Commercial",url:"/wardrobes",current:21,previous:19,priority:"Medium",status:"Tracking",notes:"Add materials and project photography."},
 {id:4,keyword:"interior fit out dubai",intent:"Commercial",url:"/fit-out",current:17,previous:18,priority:"Medium",status:"Improving",notes:"Expand process section."}
];
let opportunities:SeoOpportunity[]=[
 {id:1,title:"Publish villa renovation planning guide",page:"/villa-renovation",impact:"High",status:"In progress",detail:"Support the service page with a useful long-form guide and contextual links."},
 {id:2,title:"Add project proof to wardrobe page",page:"/wardrobes",impact:"High",status:"Open",detail:"Add original photography and a short verified case-study section."},
 {id:3,title:"Improve fit-out title and description",page:"/fit-out",impact:"Medium",status:"Complete",detail:"Align metadata with the primary commercial query."}
 ,{id:4,title:"Add renovation FAQ schema",page:"/villa-renovation",impact:"Medium",status:"Awaiting review",detail:"Review the proposed verified questions before implementation."}
];
const listeners=new Set<()=>void>(); const emit=()=>listeners.forEach(l=>l()); const subscribe=(l:()=>void)=>{listeners.add(l);return()=>listeners.delete(l)};
export const useBlogs=()=>useSyncExternalStore(subscribe,()=>blogs,()=>blogs);
export const useSeoKeywords=()=>useSyncExternalStore(subscribe,()=>keywords,()=>keywords);
export const useSeoOpportunities=()=>useSyncExternalStore(subscribe,()=>opportunities,()=>opportunities);
export function updateBlog(id:number,patch:Partial<BlogItem>){blogs=blogs.map(x=>x.id===id?{...x,...patch,updated:"Just now"}:x);emit()}
export function addBlog(item:Pick<BlogItem,"title"|"keyword"|"intent"|"brief">){blogs=[{id:Date.now(),...item,excerpt:"Draft content has not been written yet.",metaTitle:item.title,metaDescription:"SEO description pending.",status:"Research",owner:"Fazil",updated:"Just now"},...blogs];emit()}
export function addKeyword(item:Omit<SeoKeyword,"id">){keywords=[{id:Date.now(),...item},...keywords];emit()}
export function updateOpportunity(id:number,patch:Partial<SeoOpportunity>){opportunities=opportunities.map(x=>x.id===id?{...x,...patch}:x);emit()}
export const getBlogSnapshot=()=>blogs;
export const getKeywordSnapshot=()=>keywords;
export const getOpportunitySnapshot=()=>opportunities;
