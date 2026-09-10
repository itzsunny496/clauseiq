import type { ClauseResult, ReviewableItem, NerEntity, StatutoryFlag, ClauseCategory } from "../types";
import { nanoid } from "../utils/nanoid";

export interface RawClause {
  id: string;
  header: string;
  text: string;
  lineStart: number;
  lineEnd: number;
}

const HEADER_RE = /^(?:(?:\d+\.)+\d*\.?\s+|(?:clause|section|article|schedule|annex(?:ure)?|exhibit)\s+\d+\s*[-:.)]?\s*|(?:[IVXLCDM]+\.?\s+))[A-Za-z].{2,80}$|^[A-Z][A-Z\s&,'''\-]{4,60}$/m;

export function extractClauses(text: string): RawClause[] {
  const lines = text.split("\n");
  const clauses: RawClause[] = [];
  let currentHeader = "Preamble";
  let currentLines: string[] = [];
  let startLine = 0;

  const flush = (endLine: number) => {
    const body = currentLines.join("\n").trim();
    if (body.length > 20) {
      clauses.push({ id: nanoid(), header: currentHeader, text: body, lineStart: startLine, lineEnd: endLine });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (HEADER_RE.test(line) && line.length < 120) {
      flush(i - 1);
      currentHeader = line;
      currentLines = [];
      startLine = i + 1;
    } else {
      currentLines.push(line);
    }
  }
  flush(lines.length - 1);
  return clauses;
}

export function buildClauseResult(
  raw: RawClause,
  risk: ReviewableItem<import("../types").RiskLevel>,
  flags: StatutoryFlag[],
  entities: NerEntity[],
  categories: ClauseCategory[]
): ClauseResult {
  return { id: raw.id, header: raw.header, text: raw.text, lineStart: raw.lineStart, lineEnd: raw.lineEnd, categories, risk, flags, entities };
}
