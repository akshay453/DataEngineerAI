# DataEngineer AI

An AI assistant for data engineers — chat interface, SQL/PySpark/Airflow
generators, document Q&A, and more. Built as a real (small) product, not a
tutorial throwaway.

## Sprint 1 — What's here

- `frontend/`: Next.js + TypeScript + Tailwind chat UI
- `backend/`: FastAPI backend with a `/api/chat` endpoint (currently an
  echo stub — no AI wired in yet, this sprint is just about proving the
  frontend ↔ backend loop works)
- `ai-server/`, `database/`, `docker/`: placeholders for later sprints

## Running it (both on one machine, to start)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs to see the interactive API docs (FastAPI
generates this automatically — worth exploring).

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit http://localhost:3000 — you should see the chat UI. Type something
and hit Send; you should get back "You said: ..." from the backend. That
confirms the full loop works.

## Splitting across two laptops (once Sprint 1 works locally)

1. On **Laptop 1** (AI server), install Ollama and pull a model:
   ```bash
   ollama pull qwen2.5
   ```
2. Find Laptop 1's local IP (`ip addr` on Linux, `ipconfig` on Windows) —
   e.g. `192.168.1.20`.
3. On **Laptop 2** (dev machine), edit `backend/.env`:
   ```
   AI_SERVER_URL=http://192.168.1.20:11434
   ```
4. Run the frontend + backend on Laptop 2 as above. The backend will call
   out to Laptop 1 for AI responses once we wire that up in Sprint 1.5.

## Roadmap

| Version | Feature |
|---|---|
| v1 | Login, chat page, AI response, chat history |
| v2 | SQL generator |
| v3 | PySpark generator |
| v4 | Airflow DAG generator |
| v5 | CSV upload + Q&A |
| v6 | PDF upload + chat |
| v7 | Connect to Postgres, schema-aware AI |
| v8 | RAG over your own documents |
| v9 | Deploy |

## Conventions

- Feature branches, one PR per feature
- Meaningful commit messages (`feat:`, `fix:`, `chore:` prefixes)
- Backend config lives in `.env` — never hardcode URLs/secrets in code
