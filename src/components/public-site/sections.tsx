import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleCheck,
  FileCheck2,
  Globe2,
  Instagram,
  MessageCircle,
  PenLine,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GrowthCTA } from "./chrome";
import { IndustryChooser, ObserveUnderstandAct } from "./homepage-experience";
import s from "./homepage.module.css";

const signalRows = [
  [Search, "Google", "Service page moving toward Page 1", TrendingUp, "Recommend", "Improve service page"],
  [MessageCircle, "WhatsApp", "Pricing question appearing again", PenLine, "Prepare", "Pricing FAQ draft"],
  [Globe2, "Website", "Visitors leaving before enquiry", BarChart3, "Flag", "Review enquiry path"],
  [Instagram, "Social", "This week’s post is ready", CircleCheck, "Ready", "Content for approval"],
] as const;

const stripSignals = [
  [Search, "Google · opportunity found"],
  [MessageCircle, "WhatsApp · enquiry answered"],
  [Globe2, "Website · issue detected"],
  [Instagram, "Social · post prepared"],
  [MessageCircle, "Customer chat · FAQ identified"],
  [BarChart3, "Analytics · change explained"],
] as const;

export function Hero() {
  return (
    <>
      <section className={s.hero}>
        <div className={`${s.shell} ${s.heroGrid}`}>
          <div className={s.heroCopy}>
            <h1 className={`${s.display} ${s.heroTitle}`}>
              Get a Growth Agent <span>for your business.</span>
            </h1>
            <p className={s.heroLead}>
              Gro watches the digital signals around your business, understands
              what matters, and prepares the next useful move.
            </p>
            <div className={s.heroActions}>
              <GrowthCTA className={s.primaryLink} />
              <a className={s.secondaryLink} href="#gro-at-work">
                See Gro at Work <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
            <p className={s.heroStatement}>
              AI-powered. Human-backed. Working around your business.
            </p>
          </div>

          <div>
            <div className={s.agentStage}>
              <div className={s.orbit} aria-hidden="true" />
              <article className={s.agentCore} aria-label="Illustrative Gro Agent Core">
                <header className={s.coreHeader}>
                  <div className={s.coreMark}>gro↗</div>
                  <div>
                    <h2>Your Growth Agent</h2>
                    <span className={s.activeState}><i /> Active · watching your business</span>
                  </div>
                  <div className={s.workingState}>
                    <small>GRO IS WORKING</small>
                    <span className={s.workingWords} aria-label="Watching, understanding, preparing, responding and improving">
                      <span>Watching</span><span>Understanding</span><span>Preparing</span><span>Responding</span><span>Improving</span>
                    </span>
                  </div>
                </header>
                <div className={s.coreMap}>
                  <div className={s.signals}>
                    <span className={s.coreLabel}>Signals coming in</span>
                    {signalRows.map(([Icon, channel, signal]) => (
                      <div className={s.signal} key={channel}>
                        <Icon size={16} strokeWidth={1.7} />
                        <span><b>{channel}</b>{signal}</span>
                      </div>
                    ))}
                  </div>
                  <div className={s.coreFlow} aria-hidden="true"><ArrowRight size={16} /></div>
                  <div className={s.actionsList}>
                    <span className={s.coreLabel}>Actions taking shape</span>
                    {signalRows.map(([, channel, , ActionIcon, action, result]) => (
                      <div className={s.agentAction} key={channel}>
                        <ActionIcon size={16} />
                        <span><b>{action}</b>{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <footer className={s.coreFooter}>
                  <span>Connected evidence · supervised actions</span>
                  <span>Fusion Ventures team available</span>
                </footer>
              </article>
            </div>
            <p className={s.illustrative}>Illustrative agent experience. Signals depend on connected business channels.</p>
          </div>
        </div>
      </section>

      <div className={s.signalStrip} aria-label="Live business signals">
        <div className={`${s.shell} ${s.signalStripInner}`}>
          <span className={s.stripTitle}><i /> Live from a Gro business</span>
          <div className={s.stripSignals}>
            <div className={s.stripTrack}>
              {[false, true].map((duplicate) => (
                <div aria-hidden={duplicate || undefined} className={s.stripCopy} key={String(duplicate)}>
                  {stripSignals.map(([Icon, label]) => <span key={label}><Icon size={15} /> {label}</span>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function BusinessSignals() {
  const sources = [
    ["Customer chat", "Questions, intent and unanswered needs"],
    ["Your website", "Traffic patterns and paths to enquiry"],
    ["Google", "Visibility, searches and nearby opportunities"],
    ["WhatsApp", "Enquiries, recurring questions and handovers"],
    ["Social", "Momentum, responses and content gaps"],
    ["Analytics", "What is changing and where attention is needed"],
  ];
  return (
    <section className={`${s.talking} ${s.talkingCompact}`}>
      <div className={s.shell}>
        <div className={s.talkingHeader}>
          <h2 className={`${s.display} ${s.sectionTitle}`}>Your business is talking all day. <span>Gro pays attention.</span></h2>
          <div><p className={s.sectionLead}>Every search, question, visit and conversation carries a clue. Gro brings those signals into one attentive view.</p><Link className={s.contextLink} href="/what-gro-does">Explore what Gro does <ArrowUpRight size={16}/></Link></div>
        </div>
        <div className={s.signalField}>
          <div className={s.sourceStreams}>
            {sources.map(([source, meaning]) => (
              <div className={s.sourceStream} key={source}>
                <b>{source}</b><div className={s.streamLine} aria-hidden="true" /><p>{meaning}</p>
              </div>
            ))}
          </div>
          <div className={s.listener}><div><strong>gro↗</strong><span>listens to all of it.</span></div></div>
        </div>
      </div>
    </section>
  );
}

export function AgentStory() {
  return (
    <section className={`${s.story} ${s.homeStory}`} id="gro-at-work">
      <div className={s.shell}>
        <div className={s.storyIntro}>
          <h2 className={`${s.display} ${s.sectionTitle}`}>From signal to useful action.</h2>
          <div><p className={s.sectionLead}>One repeated question can become a clearer customer experience and a useful growth opportunity.</p><Link className={s.contextLink} href="/how-it-works">See how Gro works <ArrowUpRight size={16}/></Link></div>
        </div>
        <div className={s.compactStory}>
          <article><span>Observe</span><MessageCircle size={22}/><h3>“How much does installation cost?”</h3><p>The same question keeps appearing in customer conversations.</p></article>
          <ArrowRight className={s.compactStoryArrow} aria-hidden="true"/>
          <article><span>Understand</span><Sparkles size={22}/><h3>Three signals point to one gap.</h3><p>The question is frequent, the website does not answer it, and related search demand exists.</p></article>
          <ArrowRight className={s.compactStoryArrow} aria-hidden="true"/>
          <article><span>Act</span><FileCheck2 size={22}/><h3>Useful work is prepared.</h3><p>FAQ copy, a page recommendation, a chatbot answer and a content idea are ready for review.</p></article>
        </div>
      </div>
    </section>
  );
}

export function DetailedAgentStory() {
  return (
    <section className={s.story}>
      <div className={s.shell}>
        <div className={s.storyIntro}>
          <h2 className={`${s.display} ${s.sectionTitle}`}>Observe. Understand. Act.</h2>
          <p className={s.sectionLead}>Gro follows one connected thread from a customer signal to useful work prepared for review.</p>
        </div>
        <ObserveUnderstandAct />
      </div>
    </section>
  );
}

export function CommandCentre() {
  const events = [
    ["09:12", Radar, "Signal received", "Pricing question detected across customer conversations."],
    ["09:14", Search, "Evidence checked", "Related service page reviewed for a clear answer."],
    ["09:16", Sparkles, "Opportunity found", "A pricing guide could answer intent earlier."],
    ["09:19", FileCheck2, "Work prepared", "Page guidance and reply draft queued for review."],
  ] as const;
  return (
    <section className={s.command} id="why-gro">
      <div className={s.shell}>
        <div className={s.commandHeader}>
          <h2 className={`${s.display} ${s.sectionTitle}`}>Gro is always looking for what matters next.</h2>
          <p className={s.sectionLead}>A calm view of what Gro has noticed, how the evidence connects, and what should happen next.</p>
        </div>
        <div className={s.commandBoard}>
          <div className={s.timeline}>
            <div className={s.panelHeader}><h3>Activity timeline</h3><span>Illustrative · Today</span></div>
            <ol>
              {events.map(([time, Icon, title, copy]) => (
                <li key={title}><time>{time}</time><span className={s.timelineIcon}><Icon size={13} /></span><div><b>{title}</b><p>{copy}</p></div></li>
              ))}
            </ol>
          </div>
          <aside className={s.nextAction}>
            <span>Next Best Action</span>
            <h3>Add clear installation pricing guidance.</h3>
            <p>Answer a repeated customer question on the page where people are already deciding whether to enquire.</p>
            <div className={s.actionStatus}><i /> Status · ready for human review</div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export function ChannelConstellation({ id }: { id?: string } = {}) {
  const nodes = [
    [s.nodeWebsite, Globe2, "Website", "High visits, fewer enquiries → path review prepared"],
    [s.nodeGoogle, Search, "Google", "Search opportunity → page improvement prepared"],
    [s.nodeWhatsapp, MessageCircle, "WhatsApp", "Customer needs a price → answer prepared"],
    [s.nodeSocial, Instagram, "Social media", "Quiet week → three posts prepared"],
    [s.nodeAnalytics, BarChart3, "Analytics", "Conversion pattern → likely cause explained"],
    [s.nodeChat, MessageCircle, "Customer chat", "Question repeated → FAQ opportunity found"],
  ] as const;
  return (
    <section className={s.constellation} id={id}>
      <div className={s.shell}>
        <h2 className={`${s.display} ${s.sectionTitle}`}>One agent across your digital business.</h2>
        <p className={s.sectionLead}>The value is in the connection: a question can shape a web page, a search opportunity can shape content, and each signal can inform the next action.</p>
        <div className={s.constellationMap}>
          <svg className={s.constellationLines} viewBox="0 0 900 560" aria-hidden="true">
            <line className={s.lineWebsite} x1="450" y1="280" x2="120" y2="110"/><line className={s.lineGoogle} x1="450" y1="280" x2="780" y2="110"/><line className={s.lineWhatsapp} x1="450" y1="280" x2="70" y2="360"/><line className={s.lineSocial} x1="450" y1="280" x2="830" y2="360"/><line className={s.lineAnalytics} x1="450" y1="280" x2="270" y2="510"/><line className={s.lineChat} x1="450" y1="280" x2="630" y2="510"/>
          </svg>
          <div className={s.constellationCore}><strong>gro↗</strong><span>Your Growth Agent</span></div>
          {nodes.map(([className, Icon, label, example]) => <div className={`${s.channelNode} ${className}`} key={label} tabIndex={0}><Icon size={20} strokeWidth={1.6}/><span>{label}</span><small>{example}</small></div>)}
        </div>
      </div>
    </section>
  );
}

const capabilityStories = [
  [TrendingUp, "Find the opportunity", "Gro watches for the signals that could lead to more visibility, enquiries or customer clarity.", "A service page is moving closer to Page 1. Focus the next improvement there."],
  [MessageCircle, "Understand the customer", "Repeated questions and conversation patterns show what people need before they can take the next step.", "Three pricing questions this week. Prepare one clear, reusable answer."],
  [PenLine, "Prepare useful work", "Gro turns connected evidence into recommendations, content and responses your team can review.", "Turn a common customer concern into a short FAQ and social post."],
  [BarChart3, "Keep improving", "Gro keeps watching after the work is done, so the next decision can reflect what changed.", "The new answer is helping more visitors reach the enquiry step."],
] as const;

export function Capabilities() {
  return (
    <section className={`${s.capabilities} ${s.homeCapabilities}`}>
      <div className={s.shell}>
        <div className={s.capabilitiesHeader}>
          <h2 className={`${s.display} ${s.sectionTitle}`}>What Gro can help with.</h2>
          <div><p className={s.sectionLead}>Four kinds of work, connected by one attentive Growth Agent.</p><Link className={s.contextLink} href="/what-gro-does">Explore all capabilities <ArrowUpRight size={16}/></Link></div>
        </div>
        <div className={s.capabilityList}>
          {capabilityStories.map(([Icon, title, copy, example]) => (
            <article className={s.capabilityStory} key={title}>
              <span className={s.capabilityIcon}><Icon size={22} strokeWidth={1.6}/></span>
              <h3>{title}</h3>
              <div className={s.capabilityDetail}><p>{copy}</p><div className={s.liveExample}><span>Example in motion</span><p>{example}</p></div></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HumanBacked() {
  return (
    <section className={`${s.human} ${s.homeHuman}`}>
      <div className={`${s.shell} ${s.humanGrid}`}>
        <div><h2 className={`${s.display} ${s.sectionTitle}`}>AI-powered. Human-backed.</h2><p className={s.sectionLead}>Gro brings speed and attention. The Fusion Ventures team brings judgement, review and implementation.</p><Link className={`${s.contextLink} ${s.contextLinkLight}`} href="/about">Why Gro works this way <ArrowUpRight size={16}/></Link></div>
        <div className={s.humanFlow}>
          <div className={s.humanLayer}><Users size={23}/><div><b>You bring the business.</b><span>Your goals, customers and knowledge set the direction.</span></div></div>
          <div className={s.humanLayer}><span className={s.humanLayerMark}>gro↗</span><div><b>Gro keeps watch.</b><span>Signals are connected and useful work is prepared.</span></div></div>
          <div className={s.humanLayer}><UserRoundCheck size={23}/><div><b>People stay involved.</b><span>The Fusion Ventures team supports judgement, review and action.</span></div></div>
          <div className={s.humanLayer}><ShieldCheck size={23}/><div><b>You stay in control.</b><span>Prepared work can be reviewed before it moves forward.</span></div></div>
        </div>
      </div>
    </section>
  );
}

export function SetupJourney() {
  const steps = [
    ["Understand the business", "We learn what you sell, who you serve and where you want to grow.", "Business brief"],
    ["Connect the right signals", "The supported digital channels that matter to your business are brought into view.", "Signal map"],
    ["Configure your agent", "Gro is shaped around your priorities, language and operating context.", "Agent profile"],
    ["Begin the working rhythm", "Gro watches, prepares and surfaces work for your team to review.", "First action plan"],
  ] as const;
  return (
    <section className={s.setup} id="how-it-works">
      <div className={s.shell}>
        <div className={s.setupHeader}><h2 className={`${s.display} ${s.sectionTitle}`}>From your business to a working Growth Agent.</h2><p className={s.sectionLead}>We handle the setup and technical side. You bring the business you know best.</p></div>
        <div className={s.setupFlow}>
          {steps.map(([title, copy, artifact]) => <article className={s.setupStep} key={title}><h3>{title}</h3><p>{copy}</p><span className={s.artifact}><CircleCheck size={13}/>{artifact}</span></article>)}
        </div>
        <div className={s.agentActive}><i /> GRO IS ACTIVE</div>
      </div>
    </section>
  );
}

export function Industries() {
  return (
    <section className={s.industries} id="for-businesses">
      <div className={s.shell}>
        <div className={s.industryHeader}><h2 className={`${s.display} ${s.sectionTitle}`}>Gro starts with what matters to your business.</h2><p className={s.sectionLead}>Choose a business type to see how the same attentive system can respond to a different working reality.</p></div>
        <IndustryChooser />
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className={s.final}>
      <div className={`${s.shell} ${s.finalGrid}`}>
        <h2 className={`${s.display} ${s.sectionTitle}`}>Give your business someone who’s paying attention.</h2>
        <div>
          <p className={s.finalText}>Website. Customers. Google. WhatsApp. Social. One Growth Agent looking across all of it.</p>
          <div className={s.finalActions}>
            <Link className={s.primaryLink} href="/contact">Get My Growth Agent <ArrowUpRight size={17}/></Link>
            <Link className={s.secondaryLink} href="/contact">Talk to Our Team <ArrowUpRight size={16}/></Link>
          </div>
          <span className={s.ready}><i /> READY TO LEARN YOUR BUSINESS</span>
        </div>
      </div>
    </section>
  );
}
