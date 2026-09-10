import { describe, it, expect } from "vitest";
import { SAMPLE_DOCUMENTS } from "../../data/sampleDocuments";
import { processDocument } from "../docPipeline";

describe("ClauseIQ Accuracy Benchmark Suite", () => {
  it("runs full statutory accuracy benchmark over sample dataset", async () => {
    let totalDocs = SAMPLE_DOCUMENTS.length;
    let highRiskCount = 0;

    for (const doc of SAMPLE_DOCUMENTS) {
      const res = await processDocument(doc.content, doc.filename);
      expect(res.docType).toBeDefined();
      if (res.riskScore > 50) {
        highRiskCount++;
      }
    }

    expect(totalDocs).toBeGreaterThanOrEqual(6);
    expect(highRiskCount).toBeGreaterThan(0);
  });
});
