import React from "react";
import { ComplianceDate } from "../types";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface ComplianceCalendarProps {
  dates: ComplianceDate[];
}

export const ComplianceCalendar: React.FC<ComplianceCalendarProps> = ({ dates }) => {
  if (!dates || dates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="font-semibold text-slate-300">No critical deadlines detected</p>
        <p className="text-xs text-slate-500 mt-1">No payment, renewal, or notice dates were found in this document.</p>
      </div>
    );
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Critical (MSMED Penalty)
          </span>
        );
      case "warning":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Important
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Standard Date
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Compliance & Statutory Timeline
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Extracted contractual dates cross-checked against Indian MSMED Act Section 15 (45-day payment limit).
          </p>
        </div>
        <span className="text-xs px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 font-mono">
          {dates.length} Key Milestones
        </span>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
        {dates.map((item, idx) => (
          <div key={idx} className="relative pl-6">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-slate-900 ${
                item.urgency === "critical"
                  ? "border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20"
                  : item.urgency === "warning"
                  ? "border-amber-500 text-amber-400"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {item.urgency === "critical" ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>

            {/* Event Box */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-100 font-mono">{item.date}</span>
                  <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                    {item.type}
                  </span>
                </div>
                {getUrgencyBadge(item.urgency)}
              </div>

              <p className="text-sm text-slate-300 font-medium">{item.label}</p>
              <p className="text-xs text-slate-400 mt-1 italic">"{item.snippet}"</p>

              {item.actionableAdvice && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-200">MSME Action Rule: </span>
                    {item.actionableAdvice}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
