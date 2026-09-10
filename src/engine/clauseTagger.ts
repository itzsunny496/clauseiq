import type { ClauseCategory } from "../types";
import { matchAutoRenewal } from "./regexUtils";

const PATTERNS: Record<ClauseCategory, RegExp[]> = {
  PAYMENT: [
    /\b(?:payment|invoice|fee|consideration|price|amount\s+due|pay(?:able|ment\s+terms?)|due\s+date|net\s+\d+)\b/i,
    /\b(?:installment|milestone\s+payment|advance|deposit|retainer)\b/i,
  ],
  TERMINATION: [
    /\b(?:terminat(?:ion|e)|cancel(?:lation)?|cessation|discontinu(?:e|ance)|notice\s+(?:of\s+)?termination)\b/i,
    /\b(?:for\s+cause|for\s+convenience|material\s+breach|cure\s+period)\b/i,
  ],
  AUTO_RENEWAL: [
    /auto(?:matically)?[-\s]renew|automatic\s+(?:renewal|extension|rollover)/i,
    /shall\s+(?:automatically\s+)?(?:renew|extend|continue|roll\s+over).*unless/i,
    /evergreen|unless.*notice.*terminat/i,
  ],
  LIABILITY: [
    /\b(?:indemnif(?:y|ication)|liabilit(?:y|ies)|consequential\s+(?:loss|damage)|limitation\s+of\s+liability)\b/i,
    /\b(?:hold\s+harmless|defend|losses?\s+arising|damages?\s+(?:incurred|suffered))\b/i,
  ],
  CONFIDENTIALITY: [
    /\b(?:confidential(?:ity)?|non[-\s]disclos(?:ure|e)|proprietary\s+information|trade\s+secret)\b/i,
    /\b(?:NDA|non[-\s]disclosure\s+agreement|data\s+protection)\b/i,
  ],
  DISPUTE: [
    /\b(?:arbitrat(?:ion|or)|dispute\s+(?:resolution|settlement)|governing\s+law|jurisdiction|mediat(?:ion|e))\b/i,
    /\b(?:MSME\s+Samadhaan|Facilitation\s+Council|conciliat(?:ion|e))\b/i,
  ],
  OTHER: [],
};

export function tagClause(text: string): ClauseCategory[] {
  const found: ClauseCategory[] = [];
  for (const [category, patterns] of Object.entries(PATTERNS) as [ClauseCategory, RegExp[]][]) {
    if (category === "OTHER") continue;
    if (patterns.some((re) => re.test(text))) found.push(category);
  }
  // Special: AUTO_RENEWAL from regexUtils
  if (!found.includes("AUTO_RENEWAL") && matchAutoRenewal(text)) found.push("AUTO_RENEWAL");
  return found.length > 0 ? found : ["OTHER"];
}
