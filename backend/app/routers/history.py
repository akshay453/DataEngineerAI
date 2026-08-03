from typing import Any, Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HistoryEntry

router = APIRouter()

SessionType = Literal["chat", "code", "csv", "pdf"]


def get_client_id(x_client_id: str = Header(...)) -> str:
    if not x_client_id:
        raise HTTPException(status_code=400, detail="Missing X-Client-Id header")
    return x_client_id


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
def save_history(
    entry: HistoryCreate,
    db: Session = Depends(get_db),
    client_id: str = Depends(get_client_id),
):
    db_entry = HistoryEntry(
        client_id=client_id,
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
    session_type: SessionType | None = None,
    db: Session = Depends(get_db),
    client_id: str = Depends(get_client_id),
):
    query = (
        db.query(HistoryEntry)
        .filter(HistoryEntry.client_id == client_id)
        .order_by(HistoryEntry.created_at.desc())
    )
    if session_type:
        query = query.filter(HistoryEntry.session_type == session_type)
    entries = query.limit(100).all()
    return [_serialize_list_item(e) for e in entries]


@router.get("/{entry_id}", response_model=HistoryDetail)
def get_history(
    entry_id: int,
    db: Session = Depends(get_db),
    client_id: str = Depends(get_client_id),
):
    entry = (
        db.query(HistoryEntry)
        .filter(HistoryEntry.id == entry_id, HistoryEntry.client_id == client_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    return _serialize_detail(entry)


@router.delete("/{entry_id}")
def delete_history(
    entry_id: int,
    db: Session = Depends(get_db),
    client_id: str = Depends(get_client_id),
):
    entry = (
        db.query(HistoryEntry)
        .filter(HistoryEntry.id == entry_id, HistoryEntry.client_id == client_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()
    return {"deleted": True}