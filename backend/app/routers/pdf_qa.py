import io

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader

from app.ollama_client import call_ollama

router = APIRouter()

MAX_TEXT_CHARS = 8000


class PDFUploadResponse(BaseModel):
    filename: str
    page_count: int
    text: str
    truncated: bool


class PDFAskRequest(BaseModel):
    question: str
    text: str
    filename: str


class PDFAskResponse(BaseModel):
    answer: str


@router.post("/upload", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a .pdf file")

    contents = await file.read()
    try:
        reader = PdfReader(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Couldn't read PDF: {e}")

    pages_text = []
    for page in reader.pages:
        extracted = page.extract_text() or ""
        pages_text.append(extracted)

    full_text = "\n\n".join(pages_text).strip()

    if not full_text:
        raise HTTPException(
            status_code=400,
            detail=(
                "Couldn't extract any text from this PDF. It may be a "
                "scanned image without a text layer."
            ),
        )

    truncated = len(full_text) > MAX_TEXT_CHARS
    text = full_text[:MAX_TEXT_CHARS]

    return PDFUploadResponse(
        filename=file.filename,
        page_count=len(reader.pages),
        text=text,
        truncated=truncated,
    )


def build_prompt(request: PDFAskRequest) -> str:
    return (
        "You are a document assistant. Answer the user's question using "
        "ONLY the document content below. If the answer isn't in the "
        "provided content, say so honestly rather than guessing.\n\n"
        f"Document: {request.filename}\n\n"
        f"Content:\n{request.text}\n\n"
        f"Question: {request.question.strip()}\n\n"
        "Answer:"
    )


@router.post("/ask", response_model=PDFAskResponse)
def ask_pdf(request: PDFAskRequest):
    prompt = build_prompt(request)
    answer = call_ollama(prompt)
    return PDFAskResponse(answer=answer.strip())