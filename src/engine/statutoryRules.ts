import type { RiskLevel, StatutoryFlag } from "../types";
import {
  extractDays, matchArbitratorBias, matchNonCompete,
  matchLiquidatedDamages, matchForeignSeat, matchIndemnityAsymmetry,
} from "./regexUtils";

interface RuleResult {
  triggered: boolean;
  flag?: StatutoryFlag;
}

// MSMED Act 2006 -- Payment > 45 days
function checkMSMEDPayment(text: string): RuleResult {
  const days = extractDays(text);
  if (days !== null && days > 45) {
    return {
      triggered: true,
      flag: {
        ruleId: "MSMED_PAYMENT",
        act: "MSMED Act 2006",
        section: "§§15-16",
        citation: "MSMED Act 2006, Sections 15 & 16",
        risk: "High",
        reasoning: `Payment term of ${days} days exceeds the statutory 45-day limit for MSME suppliers. Buyer is liable to pay compound interest at 3× RBI Bank Rate on delayed amounts.`,
        counterClause: `Payment shall be made within 45 (forty-five) days of receipt of invoice, as mandated by Section 15 of the MSMED Act, 2006. Any delayed payment shall attract compound interest at three times the bank rate notified by the Reserve Bank of India under Section 16.`,
      },
    };
  }
  return { triggered: false };
}

// MSMED Act 2006 -- Missing late interest
function checkMSMEDInterest(text: string): RuleResult {
  const hasPaymentClause = /payment|due\s+date|invoice/i.test(text);
  const hasInterestClause = /interest|late\s+payment\s+charge|rbi\s+bank\s+rate|compound\s+interest/i.test(text);
  if (hasPaymentClause && !hasInterestClause) {
    return {
      triggered: true,
      flag: {
        ruleId: "MSMED_INTEREST",
        act: "MSMED Act 2006",
        section: "§16",
        citation: "MSMED Act 2006, Section 16",
        risk: "Medium",
        reasoning: "Payment clause does not mention compound interest for delayed payments. MSMD Act §16 mandates interest at 3× RBI Bank Rate — silence on interest does not extinguish the obligation.",
        counterClause: `In the event of delayed payment beyond 45 days, interest shall accrue at three times the bank rate notified by the Reserve Bank of India, compounded monthly, as per Section 16, MSMED Act, 2006.`,
      },
    };
  }
  return { triggered: false };
}

// Indian Contract Act 1872 -- §27 Non-Compete
function checkNonCompete(text: string): RuleResult {
  if (matchNonCompete(text)) {
    return {
      triggered: true,
      flag: {
        ruleId: "ICA_NONCOMPETE",
        act: "Indian Contract Act, 1872",
        section: "§27",
        citation: "Percept D'Mark (India) Pvt. Ltd. v. Zaheer Khan & Anr. (2006) 4 SCC 227",
        risk: "High",
        reasoning: "Post-termination restraint of trade is void under Section 27 of the Indian Contract Act, 1872. The Supreme Court in Percept D'Mark v. Zaheer Khan (2006) 4 SCC 227 held that post-termination non-compete covenants are void and unenforceable regardless of their scope.",
        counterClause: `Any restriction on the parties' right to engage in their respective trades or professions after termination of this Agreement shall be without legal effect and unenforceable, being void under Section 27 of the Indian Contract Act, 1872.`,
      },
    };
  }
  return { triggered: false };
}

// Indian Contract Act 1872 -- §74 Liquidated Damages
function checkLiquidatedDamages(text: string): RuleResult {
  if (matchLiquidatedDamages(text)) {
    return {
      triggered: true,
      flag: {
        ruleId: "ICA_PENALTY",
        act: "Indian Contract Act, 1872",
        section: "§74",
        citation: "Kailash Nath Associates v. DDA, (2015) 4 SCC 136",
        risk: "High",
        reasoning: "Forfeiture of 100% deposit or liquidated damages without proof of actual loss is an unenforceable penalty under Section 74 ICA. The Supreme Court in Kailash Nath Associates v. DDA (2015) held that the party claiming LD must still prove actual loss sustained.",
        counterClause: `Any liquidated damages or forfeiture shall be limited to reasonable compensation for actual loss or damage suffered, not exceeding the amount stipulated, subject to proof of actual damage as required by Section 74 of the Indian Contract Act, 1872.`,
      },
    };
  }
  return { triggered: false };
}

// Arbitration & Conciliation Act 1996 -- Unilateral Arbitrator
function checkArbitratorBias(text: string): RuleResult {
  if (matchArbitratorBias(text)) {
    return {
      triggered: true,
      flag: {
        ruleId: "ACA_ARBITRATOR",
        act: "Arbitration & Conciliation Act, 1996",
        section: "§12(5)",
        citation: "Perkins Eastman Architects DPC v. HSCC (India) Ltd., (2020) 20 SCC 760",
        risk: "High",
        reasoning: "Unilateral appointment of a sole arbitrator by one party violates Section 12(5) of the Arbitration & Conciliation Act. The Supreme Court in Perkins Eastman (2020) held that a party with financial interest in the outcome cannot appoint the sole arbitrator.",
        counterClause: `Any dispute shall be referred to arbitration before a sole arbitrator to be mutually appointed by both parties in writing within 30 days of the dispute arising. Failing mutual agreement, either party may approach the appropriate court for appointment under Section 11 of the Arbitration & Conciliation Act, 1996.`,
      },
    };
  }
  return { triggered: false };
}

// Arbitration & Conciliation Act 1996 -- Foreign Seat
function checkForeignSeat(text: string): RuleResult {
  if (matchForeignSeat(text)) {
    return {
      triggered: true,
      flag: {
        ruleId: "ACA_SEAT",
        act: "Arbitration & Conciliation Act, 1996",
        section: "§2(1)(e)",
        citation: "Arbitration & Conciliation Act, 1996",
        risk: "High",
        reasoning: "A foreign seat of arbitration makes this an International Commercial Arbitration, removing the dispute from Indian MSME Samadhaan jurisdiction and significantly increasing litigation costs for the MSME party.",
        counterClause: `The seat and venue of arbitration shall be [City, India], and the arbitration shall be conducted in accordance with the Arbitration & Conciliation Act, 1996. The language of arbitration shall be English.`,
      },
    };
  }
  return { triggered: false };
}

// Indemnity Asymmetry
function checkIndemnityAsymmetry(text: string): RuleResult {
  if (matchIndemnityAsymmetry(text)) {
    return {
      triggered: true,
      flag: {
        ruleId: "INDEMNITY_ASYM",
        act: "General Contract Law",
        section: "—",
        citation: "General contract law principles",
        risk: "High",
        reasoning: "One-sided indemnity clause requiring the vendor/supplier to indemnify regardless of fault, or uncapped indemnity paired with a liability cap only on the buyer's side, creates severe financial exposure for the MSME party.",
        counterClause: `Each party shall indemnify the other only for losses directly caused by that party's own negligence, willful misconduct, or material breach of this Agreement. The aggregate liability of either party shall not exceed the total fees paid in the 12 months preceding the claim.`,
      },
    };
  }
  return { triggered: false };
}

const RULES = [
  checkMSMEDPayment, checkMSMEDInterest, checkNonCompete,
  checkLiquidatedDamages, checkArbitratorBias, checkForeignSeat, checkIndemnityAsymmetry,
];

export function evaluateStatutoryRules(clauseText: string): { risk: RiskLevel; flags: StatutoryFlag[] } {
  const flags: StatutoryFlag[] = [];
  for (const rule of RULES) {
    const result = rule(clauseText);
    if (result.triggered && result.flag) flags.push(result.flag);
  }
  if (flags.length === 0) return { risk: "Unclassified", flags: [] };
  const hasHigh = flags.some((f) => f.risk === "High");
  const hasMedium = flags.some((f) => f.risk === "Medium");
  return { risk: hasHigh ? "High" : hasMedium ? "Medium" : "Low", flags };
}
