"""
Shared helper for calling Ollama on the AI-server laptop.

Every feature that needs AI generation (chat, SQL generator, PySpark
generator, RAG, etc.) should call this instead of duplicating the
httpx call and error handling in each router.
"""

import httpx
from fastapi import HTTPException

from app.config import settings


def call_ollama(prompt: str, timeout: float = 90.0) -> str:
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
        data = response.json()
        return data["response"]
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


def call_ollama_embedding(text: str) -> list[float]:
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
                f"Couldn't reach the AI server at {settings.AI_SERVER_URL}. "
                "Check that Ollama is running on Laptop 1."
            ),
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Embedding request failed: {e.response.text}. "
                "Make sure you've run 'ollama pull nomic-embed-text' on Laptop 1."
            ),
        )