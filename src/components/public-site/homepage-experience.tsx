"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowRight,
  Check,
  Lightbulb,
  MessageCircle,
  Search,
} from "lucide-react";
import s from "./homepage.module.css";

const storySteps = [
  {
    id: "observe",
    verb: "Observe",
    title: "A question keeps appearing.",
    copy: "Customers are repeatedly asking what installation costs before they enquire.",
    source: "Customer conversations",
    signal: "“How much does installation cost?”",
  },
  {
    id: "understand",
    verb: "Understand",
    title: "The answer is hard to find.",
    copy: "Gro connects the repeated question to a gap on your service page: there is no clear pricing guidance.",
    source: "Gro’s interpretation",
    signal: "Pricing intent + missing website answer",
  },
  {
    id: "act",
    verb: "Act",
    title: "A useful next move is prepared.",
    copy: "Add an installation pricing guide and a short FAQ, ready for human review before anything changes.",
    source: "Recommended action",
    signal: "Pricing guide + FAQ draft",
  },
] as const;

export function ObserveUnderstandAct() {
  const [active, setActive] = useState(0);
  const items = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const next = Number((visible.target as HTMLElement).dataset.step);
        if (!Number.isNaN(next)) setActive(next);
      },
      { rootMargin: "-30% 0px -45%", threshold: [0.2, 0.55, 0.8] },
    );

    items.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const current = storySteps[active];

  return (
    <div className={s.storyLayout}>
      <div className={s.storyCopy}>
        {storySteps.map((step, index) => (
          <div
            className={`${s.storyStep} ${active === index ? s.storyStepActive : ""}`}
            data-step={index}
            key={step.id}
            ref={(node) => {
              items.current[index] = node;
            }}
          >
            <span>{step.verb}</span>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
            <div className={s.mobileStoryCard}>
              <div className={s.storySignal}>
                <div className={s.storySignalTop}>
                  {index === 0 ? <MessageCircle size={18} /> : index === 1 ? <Search size={18} /> : <Lightbulb size={18} />}
                  <span>{step.source}</span>
                  <small>Illustrative</small>
                </div>
                <p>{step.signal}</p>
              </div>
              <div className={s.storyThought}>
                <strong>gro↗</strong>
                <span>{index === 0 ? "Watching the pattern" : index === 1 ? "Connecting the evidence" : "Preparing the next move"}</span>
                <div className={s.thoughtDots} aria-hidden="true"><i /><i /><i /></div>
              </div>
              <div className={`${s.storyOutcome} ${index === 2 ? s.storyOutcomeReady : ""}`}>
                <Check size={17} />
                <span>{index === 2 ? "Ready for human review" : "Building the picture"}</span>
                <ArrowRight size={17} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={s.storySticky} aria-live="polite">
        <div className={s.storyRail} aria-hidden="true">
          {storySteps.map((step, index) => (
            <i className={index <= active ? s.storyRailActive : ""} key={step.id} />
          ))}
        </div>
        <div className={s.storySignal}>
          <div className={s.storySignalTop}>
            {active === 0 ? <MessageCircle size={18} /> : active === 1 ? <Search size={18} /> : <Lightbulb size={18} />}
            <span>{current.source}</span>
            <small>Illustrative</small>
          </div>
          <p>{current.signal}</p>
        </div>
        <div className={s.storyThought}>
          <strong>gro↗</strong>
          <span>{current.verb === "Observe" ? "Watching the pattern" : current.verb === "Understand" ? "Connecting the evidence" : "Preparing the next move"}</span>
          <div className={s.thoughtDots} aria-hidden="true"><i /><i /><i /></div>
        </div>
        <div className={`${s.storyOutcome} ${active === 2 ? s.storyOutcomeReady : ""}`}>
          <Check size={17} />
          <span>{active === 2 ? "Ready for human review" : "Building the picture"}</span>
          <ArrowRight size={17} />
        </div>
      </div>
    </div>
  );
}

const industries = {
  "Local services": {
    signal: "Three customers asked whether you cover Arabian Ranches.",
    action: "Add a service-area answer and prepare a local Google update.",
  },
  Clinics: {
    signal: "Visitors keep leaving the treatment page before booking.",
    action: "Clarify the consultation journey and make the next step easier to find.",
  },
  Hospitality: {
    signal: "Weekend menu searches are rising while your latest post is two weeks old.",
    action: "Prepare a weekend feature using the dishes people are already finding.",
  },
  Property: {
    signal: "Enquiries repeatedly ask about payment plans for one development.",
    action: "Draft a clear payment-plan explainer for the listing and enquiry replies.",
  },
  "Professional services": {
    signal: "A specialist service page is close to the first page of Google.",
    action: "Strengthen the page around the questions prospective clients search for.",
  },
  Retail: {
    signal: "A popular product is getting views, but size questions are slowing purchases.",
    action: "Improve the size guide and prepare answers for customer conversations.",
  },
  "Growing SMEs": {
    signal: "Website traffic is steady, but fewer visitors reach the enquiry step.",
    action: "Review the highest-exit page and prepare a clearer path to contact.",
  },
} as const;

type Industry = keyof typeof industries;

export function IndustryChooser() {
  const names = Object.keys(industries) as Industry[];
  const [active, setActive] = useState<Industry>(names[0]);
  const example = industries[active];
  const chooseWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next = index;
    if (event.key in moves) next = (index + moves[event.key] + names.length) % names.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = names.length - 1;
    else return;
    event.preventDefault();
    setActive(names[next]);
    document.getElementById(`industry-tab-${next}`)?.focus();
  };

  return (
    <div className={s.industryExperience}>
      <div className={s.industryTabs} role="tablist" aria-label="Choose a business type">
        {names.map((name) => (
          <button
            aria-controls="industry-example"
            aria-selected={active === name}
            className={active === name ? s.industryTabActive : ""}
            id={`industry-tab-${names.indexOf(name)}`}
            key={name}
            onClick={() => setActive(name)}
            onKeyDown={(event) => chooseWithKeyboard(event, names.indexOf(name))}
            role="tab"
            tabIndex={active === name ? 0 : -1}
            type="button"
          >
            {name}
          </button>
        ))}
      </div>
      <div aria-labelledby={`industry-tab-${names.indexOf(active)}`} className={s.industryExample} id="industry-example" role="tabpanel">
        <div>
          <span>Signal noticed</span>
          <p>{example.signal}</p>
        </div>
        <ArrowRight aria-hidden="true" size={24} />
        <div>
          <span>Gro’s next move</span>
          <p>{example.action}</p>
        </div>
      </div>
      <small>Illustrative examples. Gro is configured around the evidence available for your business.</small>
    </div>
  );
}
