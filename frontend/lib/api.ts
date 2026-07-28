// Central place for talking to the backend.
// Keeping this here (instead of scattering fetch() calls in components)
// means when the API shape changes, you only update it in one place.

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