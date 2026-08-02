"""
DataEngineer AI — Backend Entry Point

Sprint 1 goal: prove the frontend <-> backend request/response loop works,
with clean structure that later sprints (SQL gen, PySpark gen, RAG, etc.)
will build on top of.
"""

from fastapi import FastAPI 
import time
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import chat, code_generator, csv_qa, health, history, pdf_qa, rag

app = FastAPI(
    title="DataEngineer AI API",
    description="Backend API for the DataEngineer AI assistant",
    version="0.1.0",
)

# Allow the Next.js dev server to call this API.
# In production, replace "*" with your actual frontend origin.
app.add_middleware(
    
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.middleware("http")
async def log_request_timing(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    print(f"⏱  {request.method} {request.url.path} — {duration:.2f}s")
    return response

@app.on_event("startup")
def create_tables():
    # Creates tables if they don't exist yet. Fine for a project at
    # this stage; a real production app would use Alembic migrations
    # instead of auto-creating tables on every startup.
    Base.metadata.create_all(bind=engine)


app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(code_generator.router, prefix="/api/code", tags=["code"])
app.include_router(csv_qa.router, prefix="/api/csv", tags=["csv"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(history.router, prefix="/api/history", tags=["history"])


@app.get("/")
def root():
    return {"message": "DataEngineer AI backend is running"}