import type { ClauseResult } from "../types";
import { extractClauses, buildClauseResult } from "./clauseExtractor";
import { tagClause } from "./clauseTagger";
import { evaluateStatutoryRules } from "./statutoryRules";
import { wrap } from "./humanReview";
import { extractComplianceEvents } from "./dateExtractor";

export function analyzeContract(text: string): ClauseResult[] {
  const rawClauses = extractClauses(text);
  return rawClauses.map((raw) => {
    const fullClauseText = `${raw.header}\n${raw.text}`;
    const categories = tagClause(fullClauseText);
    const { risk: riskLevel, flags } = evaluateStatutoryRules(fullClauseText);

    const confidence = flags.length > 0 ? 0.85 : categories[0] !== "OTHER" ? 0.65 : 0.4;
    const riskItem = wrap(riskLevel, "rule-engine", confidence);

    const complianceEvents = categories.flatMap((cat) =>
      ["AUTO_RENEWAL", "TERMINATION", "PAYMENT"].includes(cat)
        ? extractComplianceEvents(raw.id, fullClauseText, cat)
        : []
    );

    return {
      ...buildClauseResult(raw, riskItem, flags, [], categories),
      complianceEvents: complianceEvents.length > 0 ? complianceEvents : undefined,
    };
  });
}
