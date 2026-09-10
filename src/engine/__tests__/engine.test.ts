import { describe, it, expect } from "vitest";
import { analyzeContract } from "../contractAnalyzer";
import { extractInvoiceFields } from "../invoiceExtractor";
import { SAMPLE_DOCUMENTS } from "../../data/sampleDocuments";

describe("ClauseIQ Statutory Rule Engine Tests", () => {
  it("should flag MSMED Act Section 15 violation for payment terms > 45 days", () => {
    const contract = SAMPLE_DOCUMENTS.find((d) => d.id === "contract-1")!;
    const clauses = analyzeContract(contract.content);

    const paymentClause = clauses.find((c) => c.categories.includes("PAYMENT"));
    expect(paymentClause).toBeDefined();
    expect(paymentClause?.flags.some((f) => f.ruleId.startsWith("MSMED") || f.act.includes("MSMED"))).toBe(true);
  });

  it("should flag Indian Contract Act 1872 Section 27 for post-termination non-compete", () => {
    const contract = SAMPLE_DOCUMENTS.find((d) => d.id === "contract-2")!;
    const clauses = analyzeContract(contract.content);

    const nonCompeteClause = clauses.find(
      (c) => c.header.toLowerCase().includes("non-compete") || c.text.toLowerCase().includes("competing business")
    );
    expect(nonCompeteClause).toBeDefined();
    expect(nonCompeteClause?.flags.some((f) => f.ruleId === "ICA_NONCOMPETE" || f.citation.includes("Zaheer Khan"))).toBe(true);
  });

  it("should pass compliant SaaS contract with 30-day payment terms without MSMED violation", () => {
    const contract = SAMPLE_DOCUMENTS.find((d) => d.id === "contract-3")!;
    const clauses = analyzeContract(contract.content);

    const paymentClause = clauses.find((c) => c.categories.includes("PAYMENT"));
    expect(paymentClause).toBeDefined();
    expect(paymentClause?.flags.some((f) => f.ruleId === "MSMED_PAYMENT")).toBe(false);
  });

  it("should correctly extract invoice fields and detect MSMED status", () => {
    const invoice = SAMPLE_DOCUMENTS.find((d) => d.id === "invoice-1")!;
    const { fields, msmedViolation } = extractInvoiceFields(invoice.content);

    const invNum = fields.find((f) => f.key === "invoiceNo")?.value.value;
    expect(invNum).toContain("INV-2024-0892");
    expect(msmedViolation).toBe(false);
  });
});
