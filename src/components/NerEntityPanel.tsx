import React from "react";
import type { NerEntity, EntityType } from "../types";

const CHIP_COLORS: Record<EntityType, string> = {
  ORG:         "bg-blue-500/20 text-blue-300 border-blue-500/30",
  DATE:        "bg-green-500/20 text-green-300 border-green-500/30",
  AMOUNT:      "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  GST_NUMBER:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  CLAUSE_TYPE: "bg-red-500/20 text-red-300 border-red-500/30",
  PERSON:      "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  MISC:        "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const TYPE_LABELS: Record<EntityType, string> = {
  ORG: "ORG", DATE: "DATE", AMOUNT: "AMOUNT",
  GST_NUMBER: "GST", CLAUSE_TYPE: "CLAUSE", PERSON: "PERSON", MISC: "MISC",
};

interface Props { entities: NerEntity[]; loading?: boolean }

export function NerEntityPanel({ entities, loading }: Props) {
  if (loading) return <p className="text-xs text-gray-400 animate-pulse">Loading NER model (first run only)…</p>;
  if (entities.length === 0) return <p className="text-xs text-gray-500">No named entities detected.</p>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {entities.map((e, i) => (
        <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${CHIP_COLORS[e.type]} cursor-default`} title={`Confidence: ${(e.confidence * 100).toFixed(0)}% | Source: ${e.source}`}>
          <span className="font-medium opacity-70 text-[10px]">{TYPE_LABELS[e.type]}</span>
          <span>{e.text}</span>
          <span className="text-[9px] opacity-50 font-mono">{e.source === "ml" ? "🤖" : "re"}</span>
        </span>
      ))}
    </div>
  );
}
