"use client";

import { useEffect, useState } from "react";
import { uploadCSV, askCSV, saveHistory, CSVSummary, HistoryDetail } from "@/lib/api";

type QA = {
  question: string;
  answer: string;
};

type Props = {
  initialEntry?: HistoryDetail | null;
  onSaved?: () => void;
};

export default function CSVQAWindow({ initialEntry, onSaved }: Props) {
  const [summary, setSummary] = useState<CSVSummary | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

 useEffect(() => {
    if (initialEntry && initialEntry.session_type === "csv") {
      setSummary(initialEntry.content.summary || null);
      setFileName(initialEntry.content.fileName || "");
      setHistory(initialEntry.content.history || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setSummary(null);
    setHistory([]);
    setSaved(false);

    try {
      const result = await uploadCSV(file);
      setSummary(result);
      setFileName(file.name);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || !summary || asking) return;

    setAsking(true);
    setAskError("");
    setSaved(false);

    try {
      const answer = await askCSV(q, summary);
      setHistory((prev) => [...prev, { question: q, answer }]);
      setQuestion("");
    } catch (err) {
      setAskError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAsking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAsk();
  }

  async function handleSave() {
    if (!summary || saving) return;
    setSaving(true);
    try {
      const title = fileName || "CSV session";
      await saveHistory("csv", title, { fileName, summary, history });
      setSaved(true);
      onSaved?.();
    } catch {
      // best-effort
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col max-w-2xl border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 space-y-4">
        {!summary && (
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Upload a CSV file
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:text-sm hover:file:bg-amber-500 file:cursor-pointer"
            />
            {uploading && (
              <p className="text-slate-500 text-sm mt-2">Parsing…</p>
            )}
            {uploadError && (
              <div className="bg-red-950 border border-red-800 text-red-200 text-sm rounded-lg px-3 py-2 mt-2">
                ⚠️ {uploadError}
              </div>
            )}
          </div>
        )}

        {summary && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-medium">
                  📄 {fileName}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
                  >
                    {saved ? "Saved" : saving ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setSummary(null);
                      setFileName("");
                      setHistory([]);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Upload different file
                  </button>
                </div>
              </div>
              <p className="text-slate-500">
                {summary.row_count} rows · {summary.columns.length} columns
              </p>
              <p className="text-slate-500 mt-1">
                {summary.columns.join(", ")}
              </p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {history.map((qa, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-end">
                    <div className="bg-amber-600 text-white px-3 py-2 rounded-lg max-w-[85%] text-sm">
                      {qa.question}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-100 px-3 py-2 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap">
                      {qa.answer}
                    </div>
                  </div>
                </div>
              ))}
              {asking && (
                <div className="text-slate-500 text-sm">Thinking…</div>
              )}
            </div>

            {askError && (
              <div className="bg-red-950 border border-red-800 text-red-200 text-sm rounded-lg px-3 py-2">
                ⚠️ {askError}
              </div>
            )}

            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Ask something about this data..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleAsk}
                disabled={asking || !question.trim()}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
              >
                Ask
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}