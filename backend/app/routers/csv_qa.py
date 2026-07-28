import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.ollama_client import call_ollama

router = APIRouter()

MAX_SAMPLE_ROWS = 5


class CSVSummary(BaseModel):
    columns: list[str]
    dtypes: dict[str, str]
    row_count: int
    sample_rows: list[dict]


class CSVAskRequest(BaseModel):
    question: str
    columns: list[str]
    dtypes: dict[str, str]
    row_count: int
    sample_rows: list[dict]


class CSVAskResponse(BaseModel):
    answer: str


@router.post("/upload", response_model=CSVSummary)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Couldn't parse CSV: {e}")

    sample = df.head(MAX_SAMPLE_ROWS).fillna("").astype(str)

    return CSVSummary(
        columns=list(df.columns),
        dtypes={col: str(dtype) for col, dtype in df.dtypes.items()},
        row_count=len(df),
        sample_rows=sample.to_dict(orient="records"),
    )


def build_prompt(request: CSVAskRequest) -> str:
    columns_desc = "\n".join(
        f"- {col} ({request.dtypes.get(col, 'unknown')})" for col in request.columns
    )
    sample_desc = "\n".join(str(row) for row in request.sample_rows)

    return (
        "You are a data analyst assistant. You are given the structure "
        "and a few sample rows of a CSV file (not the full data). Answer "
        "the user's question based on this information. If the question "
        "requires computing exact totals or statistics over the full "
        "dataset, say so honestly and instead explain what you can infer "
        "from the sample provided.\n\n"
        f"Total rows in file: {request.row_count}\n\n"
        f"Columns:\n{columns_desc}\n\n"
        f"Sample rows:\n{sample_desc}\n\n"
        f"Question: {request.question.strip()}\n\n"
        "Answer:"
    )


@router.post("/ask", response_model=CSVAskResponse)
def ask_csv(request: CSVAskRequest):
    prompt = build_prompt(request)
    answer = call_ollama(prompt)
    return CSVAskResponse(answer=answer.strip())