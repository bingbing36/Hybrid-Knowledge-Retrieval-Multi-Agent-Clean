from __future__ import annotations

from fastapi import APIRouter

from backend.schemas import GraphBuildRequest, GraphBuildResponse
from backend.services.agent_service import build_graph


router = APIRouter(tags=["graph"])


@router.post("/graph/build", response_model=GraphBuildResponse)
def build(request: GraphBuildRequest) -> GraphBuildResponse:
    message = build_graph(
        dry_run=request.dry_run,
        reset=request.reset,
        preview_llm=request.preview_llm,
        use_gliner=request.use_gliner,
    )
    return GraphBuildResponse(ok=True, message=message)
