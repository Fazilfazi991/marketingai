import { describe, expect, it } from "vitest";
import { addWebsiteEvidence, newEvidence } from "./evidence";
import { routeGrowthIntent } from "./intent";
import { growthCapability } from "./capability";
import type { GrowthAgentContext } from "./contracts";

describe("inspected website evidence", () => {
  it.each(["Which pages need attention?", "What should we inspect first?"])("does not infer priority from healthy status codes: %s", question => {
    const evidence=newEvidence(); addWebsiteEvidence(evidence,[{id:"row",url:"https://public.example",status_code:200,title:"Present",h1:"Present",meta_description:"Present",last_inspected_at:"2026-09-12T00:00:00Z"}]);
    evidence.sources={business:{state:"available",through:null},website:{state:"available",through:null}};
    expect(growthCapability({question,intent:"website",evidence} as GrowthAgentContext).state).toBe("insufficient_data");
  });
  it("only emits inspected observations and linked non-performance recommendations", () => {
    const packet = newEvidence();
    addWebsiteEvidence(packet, [
      { id: "real-row", url: "https://public.example/about", status_code: 200, title: "", meta_description: "About", h1: "About", last_inspected_at: "2026-09-12T00:00:00Z" },
      { id: "uninspected", url: "https://public.example/other", status_code: 200 },
    ]);
    expect(packet.facts).toHaveLength(2);
    expect(packet.facts.every(fact => fact.source === "website" && fact.id.includes("real-row"))).toBe(true);
    expect(packet.recommendations[0].evidenceIds.every(id => packet.facts.some(fact => fact.id === id))).toBe(true);
    expect(packet.recommendations[0].text).toContain("not evidence of traffic loss");
    expect(packet.facts.every(fact => fact.changePercent === null)).toBe(true);
  });
  it("does not convert unavailable metadata into a missing-tag finding", () => {
    const packet=newEvidence(); addWebsiteEvidence(packet,[{id:"row",url:"https://public.example",status_code:200,last_inspected_at:"2026-09-12T00:00:00Z"}]);
    expect(packet.recommendations).toEqual([]);
  });
  it("routes the requested inspection and missing-information questions", () => {
    expect(routeGrowthIntent("What should we inspect first?")).toBe("website");
    expect(routeGrowthIntent("What information are you missing?")).toBe("availability");
  });
});
