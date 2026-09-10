import { pipeline } from "@xenova/transformers";
import type { NerEntity } from "../types";

const TYPE_MAP: Record<string, string> = {
  "I-ORG": "ORG", "B-ORG": "ORG",
  "I-PER": "PERSON", "B-PER": "PERSON",
  "I-LOC": "MISC", "B-LOC": "MISC",
  "I-MISC": "MISC", "B-MISC": "MISC",
  "ORG": "ORG", "PER": "PERSON", "LOC": "MISC", "MISC": "MISC",
};

let ner: any = null;

async function load() {
  ner = await pipeline("token-classification", "Xenova/bert-base-NER");
  self.postMessage({ type: "ready" });
}

load().catch(console.error);

self.addEventListener("message", async (e: MessageEvent) => {
  const { id, text } = e.data;
  if (!ner) { self.postMessage({ id, entities: [] }); return; }
  try {
    const results = await ner(text) as Array<{ entity_group?: string; entity?: string; word: string; score: number; start: number; end: number }>;
    const entities: NerEntity[] = results
      .filter((r) => r.score > 0.65 && TYPE_MAP[r.entity_group || r.entity || ""])
      .map((r) => ({
        text: r.word,
        type: (TYPE_MAP[r.entity_group || r.entity || ""] || "MISC") as NerEntity["type"],
        start: r.start || 0,
        end: r.end || (r.start ? r.start + r.word.length : r.word.length),
        confidence: r.score,
        source: "ml" as const,
      }));
    self.postMessage({ id, entities });
  } catch { self.postMessage({ id, entities: [] }); }
});
