import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  CircleCheck,
  FileCheck2,
  Globe2,
  Instagram,
  MessageCircle,
  MessagesSquare,
  PenLine,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { BusinessExperience } from "./business-experience";
import { publicSite } from "./site-config";
import { ChannelConstellation, CommandCentre } from "./sections";
import s from "./detail-pages.module.css";

type DetailHeroProps = {
  title: string;
  accent: string;
  description: string;
  children: React.ReactNode;
  compact?: boolean;
  actions?: React.ReactNode;
};

function DetailHero({ title, accent, description, children, compact, actions }: DetailHeroProps) {
  return (
    <section className={`${s.detailHero} ${compact ? s.detailHeroCompact : ""}`}>
      <div className={`${s.shell} ${s.detailHeroGrid}`}>
        <div>
          <h1>{title} <span>{accent}</span></h1>
          <p>{description}</p>
          {actions ?? <a className={s.scrollCue} href="#page-detail">Explore the page <ArrowDown size={15}/></a>}
        </div>
        {children}
      </div>
    </section>
  );
}

function PageClose({ title, nextHref, nextLabel }: { title: string; nextHref?: string; nextLabel?: string }) {
  return (
    <section className={s.pageClose}>
      <div className={`${s.shell} ${s.pageCloseGrid}`}>
        <h2>{title}</h2>
        <div>
          <p>Tell us about your business. We’ll show you how a Growth Agent could fit around it.</p>
          <Link className={s.primaryLink} href="/contact">Get My Growth Agent <ArrowUpRight size={17}/></Link>
          {nextHref && nextLabel ? <Link className={s.nextLink} href={nextHref}>Next: {nextLabel} <ArrowRight size={15}/></Link> : null}
        </div>
      </div>
    </section>
  );
}

const processSteps = [
  ["01", "We learn your business", "Services, customers, locations, goals, tone and priorities become the context Gro works from.", ["Business brief", "Customer context", "Priority map"]],
  ["02", "We connect what matters", "Supported channels are connected around the work you need. Every integration is chosen for a reason; none is mandatory by default.", ["Website", "Google", "Analytics", "WhatsApp", "Website chat", "Social"]],
  ["03", "Gro starts watching", "Questions, opportunities, issues, patterns and content needs begin to form one useful stream.", ["Signal noticed", "Source recorded", "Pattern forming"]],
  ["04", "Gro understands", "A customer question, a website gap and related search demand can point to one shared growth opportunity.", ["Evidence connected", "Reason explained", "Priority suggested"]],
  ["05", "Gro prepares the next move", "Depending on the task, that may be a reply, recommendation, content draft, website change request or lead follow-up.", ["Work prepared", "Owner identified", "Ready for review"]],
  ["06", "Humans step in when needed", "Fusion Ventures supports judgement, review and implementation. Important decisions stay supervised.", ["Review", "Refine", "Implement"]],
  ["07", "You see what matters", "Gro communicates what happened, why it matters and what should happen next without giving you another complicated dashboard to manage.", ["Clear update", "Useful context", "Next action"]],
] as const;

export function HowItWorksContent() {
  return (
    <>
      <DetailHero title="How your Growth Agent" accent="works." description="Gro learns the context of your business, connects the right signals and turns what it notices into useful next moves.">
        <div className={s.flowHero} aria-label="Illustrative Growth Agent flow">
          <div><span>Your business</span><b>Goals · customers · priorities</b></div>
          <i aria-hidden="true" />
          <strong>gro↗ <small>Learning your context</small></strong>
          <i aria-hidden="true" />
          <div><span>Working rhythm</span><b>Watch · understand · prepare</b></div>
        </div>
      </DetailHero>

      <section className={s.process} id="page-detail">
        <div className={s.shell}>
          <div className={s.pageIntro}><h2>From first conversation to a working rhythm.</h2><p>Gro is configured around the business first. The system, channels and level of human involvement follow from that context.</p></div>
          <ol className={s.processList}>
            {processSteps.map(([number, title, copy, artifacts]) => (
              <li key={number}>
                <span className={s.processNumber}>{number}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
                <div className={s.processArtifacts}>{artifacts.map((item) => <span key={item}><Check size={13}/>{item}</span>)}</div>
              </li>
            ))}
          </ol>
          <p className={s.evidenceNote}>Illustrative operating model. Connected sources and actions depend on the selected service and authorized integrations.</p>
        </div>
      </section>
      <CommandCentre />
      <PageClose title="A Growth Agent built around your business." nextHref="/what-gro-does" nextLabel="What Gro Does" />
    </>
  );
}

const capabilities = [
  { icon: Globe2, name: "Website", statement: "See where the customer journey needs attention.", watches: ["Performance and experience", "Content gaps", "Paths to enquiry", "Improvement opportunities"], signal: "High service-page visits, fewer visitors reaching enquiry.", action: "Review the enquiry path and clarify the next step." },
  { icon: Search, name: "Google & SEO", statement: "Find the search opportunities already within reach.", watches: ["Search visibility", "Pages close to ranking", "Content and query gaps", "Google performance"], signal: "A core service page is appearing just beyond Page 1.", action: "Prepare a focused page improvement around relevant demand." },
  { icon: MessageCircle, name: "WhatsApp & conversations", statement: "Turn repeated questions into better answers and stronger follow-up.", watches: ["Enquiries", "Recurring questions", "Lead patterns", "Human handover needs"], signal: "Customers keep asking what installation costs.", action: "Prepare a clear reply and flag the website information gap." },
  { icon: MessagesSquare, name: "Website chat", statement: "Answer useful questions and learn what customers need.", watches: ["Frequent questions", "Lead collection", "Unanswered needs", "Conversation patterns"], signal: "A visitor asks whether your service covers Abu Dhabi.", action: "Give the approved answer and invite the visitor to enquire." },
  { icon: Instagram, name: "Social media", statement: "Prepare more relevant content from real business demand.", watches: ["Content gaps", "Customer themes", "Timely ideas", "Review-ready drafts"], signal: "No useful post is prepared for a recurring customer topic.", action: "Turn the topic into three draft posts for review." },
  { icon: BarChart3, name: "Analytics", statement: "Understand what changed without reading charts all day.", watches: ["Meaningful changes", "Conversion patterns", "Channel movement", "Areas needing attention"], signal: "Traffic is steady while enquiries have softened.", action: "Explain the likely journey issue and where to inspect first." },
] as const;

export function WhatGroDoesContent() {
  return (
    <>
      <DetailHero title="One Growth Agent." accent="Across your digital business." description="Gro helps you notice opportunities, respond to customers, prepare useful content and improve what is not working.">
        <div className={s.channelHero} aria-label="Channels connected through Gro">
          <div className={s.channelOrbit}>{[Globe2, Search, MessageCircle, Instagram, BarChart3].map((Icon, index) => <span key={index}><Icon size={18}/></span>)}</div>
          <strong>gro↗</strong>
          <p>Watching connected signals</p>
        </div>
      </DetailHero>

      <ChannelConstellation id="page-detail" />

      <section className={s.capabilityChapters}>
        <div className={s.shell}>
          {capabilities.map(({ icon: Icon, name, statement, watches, signal, action }, index) => (
            <article className={s.capabilityChapter} key={name}>
              <div className={s.capabilityIdentity}><span>{String(index + 1).padStart(2, "0")}</span><Icon size={25}/><h2>{name}</h2><p>{statement}</p></div>
              <ul>{watches.map((item) => <li key={item}><Check size={14}/>{item}</li>)}</ul>
              <div className={s.liveCapability}><span>Illustrative signal</span><p>{signal}</p><ArrowDown size={16}/><span>Gro may prepare</span><strong>{action}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className={s.intelligenceChapter}>
        <div className={`${s.shell} ${s.intelligenceGrid}`}>
          <div><h2>Growth intelligence lives in the connection.</h2><p>A question in WhatsApp can explain a website gap. Search demand can strengthen the case. Gro brings the evidence together before recommending the next move.</p></div>
          <div className={s.equation} aria-label="An illustrative connected recommendation"><span>Customer question</span><b>+</b><span>Search demand</span><b>+</b><span>Website gap</span><b>=</b><strong>One useful recommendation</strong></div>
        </div>
      </section>
      <PageClose title="Give every signal somewhere useful to go." nextHref="/for-businesses" nextLabel="Gro for Businesses" />
    </>
  );
}

export function AboutContent() {
  const tooMany = ["Tools", "Dashboards", "Channels", "Agencies", "Reports"];
  return (
    <>
      <DetailHero title="One idea sits behind Gro:" accent="pay attention." description="Fusion Ventures built Gro to give businesses one Growth Agent that connects the work happening across their digital presence.">
        <div className={s.attentionHero}>
          <div>{tooMany.map((item) => <span key={item}>{item}</span>)}</div>
          <ArrowRight aria-hidden="true"/>
          <strong>gro↗ <small>One attentive view</small></strong>
        </div>
      </DetailHero>

      <section className={s.whyExists} id="page-detail">
        <div className={`${s.shell} ${s.whyGrid}`}>
          <h2>Businesses do not need another place to look.</h2>
          <div><p>Websites, search, conversations, content and performance often live in separate tools and separate reports. The business owner is left to connect everything.</p><p>Gro was created around a simpler proposition: give the business one Growth Agent that keeps watching, makes sense of the evidence and prepares the next useful move.</p></div>
        </div>
      </section>

      <section className={s.philosophy}>
        <div className={s.shell}>
          <div className={s.pageIntro}><h2>AI-powered. Human-backed.</h2><p>Each side does the work it is best placed to do.</p></div>
          <div className={s.philosophyFlow}>
            <article><Bot size={25}/><h3>AI brings attention and speed.</h3><p>Monitoring, pattern recognition, analysis and content assistance can keep moving around the business.</p><span>Watch · connect · prepare</span></article>
            <div className={s.handoff}><i/><span>When judgement is needed</span><i/></div>
            <article><UserRoundCheck size={25}/><h3>People bring judgement.</h3><p>Fusion Ventures supports review, implementation, important decisions and the relationship with your business.</p><span>Review · decide · implement</span></article>
          </div>
        </div>
      </section>

      <section className={s.fusion}>
        <div className={`${s.shell} ${s.fusionGrid}`}><div><span className={s.fusionMark}>FV</span><h2>Built and managed by Fusion Ventures.</h2></div><p>Gro is a Fusion Ventures service. The team configures the Growth Agent around each business and supports the work that needs human review or implementation.</p></div>
      </section>

      <section className={s.principle}><div className={s.shell}><p>Our principle</p><h2>Technology should reduce work for the business owner, not create another tool they need to manage.</h2></div></section>
      <PageClose title="Meet your Growth Agent." nextHref="/how-it-works" nextLabel="How Gro Works" />
    </>
  );
}

export function ForBusinessesContent() {
  const context = ["Services", "Customers", "Industry", "Locations", "Goals", "Channels"];
  return (
    <>
      <DetailHero title="Gro adapts to" accent="your business." description="Your Growth Agent is configured around the people you serve, the channels you use and the kind of growth work that matters most.">
        <div className={s.contextHero}>{context.map((item, index) => <span key={item} style={{ "--delay": `${index * .45}s` } as React.CSSProperties}>{item}</span>)}<strong>gro↗ <small>Learning your context</small></strong></div>
      </DetailHero>

      <section className={s.businessSection} id="page-detail">
        <div className={s.shell}>
          <div className={s.pageIntro}><h2>See Gro through your kind of business.</h2><p>Choose an example to see what Gro may watch, learn and prepare. The examples describe possibilities, not recorded customer results.</p></div>
          <BusinessExperience />
        </div>
      </section>

      <section className={s.configuredAround}>
        <div className={`${s.shell} ${s.configuredGrid}`}>
          <h2>Configured around what is already true.</h2>
          <div>{context.map((item) => <span key={item}><CircleCheck size={15}/>{item}</span>)}</div>
        </div>
      </section>

      <section className={s.workingRhythm}>
        <div className={s.shell}><div className={s.pageIntro}><h2>The same working rhythm. Different priorities.</h2><p>Gro starts with context, keeps watch across supported channels and prepares work that fits the business.</p></div><div className={s.rhythmLine}><span><Radar size={20}/><b>Watch</b>Relevant business signals</span><ArrowRight/><span><Sparkles size={20}/><b>Understand</b>Patterns and opportunities</span><ArrowRight/><span><FileCheck2 size={20}/><b>Prepare</b>Useful work for review</span></div></div>
      </section>
      <PageClose title="A Growth Agent shaped around your goals." nextHref="/contact" nextLabel="Contact Gro" />
    </>
  );
}

export function ContactContent() {
  return (
    <>
      <DetailHero
        compact
        title="Let’s build your"
        accent="Growth Agent."
        description="Tell us about your business. We’ll show you how Gro could fit into it."
        actions={
          <div className={s.contactHeroActions}>
            <a className={s.contactHeroPrimary} href={publicSite.contactUrl}><MessageCircle size={19}/> WhatsApp <ArrowUpRight size={16}/></a>
            <a className={s.contactHeroSecondary} href="mailto:info@fusionventuresglobal.com?subject=Gro%20Growth%20Agent%20enquiry"><PenLine size={19}/> Email Gro <ArrowUpRight size={16}/></a>
          </div>
        }
      >
        <div className={s.contactStatus}><span><i/> Ready to learn your business</span><p>No account registration. Start with a conversation.</p></div>
      </DetailHero>

      <section className={s.nextSteps} id="page-detail">
        <div className={s.shell}><div className={s.pageIntro}><h2>What happens next?</h2><p>A simple path from first conversation to a Growth Agent prepared around your business.</p></div><ol><li><span>1</span><div><h3>We learn about your business.</h3><p>Your services, customers, goals and current digital presence.</p></div></li><li><span>2</span><div><h3>We understand what Gro should handle.</h3><p>The signals and growth work that deserve the most attention.</p></div></li><li><span>3</span><div><h3>We prepare your Growth Agent.</h3><p>Configuration, supported connections and a clear working rhythm.</p></div></li></ol><p className={s.contactReassurance}><ShieldCheck size={17}/> You stay involved. Important work can be reviewed before it moves forward.</p></div>
      </section>
    </>
  );
}
