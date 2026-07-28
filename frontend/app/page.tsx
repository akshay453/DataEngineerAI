"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import CodeGeneratorWindow from "@/components/CodeGeneratorWindow";
import CSVQAWindow from "@/components/CSVQAWindow";
import PDFQAWindow from "@/components/PDFQAWindow";

type Mode = "chat" | "code" | "csv" | "pdf";

const icons: Record<Mode, JSX.Element> = {
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  csv: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

const tabs: { id: Mode; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "code", label: "Code Generator" },
  { id: "csv", label: "CSV Q&A" },
  { id: "pdf", label: "PDF Q&A" },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("chat");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            DataEngineer AI
          </h1>
        </div>
        <p className="text-slate-500 text-sm mb-6 ml-12">
          Chat, generate code, and ask questions about your data — powered
          by a locally-hosted model.
        </p>

        <div className="flex gap-1.5 mb-6 p-1 bg-slate-900/60 border border-slate-800 rounded-xl w-fit flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === tab.id
                   ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {icons[tab.id]}
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "chat" && <ChatWindow />}
        {mode === "code" && <CodeGeneratorWindow />}
        {mode === "csv" && <CSVQAWindow />}
        {mode === "pdf" && <PDFQAWindow />}
      </div>
    </main>
  );
}