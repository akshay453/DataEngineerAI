import re
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.ollama_client import call_ollama

router = APIRouter()

Language = Literal["sql", "pyspark"]


class CodeGenerateRequest(BaseModel):
    language: Language
    request: str
    db_schema: str | None = None


class CodeGenerateResponse(BaseModel):
    code: str


LANGUAGE_INSTRUCTIONS: dict[Language, str] = {
    "sql": (
        "You are a SQL generator. Output ONLY the SQL query that "
        "satisfies the request. Do not include explanations, comments, "
        "or markdown code fences — just the raw SQL."
    ),
    "pyspark": (
        "You are a PySpark code generator. Output ONLY valid PySpark "
        "code (using the DataFrame API) that satisfies the request. "
        "Assume `spark` is already defined as the active SparkSession, "
        "and that DataFrames are already loaded with variable names "
        "matching the table names in the schema (or reasonable names "
        "if no schema is given). Do not include explanations, comments, "
        "or markdown code fences — just the raw Python code."
    ),
}

FENCE_LANGS = {"sql": "sql", "pyspark": "python"}


def build_prompt(language: Language, user_request: str, schema: str | None) -> str:
    instructions = LANGUAGE_INSTRUCTIONS[language]

    if schema and schema.strip():
        return (
            f"{instructions}\n\n"
            f"Schema:\n{schema.strip()}\n\n"
            f"Request: {user_request.strip()}\n\n"
            "Code:"
        )
    return (
        f"{instructions} Since no schema was provided, use reasonable, "
        "generic table/column names.\n\n"
        f"Request: {user_request.strip()}\n\n"
        "Code:"
    )


def clean_code_output(raw: str, language: Language) -> str:
    text = raw.strip()
    fence_lang = FENCE_LANGS[language]
    text = re.sub(rf"^```{fence_lang}\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^```\w*\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


@router.post("/generate", response_model=CodeGenerateResponse)
def generate_code(request: CodeGenerateRequest):
    prompt = build_prompt(request.language, request.request, request.db_schema)
    raw_output = call_ollama(prompt)
    code = clean_code_output(raw_output, request.language)
    return CodeGenerateResponse(code=code)