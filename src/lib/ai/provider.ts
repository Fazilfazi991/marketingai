export type GenerationContext={clientId:string;businessKnowledge:string;services:string[];offers:string[];prohibitedClaims:string[]};
export type SocialConcept={topic:string;concept:string;caption:string;hashtags:string;creativeBrief:string};
export type GenerationResult<T>={data:T;provider:string;model:string;usage?:{inputTokens:number;outputTokens:number;estimatedCost:number}};
export interface AIProvider{
 generateSocialPlan(context:GenerationContext,month:string,count:number):Promise<GenerationResult<SocialConcept[]>>;
 generateCaption(context:GenerationContext,concept:string):Promise<GenerationResult<string>>;
 generateCreativeBrief(context:GenerationContext,concept:string):Promise<GenerationResult<string>>;
 generateBlogBrief(context:GenerationContext,keyword:string):Promise<GenerationResult<string>>;
 generateBlogDraft(context:GenerationContext,brief:string):Promise<GenerationResult<string>>;
 analyzeSEO(context:GenerationContext,input:string):Promise<GenerationResult<string[]>>;
 generateMonthlyReport(context:GenerationContext,input:string):Promise<GenerationResult<string>>;
}
export type OpenAICompatibleConfig={baseUrl:string;apiKey:string;model:string};
export class OpenAICompatibleProvider implements AIProvider{
 constructor(private readonly config:OpenAICompatibleConfig){}
 private async generate<T>(task:string,payload:unknown):Promise<GenerationResult<T>>{const response=await fetch(`${this.config.baseUrl.replace(/\/$/,"")}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${this.config.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:this.config.model,response_format:{type:"json_object"},messages:[{role:"system",content:"Return valid JSON. Use only verified business information and obey prohibited claims."},{role:"user",content:JSON.stringify({task,payload})}]})});if(!response.ok)throw new Error(`AI provider request failed with status ${response.status}`);const json=await response.json() as {choices?:Array<{message?:{content?:string}}>};const content=json.choices?.[0]?.message?.content;if(!content)throw new Error("AI provider returned no content");return{data:JSON.parse(content) as T,provider:"openai-compatible",model:this.config.model}}
 generateSocialPlan=(context:GenerationContext,month:string,count:number)=>this.generate<SocialConcept[]>("generateSocialPlan",{context,month,count});
 generateCaption=(context:GenerationContext,concept:string)=>this.generate<string>("generateCaption",{context,concept});
 generateCreativeBrief=(context:GenerationContext,concept:string)=>this.generate<string>("generateCreativeBrief",{context,concept});
 generateBlogBrief=(context:GenerationContext,keyword:string)=>this.generate<string>("generateBlogBrief",{context,keyword});
 generateBlogDraft=(context:GenerationContext,brief:string)=>this.generate<string>("generateBlogDraft",{context,brief});
 analyzeSEO=(context:GenerationContext,input:string)=>this.generate<string[]>("analyzeSEO",{context,input});
 generateMonthlyReport=(context:GenerationContext,input:string)=>this.generate<string>("generateMonthlyReport",{context,input});
}
export function createAIProvider(env:Record<string,string|undefined>=process.env):AIProvider{const key=env.AI_API_KEY,baseUrl=env.AI_BASE_URL??"https://api.openai.com/v1",model=env.AI_MODEL??"gpt-5-mini";if(!key)throw new Error("AI_API_KEY is not configured");return new OpenAICompatibleProvider({baseUrl,apiKey:key,model})}
