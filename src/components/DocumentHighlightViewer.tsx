import React, { useState, useMemo } from "react";
import type { ClauseResult, StatutoryFlag } from "../types";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Copy,
  Check,
  Search,
  ChevronRight,
  Sparkles,
  FileText,
  Info,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";

interface Props {
  documentText: string;
  clauses: ClauseResult[];
  statutoryViolations?: StatutoryFlag[];
  fileName: string;
  docType: string;
  riskScore: number;
  onSwitchToClauseAudit?: (clauseId?: string) => void;
}

interface ParsedSection {
  id: string;
  index: number;
  rawText: string;
  clause?: ClauseResult;
  isHighRisk: boolean;
  isMediumRisk: boolean;
  isLowRisk: boolean;
  statutoryFlags: StatutoryFlag[];
}

export function DocumentHighlightViewer({
  documentText,
  clauses = [],
  statutoryViolations = [],
  fileName,
  docType,
  riskScore,
  onSwitchToClauseAudit,
}: Props) {
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(
    clauses.find((c) => c.risk.value === "High")?.id || clauses[0]?.id || null
  );
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low" | "statutory">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpandedFull, setIsExpandedFull] = useState(false);

  // Parse document paragraphs into matched sections
  const sections: ParsedSection[] = useMemo(() => {
    if (!documentText) return [];

    // Split document by double newlines or numbered clause patterns
    const rawParagraphs = documentText
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    return rawParagraphs.map((para, idx) => {
      // Find matching extracted clause by similarity / substring inclusion
      const matchedClause = clauses.find((c) => {
        if (!c.text) return false;
        const cleanPara = para.toLowerCase().replace(/\s+/g, " ");
        const cleanClause = c.text.toLowerCase().replace(/\s+/g, " ");
        return (
          cleanPara.includes(cleanClause.slice(0, 40)) ||
          cleanClause.includes(cleanPara.slice(0, 40)) ||
          (c.header && cleanPara.includes(c.header.toLowerCase()))
        );
      });

      const risk = matchedClause?.risk.value || "Unclassified";
      const isHigh = risk === "High";
      const isMed = risk === "Medium";
      const isLow = risk === "Low";
      const flags = matchedClause?.flags || [];

      return {
        id: matchedClause?.id || `section-${idx}`,
        index: idx + 1,
        rawText: para,
        clause: matchedClause,
        isHighRisk: isHigh,
        isMediumRisk: isMed,
        isLowRisk: isLow,
        statutoryFlags: flags,
      };
    });
  }, [documentText, clauses]);

  // Selected Clause for Inspector
  const activeSelectedClause = useMemo(() => {
    if (!selectedClauseId) return null;
    return clauses.find((c) => c.id === selectedClauseId) || null;
  }, [selectedClauseId, clauses]);

  const highRiskCount = clauses.filter((c) => c.risk.value === "High").length;
  const medRiskCount = clauses.filter((c) => c.risk.value === "Medium").length;
  const lowRiskCount = clauses.filter((c) => c.risk.value === "Low").length;
  const statutoryCount = statutoryViolations.length;

  // Filter sections
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      // Search filter
      if (
        searchQuery.trim() &&
        !sec.rawText.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !sec.clause?.header?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Risk category filter
      if (filter === "high") return sec.isHighRisk;
      if (filter === "medium") return sec.isMediumRisk;
      if (filter === "low") return sec.isLowRisk;
      if (filter === "statutory") return sec.statutoryFlags.length > 0;
      return true;
    });
  }, [sections, filter, searchQuery]);

  const handleCopyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="card-glass rounded-xl p-4 border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              riskScore >= 70
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                : riskScore >= 35
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">{fileName}</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {docType}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live In-Document Clause Risk Highlighting &amp; Statutory Violation Inspector
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${
              riskScore >= 70
                ? "bg-rose-950/40 text-rose-300 border-rose-800/60"
                : riskScore >= 35
                ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
            }`}
          >
            {riskScore >= 70 ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : riskScore >= 35 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>Overall Risk: {riskScore}/100</span>
          </div>

          <button
            onClick={() => setIsExpandedFull(!isExpandedFull)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title={isExpandedFull ? "Standard View" : "Full Width View"}
          >
            {isExpandedFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Highlight Filters:</span>
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-slate-700 text-white font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            All Sections ({sections.length})
          </button>
          {highRiskCount > 0 && (
            <button
              onClick={() => setFilter("high")}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                filter === "high"
                  ? "bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/30"
                  : "bg-rose-950/30 text-rose-300 border border-rose-900/40 hover:bg-rose-900/40"
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>High Risk ({highRiskCount})</span>
            </button>
          )}
          {statutoryCount > 0 && (
            <button
              onClick={() => setFilter("statutory")}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                filter === "statutory"
                  ? "bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30"
                  : "bg-purple-950/30 text-purple-300 border border-purple-900/40 hover:bg-purple-900/40"
              }`}
            >
              <Scale className="w-3 h-3" />
              <span>Statutory Flags ({statutoryCount})</span>
            </button>
          )}
          {medRiskCount > 0 && (
            <button
              onClick={() => setFilter("medium")}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                filter === "medium"
                  ? "bg-amber-600 text-white font-bold shadow-lg shadow-amber-600/30"
                  : "bg-amber-950/30 text-amber-300 border border-amber-900/40 hover:bg-amber-900/40"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Medium Risk ({medRiskCount})</span>
            </button>
          )}
          {lowRiskCount > 0 && (
            <button
              onClick={() => setFilter("low")}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                filter === "low"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-emerald-950/30 text-emerald-300 border border-emerald-900/40 hover:bg-emerald-900/40"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Safe / Low ({lowRiskCount})</span>
            </button>
          )}
        </div>

        {/* Search in Document */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search within contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-700/60 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Main Split Layout: Document Viewer (Left) + Risk & Statutory Inspector (Right) */}
      <div
        className={`grid gap-5 items-start ${
          isExpandedFull ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"
        }`}
      >
        {/* Left Column: Interactive Highlighted Contract */}
        <div
          className={`${
            isExpandedFull ? "col-span-1" : "lg:col-span-7"
          } space-y-3 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar`}
        >
          {filteredSections.length === 0 ? (
            <div className="card-glass rounded-xl p-8 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm font-semibold">No sections match your active filters.</p>
              <button
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs text-amber-400 underline hover:text-amber-300"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const isSelected = sec.clause && sec.clause.id === selectedClauseId;
              const hasStatutory = sec.statutoryFlags.length > 0;

              return (
                <div
                  key={sec.id}
                  onClick={() => {
                    if (sec.clause) {
                      setSelectedClauseId(sec.clause.id);
                    }
                  }}
                  className={`relative rounded-xl p-4 transition-all duration-200 cursor-pointer border ${
                    sec.isHighRisk
                      ? isSelected
                        ? "bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/60 ring-1 ring-rose-500"
                        : "bg-rose-950/20 border-rose-700/50 hover:border-rose-500/80 hover:bg-rose-950/30"
                      : sec.isMediumRisk
                      ? isSelected
                        ? "bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/60 ring-1 ring-amber-500"
                        : "bg-amber-950/20 border-amber-700/50 hover:border-amber-500/80 hover:bg-amber-950/30"
                      : sec.isLowRisk
                      ? isSelected
                        ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-500"
                        : "bg-emerald-950/15 border-emerald-800/40 hover:border-emerald-600/60"
                      : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {/* Clause Header & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
                        #{sec.index}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100">
                        {sec.clause?.header || "General Agreement Terms"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sec.isHighRisk && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          🔴 High Risk
                        </span>
                      )}
                      {sec.isMediumRisk && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          🟡 Medium Risk
                        </span>
                      )}
                      {sec.isLowRisk && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          🟢 Compliant
                        </span>
                      )}
                      {hasStatutory && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-purple-400" />
                          Statutory Flag
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Paragraph Body with subtle highlighting */}
                  <p
                    className={`text-xs leading-relaxed font-serif whitespace-pre-wrap ${
                      sec.isHighRisk
                        ? "text-rose-100 font-medium"
                        : sec.isMediumRisk
                        ? "text-amber-100"
                        : "text-slate-300"
                    }`}
                  >
                    {sec.rawText}
                  </p>

                  {/* Statutory Flag Preview Strip if present */}
                  {sec.statutoryFlags.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-rose-900/30 flex flex-wrap items-center gap-2">
                      {sec.statutoryFlags.map((flag, fi) => (
                        <span
                          key={fi}
                          className="text-[11px] font-sans px-2 py-0.5 rounded bg-rose-900/40 text-rose-200 border border-rose-700/50 flex items-center gap-1 font-semibold"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>
                            {flag.act.split(",")[0]} — {flag.section}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive hint on hover/select */}
                  {sec.clause && (
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-[10px] text-slate-500 italic">
                        {isSelected ? "● Currently inspecting" : "Click to inspect statutory remedy"}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? "rotate-90 text-amber-400" : "text-slate-500"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Clause Risk & Indian Law Statutory Inspector */}
        {!isExpandedFull && (
          <div className="lg:col-span-5 sticky top-4 space-y-4">
            {activeSelectedClause ? (
              <div className="card-glass rounded-xl p-5 border border-slate-700 bg-slate-900/90 shadow-2xl space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {activeSelectedClause.categories[0]?.replace("_", " ") || "CLAUSE"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          activeSelectedClause.risk.value === "High"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : activeSelectedClause.risk.value === "Medium"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {activeSelectedClause.risk.value} Risk
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mt-1.5">
                      {activeSelectedClause.header}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopyText(activeSelectedClause.text, activeSelectedClause.id)}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Copy Clause Text"
                  >
                    {copiedId === activeSelectedClause.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Selected Clause Text Quote */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 font-serif leading-relaxed italic">
                  "{activeSelectedClause.text}"
                </div>

                {/* Statutory Violations & Legal Analysis */}
                {activeSelectedClause.flags.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-rose-400" />
                      Statutory Law Infringements
                    </h4>

                    {activeSelectedClause.flags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-rose-200">
                              {flag.act} — {flag.section}
                            </p>
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              {flag.citation}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                            {flag.risk}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-rose-900/30">
                          <p className="font-semibold text-rose-300 text-[11px] mb-1">
                            Why this is risky for your business:
                          </p>
                          {flag.reasoning}
                        </div>

                        {/* Recommended MSME Counter Clause */}
                        {flag.counterClause && (
                          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                Recommended MSME Counter-Clause
                              </span>
                              <button
                                onClick={() =>
                                  handleCopyText(flag.counterClause || "", `counter-${idx}`)
                                }
                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition"
                              >
                                {copiedId === `counter-${idx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy Clause
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-emerald-100 font-serif leading-relaxed bg-slate-950/50 p-2 rounded border border-emerald-900/30">
                              "{flag.counterClause}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Compliant with Indian Commercial Law</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      No statutory infractions detected under MSMED Act 2006, Indian Contract Act
                      1872, or Arbitration &amp; Conciliation Act 1996 for this clause.
                    </p>
                  </div>
                )}

                {/* Footer Action */}
                {onSwitchToClauseAudit && (
                  <div className="pt-2 border-t border-white/10 flex justify-end">
                    <button
                      onClick={() => onSwitchToClauseAudit(activeSelectedClause.id)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                    >
                      <span>Open in Full Clause Audit Panel</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card-glass rounded-xl p-6 text-center text-slate-400 border border-slate-800 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-500" />
                <h4 className="text-sm font-bold text-slate-200">No Clause Selected</h4>
                <p className="text-xs">
                  Click on any highlighted clause on the left to inspect statutory violations and view
                  pre-drafted MSME counter-clauses.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
