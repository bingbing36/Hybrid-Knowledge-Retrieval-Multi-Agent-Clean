from __future__ import annotations

from fastapi import APIRouter

from backend.schemas import ReviewRequest, ReviewResponse
from backend.services.agent_service import submit_review_detail


router = APIRouter(tags=["review"])


@router.post("/review/approve", response_model=ReviewResponse)
def approve(request: ReviewRequest) -> ReviewResponse:
    result = submit_review_detail("approve", request.thread_id, request.user_id, request.review_notes)
    return ReviewResponse(
        answer=result["answer"],
        thread_id=request.thread_id,
        user_id=request.user_id,
        pending_review=result["pending_review"],
        approval_request=result["approval_request"],
        pending_worker=result["pending_worker"],
        artifacts=result["artifacts"],
    )


@router.post("/review/reject", response_model=ReviewResponse)
def reject(request: ReviewRequest) -> ReviewResponse:
    result = submit_review_detail("reject", request.thread_id, request.user_id, request.review_notes)
    return ReviewResponse(
        answer=result["answer"],
        thread_id=request.thread_id,
        user_id=request.user_id,
        pending_review=result["pending_review"],
        approval_request=result["approval_request"],
        pending_worker=result["pending_worker"],
        artifacts=result["artifacts"],
    )
