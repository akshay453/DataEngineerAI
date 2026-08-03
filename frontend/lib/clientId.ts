// Generates (or retrieves) a random ID unique to this browser, stored
// in localStorage. Used to scope saved history to "this browser" on
// the shared public deployment, so different visitors don't see each
// other's saved chats/code/CSVs/PDFs.
//
// This is NOT authentication — it's just browser-local isolation.
// Clearing browser storage loses access to old history, and there's
// no protection if someone deliberately shares/guesses an ID.

const STORAGE_KEY = "dataengineerai_client_id";

export function getClientId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}