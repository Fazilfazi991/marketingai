export type GenerationContext={clientId:string;businessKnowledge:string;services:string[];offers:string[];prohibitedClaims:string[];performanceContext?:string;recentContent?:string[];toneOfVoice?:string;locations?:string[]};
export type SocialStrategy={monthlyObjective:string;priorityTopics:string[];primaryCta:string;contentThemes:string[];contentMix:Record<string,number>;performanceObservations:string[];avoidRepeating:string[]};
export type SocialConcept={postNumber:number;contentType:string;topic:string;objective:string;platform:string;suggestedDate:string;suggestedTime:string;posterHeadline:string;posterSupportingText:string;concept?:string;creativeBrief:string;imagePrompt:string;caption:string;cta:string;hashtags:string;internalNotes:string};
export type GenerationResult<T>={data:T;provider:string;model:string;usage?:{inputTokens:number;outputTokens:number;estimatedCost:number}};
export interface AIProvider{
 generateSocialStrategy(context:GenerationContext,month:string,count:number):Promise<GenerationResult<SocialStrategy>>;
 generateSocialPlan(context:GenerationContext,month:string,count:number):Promise<GenerationResult<SocialConcept[]>>;
 generateCaption(context:GenerationContext,concept:string):Promise<GenerationResult<string>>;
 generateCreativeBrief(context:GenerationContext,concept:string):Promise<GenerationResult<string>>;
 generateBlogBrief(context:GenerationContext,keyword:string):Promise<GenerationResult<string>>;
 generateBlogDraft(context:GenerationContext,brief:string):Promise<GenerationResult<string>>;
 analyzeSEO(context:GenerationContext,input:string):Promise<GenerationResult<string[]>>;
 generateMonthlyReport(context:GenerationContext,input:string):Promise<GenerationResult<string>>;
}
export type OpenAICompatibleConfig={baseUrl:string;apiKey:string;model:string};
const RETRYABLE_PROVIDER_STATUSES=new Set([408,429,500,502,503,504]);
const wait=(milliseconds:number)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
export class OpenAICompatibleProvider implements AIProvider{
 constructor(private readonly config:OpenAICompatibleConfig){}
 private async generate<T>(task:string,payload:unknown):Promise<GenerationResult<T>>{let response:Response|undefined;for(let attempt=0;attempt<3;attempt+=1){response=await fetch(`${this.config.baseUrl.replace(/\/$/,"")}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${this.config.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:this.config.model,response_format:{type:"json_object"},messages:[{role:"system",content:"Return one valid JSON object with the requested result under a top-level data key. Use only verified business information and obey prohibited claims."},{role:"user",content:JSON.stringify({task,payload,responseShape:{data:"requested result"}})}]})});if(response.ok)break;if(!RETRYABLE_PROVIDER_STATUSES.has(response.status)||attempt===2)throw new Error(`AI provider request failed with status ${response.status}`);await wait(1000*(attempt+1));}if(!response?.ok)throw new Error("AI provider request failed");const json=await response.json() as {choices?:Array<{message?:{content?:string}}>};const content=json.choices?.[0]?.message?.content;if(!content)throw new Error("AI provider returned no content");const parsed=JSON.parse(content) as {data?:T};if(!Object.prototype.hasOwnProperty.call(parsed,"data"))throw new Error("AI provider response is missing the data field");return{data:parsed.data as T,provider:"openai-compatible",model:this.config.model}}
 generateSocialStrategy=(context:GenerationContext,month:string,count:number)=>this.generate<SocialStrategy>("generateMonthlySocialStrategy_v1",{context,month,count,requirements:"Adapt the mix to this business. Use performance signals only as observations, never causal claims. Return monthlyObjective, priorityTopics, primaryCta, contentThemes, contentMix, performanceObservations, avoidRepeating."});
 generateSocialPlan=(context:GenerationContext,month:string,count:number)=>this.generate<SocialConcept[]>("generateCompletePostBriefs_v1",{context,month,count,requirements:"Return exactly count complete, distinct briefs. Each must include postNumber, contentType, topic, objective, platform, suggestedDate YYYY-MM-DD, suggestedTime, posterHeadline, posterSupportingText, creativeBrief, imagePrompt (copy-ready 4:5 prompt with composition, style, branding and avoid list), caption, cta, hashtags, internalNotes. Never invent claims, prices, certifications, testimonials or guarantees."});
 generateCaption=(context:GenerationContext,concept:string)=>this.generate<string>("generateCaption",{context,concept});
 generateCreativeBrief=(context:GenerationContext,concept:string)=>this.generate<string>("generateCreativeBrief",{context,concept});
 generateBlogBrief=(context:GenerationContext,keyword:string)=>this.generate<string>("generateBlogBrief",{context,keyword});
 generateBlogDraft=(context:GenerationContext,brief:string)=>this.generate<string>("generateBlogDraft",{context,brief});
 analyzeSEO=(context:GenerationContext,input:string)=>this.generate<string[]>("analyzeSEO",{context,input});
 generateMonthlyReport=(context:GenerationContext,input:string)=>this.generate<string>("generateMonthlyReport",{context,input});
}
export function createAIProvider(env:Record<string,string|undefined>=process.env,runtimeOidcToken?:string|null):AIProvider{
 const directKey=env.AI_API_KEY?.trim();
 const oidcToken=runtimeOidcToken?.trim()||env.VERCEL_OIDC_TOKEN?.trim();
 if(directKey){
  return new OpenAICompatibleProvider({baseUrl:env.AI_BASE_URL??"https://api.openai.com/v1",apiKey:directKey,model:env.AI_MODEL??"gpt-5-mini"});
 }
 if(oidcToken){
  return new OpenAICompatibleProvider({baseUrl:"https://ai-gateway.vercel.sh/v1",apiKey:oidcToken,model:env.AI_GATEWAY_MODEL??"google/gemini-2.5-flash"});
 }
 throw new Error("AI provider credentials are not configured");
}
