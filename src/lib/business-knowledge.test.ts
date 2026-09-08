import { describe, expect, it } from "vitest";
import { parseKnowledgeFaqs, parseKnowledgeList } from "./business-knowledge";

describe("business knowledge normalization", () => {
  it("trims and removes duplicate services or locations case-insensitively", () => {
    expect(parseKnowledgeList("Dubai, Sharjah, dubai,  ")).toEqual(["Dubai", "Sharjah"]);
  });

  it("parses verified FAQ lines while preserving pipes in answers", () => {
    expect(parseKnowledgeFaqs("Where? | Dubai | Sharjah\nWhen? | Monday")).toEqual([
      { question: "Where?", answer: "Dubai | Sharjah" },
      { question: "When?", answer: "Monday" },
    ]);
  });

  it("rejects incomplete FAQ entries", () => {
    expect(() => parseKnowledgeFaqs("Missing separator")).toThrow("Question | Answer");
    expect(() => parseKnowledgeFaqs("Question only | ")).toThrow("Question | Answer");
  });
});
