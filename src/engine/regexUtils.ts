// ============================================================
// ClauseIQ - Regex Utilities (v3.4)
// ============================================================

const SPELLED_NUMBERS: Record<string, number> = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,
  eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,
  seventy:70,eighty:80,ninety:90,"one hundred":100,"one hundred twenty":120,
  "one hundred eighty":180,"two hundred":200,
};

export function extractDays(text: string): number | null {
  // Digit inside parens or standalone: "90 days", "(90) days", "(90) calendar days", "90-day"
  const digitMatch = text.match(/(?:\(?(\d+)\)?)\s*(?:calendar\s+|business\s+|consecutive\s+)?days?/i);
  if (digitMatch && digitMatch[1]) {
    return parseInt(digitMatch[1], 10);
  }

  // Digits anywhere before days: "ninety (90) calendar days"
  const parensDigit = text.match(/\((\d+)\).{0,30}\bdays?/i);
  if (parensDigit) {
    return parseInt(parensDigit[1], 10);
  }

  // Fully spelled: "ninety days", "forty-five days"
  const lower = text.toLowerCase();
  for (const [phrase, value] of Object.entries(SPELLED_NUMBERS)) {
    const re = new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b.{0,30}\\bdays?`, "i");
    if (re.test(lower)) return value;
  }

  return null;
}

export function matchArbitratorBias(text: string): boolean {
  return /appoint\w*\s+(?:solely\s+|unilaterally\s+|in\s+the\s+sole\s+(?:discretion|opinion)\s+of\s+)?by\s+(?:the\s+)?(?:company|buyer|client|employer|managing\s+director|md|chairman)/i.test(text)
    || /sole\s+arbitrator\s+(?:shall\s+be\s+)?appointed\s+by\s+(?:the\s+)?(?:company|buyer|client)/i.test(text)
    || /arbitrator.*\bsolely\b.*\b(?:company|buyer|client|employer)\b/i.test(text);
}

export function matchNonCompete(text: string): boolean {
  return /(?:shall\s+not|must\s+not|agrees?\s+not\s+to)\s+(?:engage|participate|work|provide\s+services?|carry\s+on|be\s+(?:employed|involved))\s+(?:in|with|for)?\s*(?:any\s+)?(?:competing|similar|rival)\s*(?:business|activity|enterprise|work)/i.test(text)
    || /(?:non[-\s]compete|restraint\s+of\s+trade|restriction\s+on\s+(?:working|employment))\b.*(?:post[-\s]termination|after\s+(?:the\s+)?termination|following\s+(?:the\s+)?(?:expiry|expiration))/i.test(text)
    || /(?:post[-\s]termination|after\s+termination).{0,120}(?:not\s+to\s+(?:work|engage|compete)|non[-\s]compete)/i.test(text);
}

export function matchLiquidatedDamages(text: string): boolean {
  return /forfeit\s+\d+\s*%\s+of\s+(?:the\s+)?(?:deposit|security|earnest|advance)/i.test(text)
    || /(?:liquidated\s+damages?|penalty)\s+(?:of|at)\s+[\d,.]+\s*(?:per\s+(?:day|week)|%)/i.test(text)
    || /without\s+(?:proof\s+of|establishing|showing)\s+(?:actual\s+)?(?:loss|damage|harm)/i.test(text);
}

export function matchForeignSeat(text: string): boolean {
  return /(?:seat|place|venue)\s+of\s+arbitration\s+(?:shall\s+be|is)\s+(?!india|mumbai|delhi|bangalore|chennai|hyderabad|kolkata|pune|ahmedabad)[a-z]+/i.test(text)
    || /\b(?:london|singapore|dubai|hong\s*kong|paris|new\s+york)\b.*\barbitrat/i.test(text)
    || /arbitrat.*\b(?:london|singapore|dubai|hong\s*kong|paris|new\s+york)\b/i.test(text);
}

export function matchIndemnityAsymmetry(text: string): boolean {
  return /(?:vendor|supplier|contractor|service\s+provider)\s+(?:shall|must|agrees?\s+to)\s+indemnify.*regardless\s+of\s+(?:fault|negligence|cause)/i.test(text)
    || /indemnif.*regardless\s+of\s+(?:fault|negligence)/i.test(text)
    || /uncapped\s+(?:liability|indemnity)|indemnity\s+(?:with\s+)?no\s+(?:cap|limit)/i.test(text);
}

export function matchAutoRenewal(text: string): boolean {
  return /auto(?:matically)?[-\s]renew|automatic\s+(?:renewal|extension|rollover)/i.test(text)
    || /shall\s+(?:automatically\s+)?(?:renew|extend|continue|roll\s+over).*unless.*(?:notice|notif)/i.test(text)
    || /evergreen\s+(?:clause|provision|term)/i.test(text)
    || /(?:notice|notif).*(?:termination|non[-\s]renewal).*(?:\d+\s*days|days?\s+prior)/i.test(text);
}
