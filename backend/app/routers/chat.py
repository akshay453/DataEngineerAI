from fastapi import APIRouter
from pydantic import BaseModel

from app.ollama_client import call_ollama

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/", response_model=ChatResponse)
def send_message(request: ChatRequest):
    reply = call_ollama(request.message)
    return ChatResponse(reply=reply)
