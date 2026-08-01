"""
A single table stores history entries from every tab (chat, code
generator, CSV Q&A, PDF Q&A). The `content` column holds a JSON blob
whose shape depends on `session_type` — this keeps one simple table
instead of four near-identical ones.
"""

from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Integer, String

from app.database import Base


class HistoryEntry(Base):
    __tablename__ = "history_entries"

    id = Column(Integer, primary_key=True, index=True)
    session_type = Column(String, nullable=False)  # "chat" | "code" | "csv" | "pdf"
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))