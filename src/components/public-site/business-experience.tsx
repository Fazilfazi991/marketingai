"use client";

import { useRef, useState } from "react";
import { ArrowRight, CircleCheck, Eye, Lightbulb, MessageCircle } from "lucide-react";
import s from "./detail-pages.module.css";

const industries = [
  {
    name: "Local businesses",
    watches: "Local search visibility, service-area questions and enquiry patterns.",
    asks: "“Do you cover Arabian Ranches?”",
    finds: "Customers need a clearer answer before they enquire.",
    prepares: "A service-area update, local Google content and a reusable reply.",
  },
  {
    name: "Professional services",
    watches: "High-intent service pages, consultation enquiries and recurring concerns.",
    asks: "“What happens in the first consultation?”",
    finds: "The decision process needs to feel clearer and lower risk.",
    prepares: "A consultation guide, FAQ response and follow-up draft.",
  },
  {
    name: "Clinics",
    watches: "Treatment questions, location intent and paths to booking.",
    asks: "“Is this treatment suitable for me?”",
    finds: "Visitors need a safe route to speak with the clinic team.",
    prepares: "An approved-information reply and a clearer booking journey recommendation.",
  },
  {
    name: "Real estate",
    watches: "Property requests, area demand and repeated buyer or tenant criteria.",
    asks: "“Do you have a two-bedroom property in this area?”",
    finds: "Several enquiries point to the same pocket of demand.",
    prepares: "A demand summary, common-question answer and content idea for review.",
  },
  {
    name: "Home services",
    watches: "Urgent enquiries, service locations and quote-related questions.",
    asks: "“How quickly can someone visit?”",
    finds: "Response expectations are unclear at the moment of enquiry.",
    prepares: "A response template and clearer service-availability guidance.",
  },
  {
    name: "Hospitality",
    watches: "Booking questions, seasonal interest and guest experience signals.",
    asks: "“Can you accommodate a late check-in?”",
    finds: "A frequently requested detail is difficult to find before booking.",
    prepares: "A guest answer, website clarification and timely social content idea.",
  },
  {
    name: "Retail / ecommerce",
    watches: "Product questions, buying friction and changes in customer interest.",
    asks: "“When will this item be available again?”",
    finds: "Demand is building around an unavailable product.",
    prepares: "A customer reply, related-product guidance and demand-led content.",
  },
] as const;

export function BusinessExperience() {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const industry = industries[active];

  function moveFocus(index: number) {
    const next = (index + industries.length) % industries.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className={s.businessExperience}>
      <div className={s.industryTabs} role="tablist" aria-label="Choose a business type">
        {industries.map((item, index) => (
          <button
            aria-controls="business-example"
            aria-selected={active === index}
            className={active === index ? s.industryTabActive : undefined}
            id={`business-tab-${index}`}
            key={item.name}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") moveFocus(index + 1);
              if (event.key === "ArrowLeft") moveFocus(index - 1);
              if (event.key === "Home") moveFocus(0);
              if (event.key === "End") moveFocus(industries.length - 1);
            }}
            ref={(node) => { tabs.current[index] = node; }}
            role="tab"
            tabIndex={active === index ? 0 : -1}
            type="button"
          >
            {item.name}
          </button>
        ))}
      </div>

      <section
        aria-labelledby={`business-tab-${active}`}
        className={s.businessPanel}
        id="business-example"
        role="tabpanel"
      >
        <div className={s.businessPanelTitle}>
          <span>Illustrative Gro view</span>
          <h2>{industry.name}</h2>
        </div>
        <div className={s.businessSignals}>
          <article><Eye size={19}/><span>What Gro watches</span><p>{industry.watches}</p></article>
          <ArrowRight className={s.businessArrow} aria-hidden="true"/>
          <article><MessageCircle size={19}/><span>What customers may ask</span><p>{industry.asks}</p></article>
          <ArrowRight className={s.businessArrow} aria-hidden="true"/>
          <article><Lightbulb size={19}/><span>What Gro may find</span><p>{industry.finds}</p></article>
          <ArrowRight className={s.businessArrow} aria-hidden="true"/>
          <article className={s.businessPrepared}><CircleCheck size={19}/><span>What Gro may prepare</span><p>{industry.prepares}</p></article>
        </div>
      </section>
      <p className={s.illustrativeNote}>Examples are illustrative. Gro is configured around the evidence and supported channels available for each business.</p>
    </div>
  );
}
