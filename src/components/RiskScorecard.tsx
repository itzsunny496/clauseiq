import React, { useState } from "react";
import type { AnalysisResult, RiskLevel, Language } from "../types";
import { effectiveValue, computeStats } from "../engine/humanReview";
import { t } from "../i18n";
import { exportSingleAuditToJsonFile } from "../storage/indexedDb";
import { Save, HardDrive, AlertTriangle, ShieldAlert, ShieldCheck, Scale } from "lucide-react";

interface Props {
  result: AnalysisResult;
  lang: Language;
}

const RISK_COLORS: Record<RiskLevel | "Unclassified", string> = {
  High: "text-rose-400",
  Medium: "text-amber-400",
  Low: "text-emerald-400",
  Unclassified: "text-slate-400",
};

export function RiskScorecard({ result, lang }: Props) {
  const [view, setView] = useState<"ai" | "human">("ai");
  const clauses = result.clauses ?? [];
  const allItems = clauses.map((c) => c.risk);
  const stats = computeStats(allItems);
  const statutoryViolations = result.statutoryViolations ?? [];

  const counts = (useHuman: boolean) => {
    const items = useHuman ? allItems.filter((i) => i.status !== "pending") : allItems;
    const vals = items.map((i) => (useHuman ? effectiveValue(i) : i.value));
    return {
      High: vals.filter((v) => v === "High").length,
      Medium: vals.filter((v) => v === "Medium").length,
      Low: vals.filter((v) => v === "Low").length,
      Unclassified: vals.filter((v) => v === "Unclassified").length,
    };
  };

  const c = counts(view === "human");
  const total = clauses.length || 1;

  // Unified Risk Score (0 = Safe, 100 = Maximum Risk)
  let score: number;
  if (view === "ai") {
    score = result.riskScore ?? 15;
  } else {
    // Dynamic recalculation for Human Reviewed overrides
    let dynamicScore = 15;
    if (statutoryViolations.length > 0) dynamicScore += statutoryViolations.length * 25;
    dynamicScore += c.High * 25;
    dynamicScore += c.Medium * 10;
    if (c.High === 0 && statutoryViolations.length === 0 && c.Medium === 0) {
      dynamicScore = 12;
    }
    score = Math.min(98, Math.max(10, dynamicScore));
  }

  const isHighRisk = score >= 70;
  const isModerateRisk = score >= 35 && score < 70;
  const isLowRisk = score < 35;

  const scoreColor = isHighRisk
    ? "text-rose-400"
    : isModerateRisk
    ? "text-amber-400"
    : "text-emerald-400";

  const scoreBgBadge = isHighRisk
    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
    : isModerateRisk
    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";

  const scoreLabel = isHighRisk
    ? "High Risk / Statutory Violations"
    : isModerateRisk
    ? "Moderate Contract Risk"
    : "Low Risk (MSME Compliant)";

  const reviewedCount = stats.accepted + stats.edited + stats.rejected;

  return (
    <div className="card-glass rounded-xl p-5 space-y-4 border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-sm tracking-wide">
              Contract Risk &amp; Statutory Compliance Scorecard
            </h2>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${scoreBgBadge}`}
            >
              {scoreLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Standardized Risk Index (0 = 100% Safe, 100 = Severe Statutory Violations).
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
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs bg-slate-900">
            <button
              onClick={() => setView("ai")}
              className={`px-3 py-1 transition-colors font-medium ${
                view === "ai"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              AI Evaluation
            </button>
            <button
              onClick={() => setView("human")}
              className={`px-3 py-1 transition-colors font-medium ${
                view === "human"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Human Adjusted
            </button>
          </div>
        </div>
      </div>

      {/* Score Ring & Risk Breakdown */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-950/40 p-4 rounded-xl border border-white/5">
        <div className="flex flex-col items-center justify-center min-w-[140px] text-center">
          <div className="flex items-center gap-1.5">
            {isHighRisk ? (
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            ) : isModerateRisk ? (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            )}
            <span className={`text-4xl font-black tabular-nums tracking-tight ${scoreColor}`}>
              {score}
            </span>
            <span className="text-xl text-slate-500 font-semibold">/100</span>
          </div>
          <span className={`text-[11px] font-bold block mt-1 ${scoreColor}`}>
            {scoreLabel}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {score >= 70
              ? "Urgent legal revision advised"
              : score >= 35
              ? "Minor clauses require caution"
              : "Clean statutory posture"}
          </span>
        </div>

        <div className="space-y-2 flex-1 w-full">
          {(["High", "Medium", "Low", "Unclassified"] as const).map((r) => {
            const count = c[r];
            const pct = clauses.length > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span className={`w-20 font-medium ${RISK_COLORS[r]}`}>{r} Risk</span>
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      r === "High"
                        ? "bg-gradient-to-r from-rose-500 to-red-600"
                        : r === "Medium"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600"
                        : r === "Low"
                        ? "bg-gradient-to-r from-emerald-500 to-green-600"
                        : "bg-slate-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-slate-400 font-mono w-8 text-right font-medium">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statutory Flags Chips if present */}
      {statutoryViolations.length > 0 && (
        <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
            <Scale className="w-3.5 h-3.5 text-rose-400" />
            <span>Identified Statutory Infringements ({statutoryViolations.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statutoryViolations.map((v, i) => (
              <div
                key={i}
                className="text-[11px] px-2.5 py-1 rounded-md bg-rose-900/40 text-rose-200 border border-rose-700/40 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="font-semibold">{v.act.split(",")[0]}</span>
                <span className="text-rose-300 font-mono">({v.section})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
        <div className="text-center p-2 rounded-lg bg-slate-900/50">
          <p className="text-lg font-bold text-white">{clauses.length}</p>
          <p className="text-[10px] uppercase font-semibold text-slate-400">Total Clauses</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-900/50">
          <p className="text-lg font-bold text-amber-400">{stats.pending}</p>
          <p className="text-[10px] uppercase font-semibold text-slate-400">Pending Review</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-900/50">
          <p className="text-lg font-bold text-emerald-400">{reviewedCount}</p>
          <p className="text-[10px] uppercase font-semibold text-slate-400">Reviewed / Accepted</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Stored privately on-device (IndexedDB)</span>
        </div>
        <span className="text-slate-500 font-mono">Processed in {result.processingTimeMs || 0}ms</span>
      </div>
    </div>
  );
}
