import type { GeneralDocResult } from "../types";

export function extractGeneralDoc(text: string): GeneralDocResult {
  const wordCount = text.trim().split(/\s+/).length;
  // Simple summary until NER enriches entities
  return {
    entities: [],
    summary: `Document contains approximately ${wordCount} words. No specific document type detected — statutory rules not applied. Use the NER panel to view extracted entities and the Copilot for questions.`,
    wordCount,
  };
}
