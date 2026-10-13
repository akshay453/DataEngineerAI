"""
Unified AI client. Supports two providers, switched by the
AI_PROVIDER env var:

  - "ollama" (default, for local development): calls your locally
    hosted Ollama server on Laptop 1.
  - "groq": calls the Groq hosted API. Used for the deployed
    (public internet) version, since a personal laptop can't reliably
    serve as a 24/7 public backend.

Every feature that needs AI generation should call call_ai() instead
of talking to either provider directly, so switching providers never
requires touching router code.
"""

import httpx
from fastapi import HTTPException

from app.config import settings


def call_ai(prompt: str, timeout: float = 90.0) -> str:
    if settings.AI_PROVIDER == "groq":
        return _call_groq(prompt)
    return _call_ollama(prompt, timeout)


def _call_ollama(prompt: str, timeout: float) -> str:
    try:
        response = httpx.post(
            f"{settings.AI_SERVER_URL}/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json()["response"]
    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout):
        raise HTTPException(
            status_code=502,
            detail=(
                f"Couldn't reach the AI server at {settings.AI_SERVER_URL}. "
                "Check that Ollama is running on Laptop 1 and both laptops "
                "are on the same network."
            ),
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI server returned an error: {e.response.text}",
        )


def _call_groq(prompt: str) -> str:
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            json={
               "model": "openai/gpt-oss-20b",
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error: {e.response.text}",
        )
    except (httpx.ConnectError, httpx.ConnectTimeout):
        raise HTTPException(
            status_code=502,
            detail="Couldn't reach the Groq API. Check your internet connection.",
        )


def call_ollama_embedding(text: str) -> list[float]:
    """
    Embeddings are only available via local Ollama in this project —
    Groq doesn't offer an embeddings endpoint. This means the RAG
    feature only works when the backend can reach a local Ollama
    instance (i.e. on your home network), even in the deployed
    version. This is called out clearly in the RAG tab's UI.
    """
    try:
        response = httpx.post(
            f"{settings.AI_SERVER_URL}/api/embeddings",
            json={"model": "nomic-embed-text", "prompt": text},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()["embedding"]
    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout):
        raise HTTPException(
            status_code=502,
            detail=(
                "RAG requires a local Ollama connection for embeddings, "
                "which isn't reachable right now. This feature only works "
                "when the backend can reach a local Ollama instance."
            ),
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Embedding request failed: {e.response.text}. "
                "Make sure you've run 'ollama pull nomic-embed-text'."
            ),
        )


# Backward-compatible alias — existing router code calls call_ollama().
call_ollama = call_ai