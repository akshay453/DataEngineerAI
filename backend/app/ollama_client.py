"""
Shared helper for calling Ollama on the AI-server laptop.

Every feature that needs AI generation (chat, SQL generator, PySpark
generator, etc.) should call this instead of duplicating the httpx
call and error handling in each router.
"""

import httpx
from fastapi import HTTPException

from app.config import settings


def call_ollama(prompt: str, timeout: float = 90.0) -> str:
    """
    Sends a prompt to Ollama and returns the raw text response.
    Raises a clean HTTPException (with a helpful message) on any
    connection or server-side failure, instead of letting the raw
    exception crash the request.
    """
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
