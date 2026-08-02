import io
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader

from app import vector_store
from app.ollama_client import call_ollama, call_ollama_embedding

router = APIRouter()

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
TOP_K = 4


def chunk_text(text: str) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return [c.strip() for c in chunks if c.strip()]


class RAGUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int


class RAGAskRequest(BaseModel):
    question: str
    document_id: str


class RAGAskResponse(BaseModel):
    answer: str
    sources: list[str]


@router.post("/upload", response_model=RAGUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400, detail="Please upload a .pdf or .txt file"
        )

    contents = await file.read()

    if file.filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(contents))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Couldn't read PDF: {e}")
    else:
        text = contents.decode("utf-8", errors="ignore")

    text = text.strip()
    if not text:
        raise HTTPException(
            status_code=400, detail="Couldn't extract any text from this file."
        )

    chunks = chunk_text(text)
    document_id = str(uuid.uuid4())

    embeddings = [call_ollama_embedding(chunk) for chunk in chunks]

    vector_store.add(document_id, file.filename, chunks, embeddings)

    return RAGUploadResponse(
        document_id=document_id,
        filename=file.filename,
        chunk_count=len(chunks),
    )


@router.post("/ask", response_model=RAGAskResponse)
def ask_document(request: RAGAskRequest):
    question_embedding = call_ollama_embedding(request.question)

    retrieved_chunks = vector_store.query(
        request.document_id, question_embedding, top_k=TOP_K
    )

    if not retrieved_chunks:
        raise HTTPException(
            status_code=404,
            detail="No content found for this document. Try re-uploading it.",
        )

    context = "\n\n---\n\n".join(retrieved_chunks)
    prompt = (
        "Answer the question using ONLY the context below. If the answer "
        "isn't in the context, say so honestly rather than guessing.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {request.question.strip()}\n\n"
        "Answer:"
    )

    answer = call_ollama(prompt)

    return RAGAskResponse(answer=answer.strip(), sources=retrieved_chunks)