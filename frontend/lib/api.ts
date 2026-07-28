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
  language: "sql" | "pyspark",
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