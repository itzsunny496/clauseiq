import type { NerEntity, EntityType } from "../types";

// Stage 1: Regex-based NER (always synchronous)
const PATTERNS: { type: EntityType; re: RegExp }[] = [
  { type: "GST_NUMBER", re: /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/g },
  { type: "AMOUNT",     re: /(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{1,2})?/gi },
  { type: "DATE",       re: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g },
  { type: "DATE",       re: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi },
  { type: "ORG",        re: /(?:M\/s\.?\s+|between\s+|Vendor:\s*|Buyer:\s*|Supplier:\s*|Party\s+[AB]:\s*)([A-Z][A-Za-z0-9\s&.,''()-]{2,50})/g },
  { type: "PERSON",     re: /(?:Shri\.?\s+|Mr\.?\s+|Ms\.?\s+|Mrs\.?\s+|Dr\.?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g },
];

function dedup(entities: NerEntity[]): NerEntity[] {
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.start}-${e.end}-${e.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractEntitiesRegex(text: string): NerEntity[] {
  const entities: NerEntity[] = [];
  for (const { type, re } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matched = m[1] ?? m[0];
      const start = m.index + (m[1] ? m[0].indexOf(m[1]) : 0);
      entities.push({ text: matched.trim(), type, start, end: start + matched.trim().length, confidence: 0.85, source: "regex" });
    }
  }
  return dedup(entities.sort((a, b) => a.start - b.start));
}

// Stage 2: ML NER via @xenova/transformers (async, Web Worker)
let mlWorker: Worker | null = null;
let mlReady = false;

export function initMlNer(): void {
  if (mlWorker || typeof Worker === "undefined") return;
  mlWorker = new Worker(new URL("./nerWorker.ts", import.meta.url), { type: "module" });
  mlWorker.addEventListener("message", (e) => {
    if (e.data.type === "ready") mlReady = true;
  });
}

export async function extractEntitiesML(text: string): Promise<NerEntity[]> {
  if (!mlWorker || !mlReady) return [];
  return new Promise((resolve) => {
    const id = Math.random().toString(36).slice(2);
    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      mlWorker!.removeEventListener("message", handler);
      resolve((e.data.entities as NerEntity[]) ?? []);
    };
    mlWorker!.addEventListener("message", handler);
    mlWorker!.postMessage({ id, text: text.slice(0, 2000) }); // limit for perf
  });
}

export async function extractEntities(text: string): Promise<NerEntity[]> {
  const stage1 = extractEntitiesRegex(text);
  const stage2 = await extractEntitiesML(text);
  // Merge: prefer ML where confidence > 0.7 and overlaps with regex
  const merged = [...stage1];
  for (const ml of stage2) {
    const overlaps = merged.some((r) => r.start < ml.end && ml.start < r.end);
    if (!overlaps && ml.confidence > 0.7) merged.push(ml);
  }
  return dedup(merged.sort((a, b) => a.start - b.start));
}
