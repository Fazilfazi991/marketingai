export type BusinessFaq = { question: string; answer: string };

export function parseKnowledgeList(value: string): string[] {
  const seen = new Set<string>();
  return value.split(",").map(item => item.trim()).filter(item => {
    const key = item.toLocaleLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseKnowledgeFaqs(value: string): BusinessFaq[] {
  return value.split("\n").filter(line => line.trim()).map(line => {
    const separator = line.indexOf("|");
    const question = separator < 0 ? "" : line.slice(0, separator).trim();
    const answer = separator < 0 ? "" : line.slice(separator + 1).trim();
    if (!question || !answer) throw new Error("Write each FAQ as Question | Answer on its own line.");
    return { question, answer };
  });
}
