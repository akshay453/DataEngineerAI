"""
A single table stores history entries from every tab (chat, code
generator, CSV Q&A, PDF Q&A). The `content` column holds a JSON blob
whose shape depends on `session_type`.

`client_id` scopes entries to a single browser (a random ID generated
client-side and stored in localStorage) so different visitors on the
public deployment don't see each other's history. This is NOT real
authentication — anyone who clears their browser storage loses access
to their old entries, and it doesn't protect against someone
deliberately guessing/sharing IDs. Real user accounts would be the
proper fix if this app ever needs genuine privacy guarantees.
"""

from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Integer, String

from app.database import Base


class HistoryEntry(Base):
    __tablename__ = "history_entries"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String, nullable=False, index=True, default="")
    session_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))