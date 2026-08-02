"""
A minimal file-backed vector store — a lightweight ChromaDB
replacement that avoids needing compiled dependencies (chromadb's
hnswlib requires Visual C++ Build Tools on Windows, which is slow to
install). This is plenty fast for a small personal project: a few
hundred chunks, cosine similarity computed with numpy.
"""

import json
import os

import numpy as np

STORE_PATH = "./vector_store.json"


def _load() -> list[dict]:
    if not os.path.exists(STORE_PATH):
        return []
    with open(STORE_PATH, "r") as f:
        return json.load(f)


def _save(records: list[dict]) -> None:
    with open(STORE_PATH, "w") as f:
        json.dump(records, f)


def add(document_id: str, filename: str, chunks: list[str], embeddings: list[list[float]]) -> None:
    records = _load()
    for chunk, embedding in zip(chunks, embeddings):
        records.append(
            {
                "document_id": document_id,
                "filename": filename,
                "text": chunk,
                "embedding": embedding,
            }
        )
    _save(records)


def query(document_id: str, query_embedding: list[float], top_k: int = 4) -> list[str]:
    records = _load()
    doc_records = [r for r in records if r["document_id"] == document_id]
    if not doc_records:
        return []

    query_vec = np.array(query_embedding)
    query_norm = np.linalg.norm(query_vec)

    scored = []
    for r in doc_records:
        vec = np.array(r["embedding"])
        similarity = np.dot(query_vec, vec) / (query_norm * np.linalg.norm(vec) + 1e-8)
        scored.append((similarity, r["text"]))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [text for _, text in scored[:top_k]]