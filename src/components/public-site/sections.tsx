import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Globe2,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  ChartNoAxesCombined,
  PenLine,
  Users,
  MoveUpRight,
} from "lucide-react";
import { GrowthCTA } from "./chrome";
import { publicSite } from "./site-config";
import s from "./public-site.module.css";

export function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.heroCopy}>
        <p className={s.eyebrow}>
          <span /> AI-powered. Human-backed.
        </p>
        <h1>Get a Growth Agent for your business.</h1>
        <p className={s.lead}>
          Your website. Your Google visibility. Your customer conversations.
          Your social media. One Growth Agent helping move it all forward.
        </p>
        <p className={s.heroReassurance}>
          Configured for your business. Managed with you by Fusion Ventures. No
          new software to learn.
        </p>
        <div className={s.actions}>
          <GrowthCTA />
          <a className={s.textLink} href="#how-it-works">
            See how Gro works <ArrowDown size={16} />
          </a>
        </div>
      </div>
      <div className={s.heroVisual}>
        <div className={s.visualCaption}>
          <span>A little more clarity. Every day.</span>
          <span>↓</span>
        </div>
        <article className={s.agentNote}>
          <header>
            <div className={s.agentMark}>g↗</div>
            <div>
              <h2>Your Growth Agent</h2>
              <span className={s.status}>
                <i /> Looking after your business
              </span>
            </div>
            <Sparkles size={21} />
          </header>
          <p className={s.noteTitle}>
            “I found a few things
            <br />
            worth your attention.”
          </p>
          <div className={s.noteRows}>
            {[
              [
                Search,
                "Google",
                "Your service page is getting closer to Page 1.",
              ],
              [
                MessageCircle,
                "Customers",
                "Several customers asked about pricing.",
              ],
              [PenLine, "Social", "This week’s content is ready for review."],
            ].map(([Icon, title, copy]) => {
              const ItemIcon = Icon as typeof Search;
              return (
                <div key={String(title)}>
                  <ItemIcon size={18} />
                  <p>
                    <b>{String(title)}</b>
                    <span>{String(copy)}</span>
                  </p>
                  <ArrowUpRight size={15} />
                </div>
              );
            })}
          </div>
          <div className={s.opportunity}>
            <span>
              <TrendingUp size={16} /> An opportunity worth exploring
            </span>
            <p>
              Let’s add clear installation pricing to your service page. Answer
              a common question. Make enquiring easier.
            </p>
          </div>
          <footer>
            <span className={s.miniAvatar}>fv</span> Backed by your Fusion
            Ventures team
          </footer>
        </article>
        <p className={s.exampleCaption}>
          An illustrative briefing. Your agent follows your business.
        </p>
      </div>
    </section>
  );
}
export function ProblemSection() {
  return (
    <section className={s.problem}>
      <p className={s.sectionKicker}>
        A business to run. A lot to keep an eye on.
      </p>
      <h2>
        Running your business is a full-time job.
        <br />
        Watching everything online shouldn’t be another one.
      </h2>
      <div>
        <p>
          Customers are asking questions. Your website is getting traffic.
          Google is showing opportunities. Your social channels need attention.
        </p>
        <p>
          Your business is already generating signals every day.{" "}
          <strong>Gro connects the dots.</strong>
        </p>
      </div>
    </section>
  );
}
const capabilities = [
  [
    TrendingUp,
    "Find more opportunities",
    "See what could bring more visibility, enquiries and customers, with a clear next step.",
  ],
  [
    MessageCircle,
    "Organise customer conversations",
    "Bring supported website enquiries and conversation workflows into a supervised request process.",
  ],
  [
    PenLine,
    "Create & stay active",
    "Prepare relevant social content and help keep your business showing up consistently.",
  ],
  [
    Globe2,
    "Improve your website",
    "Find the pages, missing information and customer journeys that could work harder.",
  ],
  [
    Search,
    "Grow on Google",
    "Spot SEO and search opportunities, then understand what to improve next.",
  ],
  [
    ChartNoAxesCombined,
    "Understand what’s working",
    "Turn business analytics and marketing signals into recommendations you can use.",
  ],
] as const;
export function Capabilities() {
  return (
    <section className={s.section} id="what-gro-does">
      <div className={s.sectionHeading}>
        <h2>
          A little less to manage.
          <br />A lot more looked after.
        </h2>
        <p>
          One Growth Agent, built around the everyday jobs that help your
          business grow online.
        </p>
      </div>
      <div className={s.capabilities}>
        {capabilities.map(([Icon, title, copy]) => (
          <article key={title}>
            <Icon size={23} strokeWidth={1.5} />
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function IntelligenceExamples() {
  return (
    <section className={s.intelligence} id="why-gro">
      <div className={s.sectionHeading}>
        <h2>
          Gro doesn’t just show you data.
          <br />
          It tells you what matters.
        </h2>
        <p>
          From an everyday signal to a useful next move. Here’s what that could
          look like.
        </p>
      </div>
      <div className={s.exampleMain}>
        <div>
          <span className={s.sectionKicker}>What customers are saying</span>
          <blockquote>
            “How much does
            <br />
            installation cost?”
          </blockquote>
          <p>The same question keeps coming up in customer conversations.</p>
        </div>
        <div className={s.exampleResponse}>
          <span className={s.agentMark}>g↗</span>
          <h3>A question is also an opportunity.</h3>
          <p>
            Your service page doesn’t clearly explain installation pricing. Add
            pricing guidance and a short FAQ to help customers take the next
            step.
          </p>
          <span className={s.impact}>
            <Check size={16} /> Clearer answers. An easier path to enquiry.
          </span>
        </div>
      </div>
      <div className={s.exampleList}>
        {[
          [
            "Almost on Page 1",
            "A service page is around positions 10–15.",
            "You’re close. Improving this page could be one of your strongest search opportunities this week.",
          ],
          [
            "A quiet social feed",
            "There hasn’t been a recent post.",
            "Let’s build this week’s content around the services customers are asking about.",
          ],
          [
            "Fewer enquiries",
            "Traffic is stable, but enquiries have dropped.",
            "Fewer visitors are reaching the enquiry step. I recommend reviewing this page first.",
          ],
        ].map(([title, signal, response]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{signal}</p>
            <div>
              <Sparkles size={16} />
              <p>{response}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function ConnectedGrowth() {
  return (
    <section className={`${s.section} ${s.connected}`}>
      <h2>
        One Growth Agent.
        <br />
        Across your digital business.
      </h2>
      <div className={s.connectionVisual}>
        <div className={s.channelList}>
          {[
            "Website",
            "Google",
            "WhatsApp",
            "Website chat",
            "Social media",
            "Analytics",
            "Customer enquiries",
          ].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <div className={s.connectionLine} aria-hidden="true" />
        <div className={s.hub}>
          <strong>gro↗</strong>
          <span>Your Growth Agent</span>
        </div>
        <div className={s.connectionLine} aria-hidden="true" />
        <div className={s.outputList}>
          {[
            "Useful answers",
            "Clear recommendations",
            "Relevant content",
            "Actions & improvements",
            "Thoughtful follow-ups",
          ].map((x) => (
            <span key={x}>
              <Check size={16} />
              {x}
            </span>
          ))}
        </div>
      </div>
      <p>All those separate signals. A more joined-up way forward.</p>
      <GrowthCTA />
    </section>
  );
}
export function HowItWorks() {
  return (
    <section className={s.section} id="how-it-works">
      <div className={s.sectionHeading}>
        <h2>
          Your business is unique.
          <br />
          Your Growth Agent should be too.
        </h2>
        <p>
          We handle the setup and the technical side. You bring the business you
          know best.
        </p>
      </div>
      <ol className={s.steps}>
        {[
          [
            "We understand your business.",
            "We learn what you sell, who your customers are, your goals and how your business works online.",
          ],
          [
            "We prepare your Growth Agent.",
            "We configure Gro around your business and connect the digital channels that matter to you.",
          ],
          [
            "Your Growth Agent gets to work.",
            "Gro brings verified signals together, highlights opportunities and prepares work for human review.",
          ],
        ].map(([title, copy], i) => (
          <li key={title}>
            <span>0{i + 1}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </li>
        ))}
      </ol>
      <div className={s.reassurance}>
        <Check size={17} /> No complicated setup. No marketing dashboards to
        learn.
      </div>
    </section>
  );
}
export function HumanBacked() {
  return (
    <section className={s.human}>
      <div>
        <p className={s.sectionKicker}>Intelligence, with people behind it.</p>
        <h2>
          AI-powered.
          <br />
          Human-backed.
        </h2>
        <p>
          Gro can analyse connected evidence, prepare work and recommend next
          steps. When implementation or judgement is needed, the Fusion
          Ventures team is behind your Growth Agent.
        </p>
        <p>
          You have a team to talk to, and a Growth Agent built around verified
          information.
        </p>
      </div>
      <div className={s.teamVisual}>
        <span>
          <Users size={20} /> You & your business
        </span>
        <i aria-hidden="true">↕</i>
        <strong>
          gro↗<small>Your Growth Agent</small>
        </strong>
        <i aria-hidden="true">↕</i>
        <span>
          <span className={s.miniAvatar}>fv</span> Fusion Ventures team
        </span>
      </div>
    </section>
  );
}
export function WhoItsFor() {
  return (
    <section className={`${s.section} ${s.audience}`} id="for-businesses">
      <h2>
        Built for businesses that want growth
        <br />
        without another tool to manage.
      </h2>
      <p>
        Whether you serve a neighbourhood or customers everywhere, Gro starts
        with what matters to your business.
      </p>
      <div>
        {[
          "Local businesses",
          "Professional services",
          "Retail & e-commerce",
          "Clinics",
          "Home services",
          "Hospitality",
          "Property businesses",
          "Growing SMEs",
        ].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </section>
  );
}
export function FinalCTA() {
  return (
    <section className={s.finalCta} id="contact">
      <div>
        <p className={s.sectionKicker}>Let’s talk about your business.</p>
        <h2>
          Your business shouldn’t
          <br />
          have to grow alone.
        </h2>
        <p>
          Get a Growth Agent configured around your business, customers and
          goals.
        </p>
      </div>
      <div className={s.contactPanel}>
        <MoveUpRight size={30} />
        <h3>A conversation is the first step.</h3>
        <p>
          Tell us about your business and what you’d like to improve. We’ll work
          out where Gro can help.
        </p>
        {publicSite.contactUrl ? (
          <a className={s.cta} href={publicSite.contactUrl}>
            Get My Growth Agent <ArrowUpRight size={17} />
          </a>
        ) : (
          <p className={s.contactPending}>
            Online enquiries are opening soon. If you’re already speaking with
            Fusion Ventures, contact your team directly to discuss Gro.
          </p>
        )}
        <a
          className={s.textLink}
          href="mailto:info@fusionventuresglobal.com?subject=Gro%20Growth%20Agent%20enquiry"
        >
          Or email our team <ArrowUpRight size={15} />
        </a>
        <small>Opens WhatsApp. No account with Gro needed.</small>
      </div>
    </section>
  );
}
