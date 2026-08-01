"use client";

import { useEffect, useState } from "react";
import { listHistory, deleteHistory, HistoryListItem, SessionType } from "@/lib/api";

const TYPE_LABELS: Record<SessionType, string> = {
  chat: "Chat",
  code: "Code",
  csv: "CSV",
  pdf: "PDF",
};

type Props = {
  refreshSignal: number;
  onSelect: (id: number) => void;
  onNew: () => void;
  selectedId: number | null;
};

export default function HistorySidebar({
  refreshSignal,
  onSelect,
  onNew,
  selectedId,
}: Props) {
  const [entries, setEntries] = useState<HistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listHistory()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshSignal]);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    try {
      await deleteHistory(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch {
      // Silently ignore — the list will self-correct on next refresh.
    }
  }

  return (
    <div className="w-56 flex-shrink-0 border-r border-slate-800 h-[calc(100vh-1px)] sticky top-0 flex flex-col">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium py-2 rounded-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {loading && (
          <p className="text-slate-600 text-xs px-2 py-2">Loading…</p>
        )}
        {!loading && entries.length === 0 && (
          <p className="text-slate-600 text-xs px-2 py-2">
            No saved sessions yet.
          </p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onSelect(entry.id)}
            className={`group flex items-start justify-between gap-1 px-2.5 py-2 rounded-lg text-sm cursor-pointer ${
              selectedId === entry.id
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate">{entry.title}</p>
              <p className="text-xs text-slate-600">
                {TYPE_LABELS[entry.session_type]}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, entry.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 flex-shrink-0"
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}