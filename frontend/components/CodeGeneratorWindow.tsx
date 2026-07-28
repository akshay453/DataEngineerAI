"use client";

import { useState } from "react";
import { generateCode } from "@/lib/api";

type Language = "sql" | "pyspark" | "airflow";

const PLACEHOLDERS: Record<Language, string> = {
  sql: "e.g. top 10 customers by total order value",
  pyspark: "e.g. filter orders over $100 and group by customer",
  airflow: "e.g. run a daily task that extracts data from an API and loads it into Postgres",
};

export default function CodeGeneratorWindow() {
  const [language, setLanguage] = useState<Language>("sql");
  const [request, setRequest] = useState("");
  const [dbSchema, setDbSchema] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    const text = request.trim();
    if (!text || loading) return;

    setLoading(true);
    setError("");
    setCode("");
    setCopied(false);

    try {
      const result = await generateCode(language, text, dbSchema);
      setCode(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col max-w-2xl mx-auto border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">
            Language
          </label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            <option value="sql">SQL</option>
            <option value="pyspark">PySpark</option>
            <option value="airflow">Airflow DAG</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1 block">
            What do you want the code to do?
          </label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder={PLACEHOLDERS[language]}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1 block">
            Schema{" "}
            <span className="text-slate-600">
              (optional — paste table/column names for accurate code)
            </span>
          </label>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder={
              "e.g.\ncustomers(id, name, signup_date)\norders(id, customer_id, amount, order_date)"
            }
            rows={4}
            value={dbSchema}
            onChange={(e) => setDbSchema(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !request.trim()}
         className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm w-full"
        >
          {loading
            ? "Generating…"
            : `Generate ${language === "sql" ? "SQL" : "PySpark"}`}
        </button>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 text-sm rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        {code && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-slate-400">
                Generated {language === "sql" ? "SQL" : "PySpark"}
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-amber-300 overflow-x-auto whitespace-pre-wrap">
              {code}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}