from __future__ import annotations

from fastapi.responses import StreamingResponse
from fastapi import APIRouter

from backend.schemas import ChatRequest, ChatResponse
from backend.services.agent_service import encode_ndjson, run_chat_detail, stream_chat_events


router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    result = run_chat_detail(request.question, request.thread_id, request.user_id)
    return ChatResponse(
        answer=result["answer"],
        thread_id=request.thread_id,
        user_id=request.user_id,
        pending_review=result["pending_review"],
        approval_request=result["approval_request"],
        pending_worker=result["pending_worker"],
        artifacts=result["artifacts"],
    )


@router.post("/chat/stream")
def chat_stream(request: ChatRequest) -> StreamingResponse:
    events = stream_chat_events(request.question, request.thread_id, request.user_id)
    return StreamingResponse(
        encode_ndjson(events),
        media_type="application/x-ndjson",
    )
