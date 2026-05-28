from __future__ import annotations

from fastapi import APIRouter

from backend.schemas import StateResponse
from backend.services.agent_service import get_state
from config import DEFAULT_THREAD_ID, DEFAULT_USER_ID


router = APIRouter(tags=["state"])


@router.get("/state", response_model=StateResponse)
def state(
    thread_id: str = DEFAULT_THREAD_ID,
    user_id: str = DEFAULT_USER_ID,
) -> StateResponse:
    return StateResponse(state=get_state(thread_id, user_id))
