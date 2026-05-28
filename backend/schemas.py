from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from config import DEFAULT_THREAD_ID, DEFAULT_USER_ID


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    thread_id: str = DEFAULT_THREAD_ID
    user_id: str = DEFAULT_USER_ID


class ChatResponse(BaseModel):
    answer: str
    thread_id: str
    user_id: str
    pending_review: bool = False
    approval_request: str | None = None
    pending_worker: str | None = None
    artifacts: list[dict[str, Any]] = Field(default_factory=list)


class ReviewRequest(BaseModel):
    thread_id: str = DEFAULT_THREAD_ID
    user_id: str = DEFAULT_USER_ID
    review_notes: str = ""


class ReviewResponse(BaseModel):
    answer: str | None = None
    thread_id: str
    user_id: str
    pending_review: bool = False
    approval_request: str | None = None
    pending_worker: str | None = None
    artifacts: list[dict[str, Any]] = Field(default_factory=list)


class StateResponse(BaseModel):
    state: dict[str, Any]


class GraphBuildRequest(BaseModel):
    dry_run: bool = True
    reset: bool = False
    preview_llm: bool = False
    use_gliner: bool = False


class GraphBuildResponse(BaseModel):
    ok: bool
    message: str
