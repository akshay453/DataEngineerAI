"use client";

import { useState } from "react";
import { uploadRAGDocument, askRAG, RAGUpload } from "@/lib/api";

type QA = {
  question: string;
  answer: string;
  sources: string[];
};

export default function RAGWindow() {
  const [doc, setDoc] = useState<RAGUpload | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");
  const [expandedSources, setExpandedSources] = useState<number | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setDoc(null);
    setHistory([]);

    try {
      const result = await uploadRAGDocument(file);
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
      const result = await askRAG(q, doc.document_id);
      setHistory((prev) => [
        ...prev,
        { question: q, answer: result.answer, sources: result.sources },
      ]);
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
    <div className="flex flex-col max-w-2xl border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 space-y-4">
        {!doc && (
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Upload a document (PDF or TXT)
            </label>
            <p className="text-slate-600 text-xs mb-2">
              Uses real retrieval-augmented generation: the document is
              split into chunks, embedded, and only the most relevant
              chunks are used to answer each question — so longer
              documents work better here than in plain PDF Q&A.
            </p>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:text-sm hover:file:bg-amber-500 file:cursor-pointer"
            />
            {uploading && (
              <p className="text-slate-500 text-sm mt-2">
                Chunking and embedding… this can take a bit on the first
                upload.
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
              <div className="flex items-center justify-between mb-1">
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
              <p className="text-slate-500">{doc.chunk_count} chunks indexed</p>
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
                      <button
                        onClick={() =>
                          setExpandedSources(expandedSources === i ? null : i)
                        }
                        className="block text-xs text-amber-400 hover:text-amber-300 mt-2"
                      >
                        {expandedSources === i ? "Hide sources" : "Show sources used"}
                      </button>
                      {expandedSources === i && (
                        <div className="mt-2 space-y-2">
                          {qa.sources.map((s, si) => (
                            <div
                              key={si}
                              className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-400"
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {asking && (
                <div className="text-slate-500 text-sm">
                  Retrieving relevant sections and thinking…
                </div>
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