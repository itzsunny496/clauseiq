import type { AnalysisResult, Language, RiskLevel } from "../types";
import { effectiveValue } from "../engine/humanReview";

function riskEmoji(r: RiskLevel) { return r === "High" ? "🔴" : r === "Medium" ? "🟡" : r === "Low" ? "🟢" : "⚪"; }

export function summarizeEN(result: AnalysisResult): string {
  if (result.docType === "invoice") {
    const fields = result.invoiceFields ?? [];
    const get = (key: string) => effectiveValue(fields.find((f) => f.key === key)?.value ?? { id: "", value: "N/A", aiConfidence: 0, status: "pending", source: "invoice-extractor" });
    const msmedField = fields.find((f) => f.key === "msmedFlag");
    const msmedStatus = msmedField ? effectiveValue(msmedField.value) : "Status unknown";
    return [
      `📄 Invoice Summary`,
      `Vendor: ${get("vendor")} | Invoice No.: ${get("invoiceNo")} | Date: ${get("invoiceDate")}`,
      `Due Date: ${get("dueDate")} | Total: ${get("totalPayable")} | GST: ${get("gstAmount")}`,
      `MSMED Status: ${msmedStatus}`,
      ``,
      `Review ${fields.length} extracted fields above. Accept, edit, or reject each AI-extracted value.`,
    ].join("\n");
  }

  if (result.docType === "contract") {
    const clauses = result.clauses ?? [];
    const highRisk = clauses.filter((c) => effectiveValue(c.risk) === "High");
    const medRisk = clauses.filter((c) => effectiveValue(c.risk) === "Medium");
    const allFlags = clauses.flatMap((c) => c.flags);
    const events = result.complianceEvents ?? [];

    const lines = [
      `📋 Contract Summary — ${clauses.length} clause(s) analysed`,
      ``,
      `Risk Overview: 🔴 ${highRisk.length} High  🟡 ${medRisk.length} Medium  `,
    ];

    if (allFlags.length > 0) {
      lines.push(`\nStatutory Issues Identified:`);
      for (const flag of allFlags.slice(0, 5)) {
        lines.push(`  ${riskEmoji(flag.risk)} ${flag.act} ${flag.section}: ${flag.reasoning.slice(0, 120)}…`);
      }
    } else {
      lines.push(`\n✅ No statutory violations detected. Contract appears compliant — review clause classifications to confirm.`);
    }

    if (events.length > 0) {
      lines.push(`\nCompliance Calendar: ${events.length} date(s) extracted`);
      for (const ev of events.slice(0, 3)) {
        const d = new Date(ev.date).toLocaleDateString("en-IN");
        lines.push(`  📅 ${ev.eventType}: ${d} (${ev.daysFromToday > 0 ? ev.daysFromToday + " days away" : "OVERDUE"})`);
      }
    }

    if (highRisk.length > 0) {
      lines.push(`\n⚠ Recommend independent legal review before signing.`);
    }

    return lines.join("\n");
  }

  const doc = result.generalDoc;
  return `📄 General Document — ${doc?.wordCount ?? 0} words\n${doc?.summary ?? ""}`;
}

export function summarizeHI(result: AnalysisResult): string {
  if (result.docType === "invoice") {
    const fields = result.invoiceFields ?? [];
    const get = (key: string) => effectiveValue(fields.find((f) => f.key === key)?.value ?? { id: "", value: "उपलब्ध नहीं", aiConfidence: 0, status: "pending", source: "invoice-extractor" });
    const msmedField = fields.find((f) => f.key === "msmedFlag");
    const msmed = msmedField ? effectiveValue(msmedField.value) : "";
    const isViolation = msmed.includes("EXCEEDS") || msmed.includes("अधिक");
    return [
      `📄 इनवॉइस सारांश`,
      `विक्रेता: ${get("vendor")} | इनवॉइस नं.: ${get("invoiceNo")} | तारीख: ${get("invoiceDate")}`,
      `देय तारीख: ${get("dueDate")} | कुल देय: ${get("totalPayable")} | GST: ${get("gstAmount")}`,
      isViolation
        ? `⚠ MSMED अधिनियम उल्लंघन: भुगतान अवधि 45 दिन की सीमा से अधिक है। 3× RBI दर से ब्याज लागू होगा।`
        : `✅ MSMED अनुपालक: भुगतान अवधि 45 दिन की सीमा के भीतर है।`,
    ].join("\n");
  }

  if (result.docType === "contract") {
    const clauses = result.clauses ?? [];
    const highRisk = clauses.filter((c) => effectiveValue(c.risk) === "High");
    const allFlags = clauses.flatMap((c) => c.flags);

    const lines = [
      `📋 अनुबंध सारांश — कुल ${clauses.length} खंड`,
      ``,
      `🔴 ${highRisk.length} उच्च जोखिम खंड पाए गए।`,
    ];

    if (allFlags.length > 0) {
      lines.push(`\nकानूनी मुद्दे:`);
      for (const flag of allFlags.slice(0, 4)) {
        const hi: Record<string, string> = {
          "MSMED_PAYMENT": `MSMED अधिनियम §${flag.section}: भुगतान अवधि 45 दिन की कानूनी सीमा से अधिक है।`,
          "ICA_NONCOMPETE": `भारतीय अनुबंध अधिनियम §27: गैर-प्रतिस्पर्धा खंड समाप्ति के बाद अमान्य हो सकता है।`,
          "ICA_PENALTY": `भारतीय अनुबंध अधिनियम §74: बिना वास्तविक नुकसान के जुर्माना अप्रवर्तनीय हो सकता है।`,
          "ACA_ARBITRATOR": `मध्यस्थता अधिनियम §12(5): एकतरफा मध्यस्थ नियुक्ति अवैध है।`,
          "ACA_SEAT": `विदेशी मध्यस्थता स्थल MSME Samadhaan क्षेत्राधिकार को हटाता है।`,
          "INDEMNITY_ASYM": `एकतरफा क्षतिपूर्ति खंड: केवल विक्रेता पर दायित्व असंतुलित है।`,
          "MSMED_INTEREST": `MSMED §16: विलंबित भुगतान पर 3× RBI दर से ब्याज का उल्लेख नहीं।`,
        };
        lines.push(`  ⚠ ${hi[flag.ruleId] ?? flag.reasoning.slice(0, 100)}`);
      }
    } else {
      lines.push(`\n✅ कोई वैधानिक उल्लंघन नहीं पाया गया। अनुबंध अनुपालक प्रतीत होता है।`);
    }

    if (highRisk.length > 0) lines.push(`\n⚠ हस्ताक्षर करने से पहले स्वतंत्र कानूनी समीक्षा की सिफारिश की जाती है।`);
    return lines.join("\n");
  }

  return `📄 सामान्य दस्तावेज़ — ${result.generalDoc?.wordCount ?? 0} शब्द\nकोई विशिष्ट दस्तावेज़ प्रकार नहीं पहचाना गया।`;
}

export function summarize(result: AnalysisResult, lang: Language = "en"): string {
  return lang === "hi" ? summarizeHI(result) : summarizeEN(result);
}
