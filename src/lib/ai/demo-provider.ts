import type { AIProvider,GenerationContext,GenerationResult } from "./provider";

const ideas=[
 ["Renovation planning order","A clear sequence for starting a renovation without avoidable rework."],
 ["Kitchen storage audit","Questions homeowners can use to plan storage around daily routines."],
 ["Villa zoning ideas","How lighting, rugs and joinery can define open-plan zones."],
 ["Wardrobe planning","Start with what needs to fit before choosing finishes."],
 ["Material longevity","Choose calm, durable materials suited to everyday Dubai living."],
 ["Design consultation prep","What to bring to an initial interior design conversation."],
 ["Fit-out communication","Why scope, updates and quality checks matter during delivery."],
 ["Small-space function","Use integrated storage to create calmer apartment interiors."],
 ["Lighting layers","Combine ambient, task and accent lighting with a clear purpose."],
 ["Before-and-after story","Explain the design decisions behind a verified project transformation."],
 ["Site coordination","Show how drawings and trade coordination protect the design intent."],
 ["Homeowner questions","Useful questions to ask before appointing a renovation partner."],
 ["Kitchen workflow","Plan preparation, cooking and storage zones around movement."],
 ["Timeless interiors","Balance personal character with a restrained material palette."],
 ["Project photography","Use original imagery to explain details clients cannot see at first glance."]
] as const;
const hashtags="#DubaiInteriors #InteriorDesignUAE #HomeRenovation";
function result<T>(data:T):GenerationResult<T>{return{data,provider:"growth1000-demo",model:"verified-template-v1",usage:{inputTokens:0,outputTokens:0,estimatedCost:0}}}
export class DemoAIProvider implements AIProvider{
 async generateSocialPlan(context:GenerationContext,month:string,count:number){const excluded=new Set(context.businessKnowledge.match(/Recent topics: ([^.]+)/)?.[1]?.split(", ").map(x=>x.toLowerCase())??[]);const available=ideas.filter(([topic])=>!excluded.has(topic.toLowerCase())).slice(0,count);return result(available.map(([topic,concept])=>({topic,concept,caption:`${concept} At ABC Interiors, we plan ${context.services.slice(0,2).join(" and ").toLowerCase()} around how each space will be used.`,hashtags,creativeBrief:`Editorial interior photograph illustrating ${topic.toLowerCase()}, warm natural light, premium neutral palette, no text overlay, no people or unverified claims. Month: ${month}.`})))}
 async generateCaption(_context:GenerationContext,concept:string){return result(concept)}
 async generateCreativeBrief(_context:GenerationContext,concept:string){return result(`Editorial interior image for ${concept}; no text or unverified claims.`)}
 async generateBlogBrief(_context:GenerationContext,keyword:string){return result(`A verified practical guide targeting ${keyword}.`)}
 async generateBlogDraft(_context:GenerationContext,brief:string){return result(`Draft based only on: ${brief}`)}
 async analyzeSEO(_context:GenerationContext,input:string){return result([`Review ${input} against the verified target page.`])}
 async generateMonthlyReport(_context:GenerationContext,input:string){return result(`Demo report summary for ${input}.`)}
}
