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
 async generateSocialPlan(context:GenerationContext,month:string,count:number){const excluded=new Set(context.businessKnowledge.match(/Recent topics: ([^.]+)/)?.[1]?.split(", ").map(x=>x.toLowerCase())??[]),company=context.businessKnowledge.split(".")[0]?.trim()||"the client",services=context.services.slice(0,2).join(" and ").toLowerCase();const available=ideas.filter(([topic])=>!excluded.has(topic.toLowerCase())).slice(0,count);return result(available.map(([topic,concept])=>({topic,concept,caption:`${concept} At ${company}, we plan ${services||"every service"} around how each customer will use it.`,hashtags,creativeBrief:`Editorial brand photograph illustrating ${topic.toLowerCase()}, warm natural light, premium neutral palette, no text overlay, no people or unverified claims. Month: ${month}.`})))}
 async generateCaption(_context:GenerationContext,concept:string){return result(concept)}
 async generateCreativeBrief(_context:GenerationContext,concept:string){return result(`Editorial interior image for ${concept}; no text or unverified claims.`)}
 async generateBlogBrief(context:GenerationContext,keyword:string){return result(`Create a practical, business-friendly guide targeting “${keyword}”. Explain how homeowners can define scope, priorities and sequencing before work begins. Use only the verified services and locations in this context: ${context.services.join(", ")}. Avoid prices, guarantees, certifications, testimonials and unsupported statistics. End with a helpful consultation-focused next step.`)}
 async generateBlogDraft(context:GenerationContext,brief:string){const services=context.services.slice(0,3).join(", ");return result(`Planning a renovation starts with clarity. Before choosing finishes, define how the space needs to work, which problems matter most, and which decisions affect later stages.\n\nA useful first step is to separate essential work from optional improvements. For services such as ${services}, early measurements, storage needs and everyday routines should guide the brief. This keeps design decisions connected to practical use.\n\nSequencing matters too. Layout, services and fixed joinery decisions should be resolved before decorative details. A documented scope gives the client and implementation team a shared reference and helps surface questions while changes are still manageable.\n\nThis draft follows the approved research direction: ${brief}\n\nIf you are planning a project, prepare your priorities, reference images and practical requirements before the first consultation. The team can then discuss a suitable scope using verified project information.`)}
 async analyzeSEO(_context:GenerationContext,input:string){return result([`Review ${input} against the verified target page.`])}
 async generateMonthlyReport(_context:GenerationContext,input:string){return result(`Demo report summary for ${input}.`)}
}
