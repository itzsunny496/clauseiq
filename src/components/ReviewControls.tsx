import React, { useState } from "react";
import { Check, X, Pencil, Save } from "lucide-react";
import type { ReviewableItem } from "../types";

interface Props<T> {
  item: ReviewableItem<T>;
  onAccept: () => void;
  onEdit: (val: T) => void;
  onReject: () => void;
  disabled?: boolean;
}

export function ReviewControls<T extends string>({ item, onAccept, onEdit, onReject, disabled }: Props<T>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.correctedValue ?? item.value));

  if (item.status === "accepted") return <span className="text-xs text-green-400 font-medium flex items-center gap-1"><Check size={12} /> Accepted</span>;
  if (item.status === "rejected") return <span className="text-xs text-red-400 font-medium line-through">{String(item.value)}</span>;

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <input
          className="text-xs bg-navy-700 border border-indigo-500 rounded px-2 py-1 text-white flex-1 min-w-0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onEdit(draft as T); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          autoFocus
        />
        <button onClick={() => { onEdit(draft as T); setEditing(false); }} className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"><Save size={12} /></button>
        <button onClick={() => setEditing(false)} className="p-1 rounded bg-navy-600 hover:bg-navy-500 text-gray-300"><X size={12} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {item.status === "pending" && <span className="text-xs text-amber-400 animate-pulse-amber mr-1">⏳</span>}
      <button disabled={disabled} onClick={onAccept} title="Accept" className="p-1 rounded hover:bg-green-500/20 text-green-400 disabled:opacity-40 transition-colors"><Check size={13} /></button>
      <button disabled={disabled} onClick={() => { setDraft(String(item.correctedValue ?? item.value)); setEditing(true); }} title="Edit" className="p-1 rounded hover:bg-indigo-500/20 text-indigo-400 disabled:opacity-40 transition-colors"><Pencil size={13} /></button>
      <button disabled={disabled} onClick={onReject} title="Reject" className="p-1 rounded hover:bg-red-500/20 text-red-400 disabled:opacity-40 transition-colors"><X size={13} /></button>
    </div>
  );
}
