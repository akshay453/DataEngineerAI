// Central place for talking to the backend.
// Keeping this here (instead of scattering fetch() calls in components)
// means when the API shape changes, you only update it in one place.

import { getClientId } from "./clientId";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function sendChatMessage(message: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Chat request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

export async function generateCode(
  language: "sql" | "pyspark" | "airflow",
  request: string,
  dbSchema: string
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/code/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language,
      request,
      db_schema: dbSchema.trim() ? dbSchema : null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Code generation failed: ${res.status}`
    );
  }

  const data = await res.json();
  return data.code;
}

export type CSVSummary = {
  columns: string[];
  dtypes: Record<string, string>;
  row_count: number;
  sample_rows: Record<string, string>[];
};

export async function uploadCSV(file: File): Promise<CSVSummary> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/csv/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `CSV upload failed: ${res.status}`);
  }

  return res.json();
}

export async function askCSV(
  question: string,
  summary: CSVSummary
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/csv/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      columns: summary.columns,
      dtypes: summary.dtypes,
      row_count: summary.row_count,
      sample_rows: summary.sample_rows,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `CSV question failed: ${res.status}`);
  }

  const data = await res.json();
  return data.answer;
}

export type PDFUpload = {
  filename: string;
  page_count: number;
  text: string;
  truncated: boolean;
};

export async function uploadPDF(file: File): Promise<PDFUpload> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `PDF upload failed: ${res.status}`);
  }

  return res.json();
}

export async function askPDF(
  question: string,
  doc: PDFUpload
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/pdf/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      text: doc.text,
      filename: doc.filename,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `PDF question failed: ${res.status}`);
  }

  const data = await res.json();
  return data.answer;
}

export type SessionType = "chat" | "code" | "csv" | "pdf";

export type HistoryListItem = {
  id: number;
  session_type: SessionType;
  title: string;
  created_at: string;
};

export type HistoryDetail = {
  id: number;
  session_type: SessionType;
  title: string;
  content: Record<string, any>;
  created_at: string;
};

function clientIdHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "X-Client-Id": getClientId(), ...(extra || {}) };
}

export async function saveHistory(
  sessionType: SessionType,
  title: string,
  content: Record<string, any>
): Promise<HistoryDetail> {
  const res = await fetch(`${API_BASE_URL}/api/history/`, {
    method: "POST",
    headers: clientIdHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ session_type: sessionType, title, content }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Save failed: ${res.status}`);
  }

  return res.json();
}

export async function listHistory(): Promise<HistoryListItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/history/`, {
    headers: clientIdHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load history: ${res.status}`);
  }
  return res.json();
}

export async function getHistoryDetail(id: number): Promise<HistoryDetail> {
  const res = await fetch(`${API_BASE_URL}/api/history/${id}`, {
    headers: clientIdHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load entry: ${res.status}`);
  }
  return res.json();
}

export async function deleteHistory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/history/${id}`, {
    method: "DELETE",
    headers: clientIdHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete entry: ${res.status}`);
  }
}

export type RAGUpload = {
  document_id: string;
  filename: string;
  chunk_count: number;
};

export async function uploadRAGDocument(file: File): Promise<RAGUpload> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/rag/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Upload failed: ${res.status}`);
  }

  return res.json();
}

export async function askRAG(
  question: string,
  documentId: string
): Promise<{ answer: string; sources: string[] }> {
  const res = await fetch(`${API_BASE_URL}/api/rag/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, document_id: documentId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Question failed: ${res.status}`);
  }

  return res.json();
}