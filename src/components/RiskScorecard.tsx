import React, { useState } from "react";
import type { AnalysisResult, RiskLevel, Language } from "../types";
import { effectiveValue, computeStats } from "../engine/humanReview";
import { t } from "../i18n";

interface Props { result: AnalysisResult; lang: Language }

const RISK_COLORS: Record<RiskLevel | "Unclassified", string> = {
  High: "text-red-400", Medium: "text-amber-400", Low: "text-green-400", Unclassified: "text-gray-400",
};

export function RiskScorecard({ result, lang }: Props) {
  const [view, setView] = useState<"ai" | "human">("ai");
  const clauses = result.clauses ?? [];
  const allItems = clauses.map((c) => c.risk);
  const stats = computeStats(allItems);

  const counts = (useHuman: boolean) => {
    const items = useHuman ? allItems.filter((i) => i.status !== "pending") : allItems;
    const vals = items.map((i) => useHuman ? effectiveValue(i) : i.value);
    return {
      High: vals.filter((v) => v === "High").length,
      Medium: vals.filter((v) => v === "Medium").length,
      Low: vals.filter((v) => v === "Low").length,
      Unclassified: vals.filter((v) => v === "Unclassified").length,
    };
  };

  const c = counts(view === "human");
  const total = clauses.length || 1;
  const score = Math.max(0, Math.round(100 - (c.High * 25 + c.Medium * 10) / total));

  const scoreColor = score >= 75 ? "text-green-400" : score >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="card-glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white text-sm">Risk Scorecard</h2>
        <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
          <button onClick={() => setView("ai")} className={`px-3 py-1 transition-colors ${view === "ai" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>AI</button>
          <button onClick={() => setView("human")} className={`px-3 py-1 transition-colors ${view === "human" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>Human</button>
        </div>
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-6">
        <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{score}<span className="text-2xl text-gray-500">/100</span></div>
        <div className="space-y-1.5 flex-1">
          {(["High","Medium","Low","Unclassified"] as const).map((r) => (
            <div key={r} className="flex items-center gap-2 text-xs">
              <span className={`w-16 ${RISK_COLORS[r]}`}>{r}</span>
              <div className="flex-1 bg-white/5 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${r==="High"?"bg-red-500":r==="Medium"?"bg-amber-500":r==="Low"?"bg-green-500":"bg-gray-500"}`} style={{ width: `${Math.round((c[r] / total) * 100)}%` }} />
              </div>
              <span className="text-gray-400 w-4 text-right">{c[r]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{clauses.length}</p>
          <p className="text-xs text-gray-500">Clauses</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending Review</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-indigo-400">{stats.correctionRate}%</p>
          <p className="text-xs text-gray-500">{t("CORRECTION_RATE", lang)}</p>
        </div>
      </div>

      {stats.total > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Reviewer corrected {stats.edited + stats.rejected} of {stats.total} AI classifications ({stats.correctionRate}%)
        </p>
      )}

      {/* OCR info */}
      {result.ocr.method === "tesseract" && (
        <div className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
          🔍 OCR used (Tesseract) — confidence {result.ocr.confidence.toFixed(0)}%
          {result.ocr.confidence < 70 && " — Low confidence, verify extracted text"}
        </div>
      )}
    </div>
  );
}
