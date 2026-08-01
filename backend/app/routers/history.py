from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HistoryEntry

router = APIRouter()

SessionType = Literal["chat", "code", "csv", "pdf"]


class HistoryCreate(BaseModel):
    session_type: SessionType
    title: str
    content: dict[str, Any]


class HistoryListItem(BaseModel):
    id: int
    session_type: SessionType
    title: str
    created_at: str

    class Config:
        from_attributes = True


class HistoryDetail(BaseModel):
    id: int
    session_type: SessionType
    title: str
    content: dict[str, Any]
    created_at: str

    class Config:
        from_attributes = True


def _serialize_list_item(entry: HistoryEntry) -> HistoryListItem:
    return HistoryListItem(
        id=entry.id,
        session_type=entry.session_type,
        title=entry.title,
        created_at=entry.created_at.isoformat(),
    )


def _serialize_detail(entry: HistoryEntry) -> HistoryDetail:
    return HistoryDetail(
        id=entry.id,
        session_type=entry.session_type,
        title=entry.title,
        content=entry.content,
        created_at=entry.created_at.isoformat(),
    )


@router.post("/", response_model=HistoryDetail)
def save_history(entry: HistoryCreate, db: Session = Depends(get_db)):
    db_entry = HistoryEntry(
        session_type=entry.session_type,
        title=entry.title[:200],
        content=entry.content,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return _serialize_detail(db_entry)


@router.get("/", response_model=list[HistoryListItem])
def list_history(
    session_type: SessionType | None = None, db: Session = Depends(get_db)
):
    query = db.query(HistoryEntry).order_by(HistoryEntry.created_at.desc())
    if session_type:
        query = query.filter(HistoryEntry.session_type == session_type)
    entries = query.limit(100).all()
    return [_serialize_list_item(e) for e in entries]


@router.get("/{entry_id}", response_model=HistoryDetail)
def get_history(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(HistoryEntry).filter(HistoryEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    return _serialize_detail(entry)


@router.delete("/{entry_id}")
def delete_history(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(HistoryEntry).filter(HistoryEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()
    return {"deleted": True}