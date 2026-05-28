from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


PROJECT_DIR = Path(__file__).resolve().parents[1]
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from backend.routers import chat, graph, review, state  # noqa: E402


app = FastAPI(title="Multi-Agent API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(review.router, prefix="/api")
app.include_router(state.router, prefix="/api")
app.include_router(graph.router, prefix="/api")

ARTIFACTS_DIR = PROJECT_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/artifacts", StaticFiles(directory=str(ARTIFACTS_DIR)), name="artifacts")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
