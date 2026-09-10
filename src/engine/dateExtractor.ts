import type { ComplianceEvent, ComplianceUrgency, ClauseCategory } from "../types";
import { nanoid } from "../utils/nanoid";

function daysFromToday(d: Date): number {
  return Math.round((d.getTime() - Date.now()) / 86400000);
}

function urgency(days: number): ComplianceUrgency {
  if (days < 0) return "overdue";
  if (days < 14) return "critical";
  if (days < 60) return "upcoming";
  return "future";
}

function parseDate(raw: string): Date | null {
  const dmy = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const ymd = raw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  // "15 March 2025"
  const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const spelled = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (spelled) {
    const mi = months.indexOf(spelled[2].toLowerCase());
    if (mi !== -1) return new Date(+spelled[3], mi, +spelled[1]);
  }
  return null;
}

export function extractComplianceEvents(clauseId: string, text: string, category: ClauseCategory): ComplianceEvent[] {
  const events: ComplianceEvent[] = [];

  // Auto-renewal date
  const renewalRe = /(?:auto(?:matically)?[-\s]renew(?:s|ed)?|renewed?\s+automatically)\s+on\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i;
  const renewalM = text.match(renewalRe);
  if (renewalM) {
    const d = parseDate(renewalM[1]);
    if (d) {
      const days = daysFromToday(d);
      events.push({ id: nanoid(), clauseId, clauseCategory: category, eventType: "RENEWAL", date: d, daysFromToday: days, rawText: renewalM[0], urgency: urgency(days) });
    }
  }

  // Notice deadline: "X days notice before [date]"
  const noticeRe = /(\d+)\s*[-–]?\s*(?:calendar\s+)?days[''s]?\s+(?:written\s+|prior\s+)?notice\s+(?:before|prior\s+to)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i;
  const noticeM = text.match(noticeRe);
  if (noticeM) {
    const baseDate = parseDate(noticeM[2]);
    if (baseDate) {
      const deadline = new Date(baseDate.getTime() - +noticeM[1] * 86400000);
      const days = daysFromToday(deadline);
      events.push({ id: nanoid(), clauseId, clauseCategory: category, eventType: "NOTICE_DEADLINE", date: deadline, daysFromToday: days, rawText: noticeM[0], urgency: urgency(days) });
    }
  }

  // Expiry / valid until
  const expiryRe = /(?:valid\s+until|expires?\s+on|expiry\s+date|contract\s+(?:term\s+)?ends?)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i;
  const expiryM = text.match(expiryRe);
  if (expiryM) {
    const d = parseDate(expiryM[1]);
    if (d) {
      const days = daysFromToday(d);
      events.push({ id: nanoid(), clauseId, clauseCategory: category, eventType: "EXPIRY", date: d, daysFromToday: days, rawText: expiryM[0], urgency: urgency(days) });
    }
  }

  return events;
}
