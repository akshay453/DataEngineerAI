"use client";

import { useState } from "react";
import { uploadPDF, askPDF, PDFUpload } from "@/lib/api";

type QA = {
  question: string;
  answer: string;
};

export default function PDFQAWindow() {
  const [doc, setDoc] = useState<PDFUpload | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setDoc(null);
    setHistory([]);

    try {
      const result = await uploadPDF(file);
      setDoc(result);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || !doc || asking) return;

    setAsking(true);
    setAskError("");

    try {
      const answer = await askPDF(q, doc);
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

  return (
    <div className="flex flex-col max-w-2xl mx-auto border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 space-y-4">
        {!doc && (
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Upload a PDF file
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:text-sm hover:file:bg-amber-500 file:cursor-pointer"
            />
            {uploading && (
              <p className="text-slate-500 text-sm mt-2">
                Extracting text…
              </p>
            )}
            {uploadError && (
              <div className="bg-red-950 border border-red-800 text-red-200 text-sm rounded-lg px-3 py-2 mt-2">
                ⚠️ {uploadError}
              </div>
            )}
          </div>
        )}

        {doc && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-medium">
                  📄 {doc.filename}
                </span>
                <button
                  onClick={() => {
                    setDoc(null);
                    setHistory([]);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  Upload different file
                </button>
              </div>
              <p className="text-slate-500">{doc.page_count} pages</p>
              {doc.truncated && (
                <p className="text-amber-400 mt-1">
                  ⚠️ This document is long — only the first portion was
                  used, so answers about later sections may be incomplete.
                </p>
              )}
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
                placeholder="Ask something about this document..."
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