import React, { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import type { ClauseResult, Language } from "../types";
import { effectiveValue, accept, edit, reject } from "../engine/humanReview";
import { ReviewControls } from "./ReviewControls";
import { NerEntityPanel } from "./NerEntityPanel";
import { t } from "../i18n";

const RISK_BADGE: Record<string, string> = {
  High: "bg-red-500/20 text-red-400 border border-red-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Low: "bg-green-500/20 text-green-400 border border-green-500/30",
  Unclassified: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

const CAT_BADGE: Record<string, string> = {
  PAYMENT: "bg-blue-500/15 text-blue-300",
  TERMINATION: "bg-red-500/15 text-red-300",
  AUTO_RENEWAL: "bg-orange-500/15 text-orange-300",
  LIABILITY: "bg-purple-500/15 text-purple-300",
  CONFIDENTIALITY: "bg-teal-500/15 text-teal-300",
  DISPUTE: "bg-indigo-500/15 text-indigo-300",
  OTHER: "bg-gray-500/15 text-gray-400",
};

interface Props {
  clauses: ClauseResult[];
  lang: Language;
  onUpdate: (updated: ClauseResult[]) => void;
  onViewInDocument?: (clauseId: string) => void;
}

export function ClauseAuditList({ clauses, lang, onUpdate }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const updateClause = (index: number, updater: (c: ClauseResult) => ClauseResult) => {
    const updated = clauses.map((c, i) => i === index ? updater(c) : c);
    onUpdate(updated);
  };

  if (clauses.length === 0) return <p className="text-gray-500 text-sm">No clauses extracted. Try uploading a contract document.</p>;

  return (
    <div className="space-y-3">
      {clauses.map((clause, idx) => {
        const risk = effectiveValue(clause.risk);
        const isOpen = expanded.has(clause.id);
        return (
          <div key={clause.id} className="card-glass rounded-xl overflow-hidden animate-fade-in">
            <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors" onClick={() => toggle(clause.id)}>
              <span className="mt-0.5">{isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-white truncate">{clause.header}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_BADGE[risk]}`}>{risk}</span>
                  {clause.risk.status === "pending" && <span className="text-xs text-amber-400 animate-pulse-amber">⏳ {t("PENDING", lang)}</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {clause.categories.map((cat) => (
                    <span key={cat} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CAT_BADGE[cat]}`}>{cat.replace("_"," ")}</span>
                  ))}
                </div>
              </div>
              <ReviewControls
                item={clause.risk}
                onAccept={() => updateClause(idx, (c) => ({ ...c, risk: accept(c.risk) }))}
                onEdit={(v) => updateClause(idx, (c) => ({ ...c, risk: edit(c.risk, v) }))}
                onReject={() => updateClause(idx, (c) => ({ ...c, risk: reject(c.risk) }))}
              />
            </div>

            {isOpen && (
              <div className="border-t border-white/5 p-4 space-y-4 animate-slide-up">
                <p className="text-xs text-gray-300 leading-relaxed">{clause.text}</p>

                {clause.entities.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Named Entities</p>
                    <NerEntityPanel entities={clause.entities} />
                  </div>
                )}

                {clause.flags.map((flag) => (
                  <div key={flag.ruleId} className="bg-red-500/8 border border-red-500/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-red-300">{flag.act} {flag.section}</p>
                        <p className="text-[10px] text-gray-400 italic">{flag.citation}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_BADGE[flag.risk]}`}>{flag.risk}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{flag.reasoning}</p>
                    {flag.counterClause && (
                      <div className="bg-green-500/8 border border-green-500/20 rounded p-2 mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] text-green-400 font-medium">MSME Protective Counter-Clause</p>
                          <button onClick={() => copyText(flag.counterClause!, `cc-${flag.ruleId}`)} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                            {copied === `cc-${flag.ruleId}` ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                          </button>
                        </div>
                        <p className="text-[11px] text-green-300/80 leading-relaxed italic">{flag.counterClause}</p>
                      </div>
                    )}
                  </div>
                ))}

                {clause.complianceEvents?.map((ev) => (
                  <div key={ev.id} className={`text-xs rounded-lg px-3 py-2 border ${ev.urgency === "overdue" ? "bg-red-500/10 border-red-500/20 text-red-300" : ev.urgency === "critical" ? "bg-orange-500/10 border-orange-500/20 text-orange-300" : "bg-blue-500/10 border-blue-500/20 text-blue-300"}`}>
                    📅 {ev.eventType}: {new Date(ev.date).toLocaleDateString("en-IN")} — {ev.daysFromToday > 0 ? `${ev.daysFromToday} days away` : `OVERDUE by ${Math.abs(ev.daysFromToday)} days`}
                  </div>
                ))}

                {onViewInDocument && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewInDocument(clause.id);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition flex items-center gap-1"
                    >
                      <span>Highlight in Document Viewer</span> →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
