"use client";

import { useEffect, useState } from "react";
import { sendChatMessage, saveHistory, HistoryDetail } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  initialEntry?: HistoryDetail | null;
  onSaved?: () => void;
};

export default function ChatWindow({ initialEntry, onSaved }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialEntry && initialEntry.session_type === "chat") {
      setMessages(initialEntry.content.messages || []);
    } else {
      setMessages([]);
    }
    setSaved(false);
  }, [initialEntry]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setSaved(false);

    try {
      const reply = await sendChatMessage(text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  async function handleSave() {
    if (messages.length === 0 || saving) return;
    setSaving(true);
    try {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = (firstUserMsg?.content || "Chat").slice(0, 60);
      await saveHistory("chat", title, { messages });
      setSaved(true);
      onSaved?.();
    } catch {
      // best-effort; the button will just stay in its non-saved state
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-[75vh] max-w-2xl border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm">
            Start the conversation below.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[75%] text-sm ${
                m.role === "user"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-500 text-sm">Thinking…</div>}
      </div>

      <div className="border-t border-slate-800 p-3 flex gap-2">
        <input
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {messages.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-slate-400 hover:text-amber-400 border border-slate-700 px-3 rounded-lg text-sm disabled:opacity-50"
            title="Save this conversation"
          >
            {saved ? "Saved" : saving ? "…" : "Save"}
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}