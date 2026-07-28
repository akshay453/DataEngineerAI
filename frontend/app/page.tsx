"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import CodeGeneratorWindow from "@/components/CodeGeneratorWindow";
import CSVQAWindow from "@/components/CSVQAWindow";

type Mode = "chat" | "code" | "csv";

export default function Home() {
  const [mode, setMode] = useState<Mode>("chat");

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4 max-w-2xl mx-auto">
        DataEngineer AI
      </h1>

      <div className="max-w-2xl mx-auto mb-4 flex gap-2">
        <button
          onClick={() => setMode("chat")}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            mode === "chat"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setMode("code")}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            mode === "code"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          Code Generator
        </button>
        <button
          onClick={() => setMode("csv")}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            mode === "csv"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          CSV Q&A
        </button>
      </div>

      {mode === "chat" && <ChatWindow />}
      {mode === "code" && <CodeGeneratorWindow />}
      {mode === "csv" && <CSVQAWindow />}
    </main>
  );
}