import React, { useState } from "react";
import type { AnalysisResult, RiskLevel, Language } from "../types";
import { effectiveValue, computeStats } from "../engine/humanReview";
import { t } from "../i18n";
import { exportSingleAuditToJsonFile } from "../storage/indexedDb";
import { Save, HardDrive } from "lucide-react";

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
  const score = clauses.length === 0 ? 100 : Math.max(0, Math.round(100 - (c.High * 25 + c.Medium * 10) / total));

  const scoreColor = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400";
  const scoreLabel =
    clauses.length === 0
      ? "No High-Risk Clauses Detected"
      : score >= 75
      ? "Safe (Low Risk)"
      : score >= 50
      ? "Moderate Risk"
      : "High Risk Detected";

  const reviewedCount = stats.accepted + stats.edited + stats.rejected;

  return (
    <div className="card-glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white text-sm">Contract Safety &amp; Compliance Scorecard</h2>
          <p className="text-[11px] text-slate-400">
            Higher score indicates fewer statutory &amp; liability risks (100 = 100% Safe).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSingleAuditToJsonFile(result)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition font-semibold shadow-sm"
            title="Download and save this contract audit to your device"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save Contract</span>
          </button>
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
            <button onClick={() => setView("ai")} className={`px-3 py-1 transition-colors ${view === "ai" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>AI</button>
            <button onClick={() => setView("human")} className={`px-3 py-1 transition-colors ${view === "human" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>Human</button>
          </div>
        </div>
      </div>

      {/* Score ring & Risk Breakdown */}
      <div className="flex items-center gap-6">
        <div>
          <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
            {score}<span className="text-2xl text-gray-500">/100</span>
          </div>
          <span className={`text-[11px] font-bold block mt-1 ${scoreColor}`}>
            {scoreLabel}
          </span>
        </div>

        <div className="space-y-1.5 flex-1">
          {(["High","Medium","Low","Unclassified"] as const).map((r) => (
            <div key={r} className="flex items-center gap-2 text-xs">
              <span className={`w-16 ${RISK_COLORS[r]}`}>{r}</span>
              <div className="flex-1 bg-white/5 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    r === "High" ? "bg-red-500" : r === "Medium" ? "bg-amber-500" : r === "Low" ? "bg-green-500" : "bg-gray-500"
                  }`}
                  style={{ width: `${clauses.length > 0 ? Math.round((c[r] / total) * 100) : 0}%` }}
                />
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
          <p className="text-xl font-bold text-emerald-400">{reviewedCount}</p>
          <p className="text-xs text-gray-500">Reviewed</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
        <span>Stored privately in your device's IndexedDB</span>
      </div>
    </div>
  );
}
