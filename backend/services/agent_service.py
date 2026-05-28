from __future__ import annotations

import contextlib
import io
import json
import re
import time
from collections.abc import Iterator
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from app import classify_db_auth_error, classify_provider_error
from agents import get_app
from build_graph_offline import build_graph_once
from config import BASE_DIR, REVIEW_NODE
from hitl import is_review_pending, summarize_state_snapshot
from memory import build_config, get_final_message_from_snapshot, get_last_message
from streaming import build_payload, inspect_thread_state, resume_thread, run, update_review_decision


ARTIFACTS_DIR = BASE_DIR / "artifacts"
CHARTS_DIR = ARTIFACTS_DIR / "charts"
CHART_PATH_PATTERN = re.compile(
    r"(?P<path>(?:[A-Za-z]:[\\/][^\n\r`*]+?|(?:\./)?artifacts[\\/][^\n\r`*]+?)\.png)",
    re.IGNORECASE,
)


def _format_error(exc: Exception) -> HTTPException:
    provider_error = classify_provider_error(exc)
    if provider_error:
        return HTTPException(status_code=402, detail=provider_error)
    db_auth_error = classify_db_auth_error(exc)
    if db_auth_error:
        return HTTPException(status_code=401, detail=db_auth_error)
    return HTTPException(status_code=500, detail=str(exc))


def _artifact_url(path: Path) -> str:
    relative = path.resolve().relative_to(ARTIFACTS_DIR.resolve()).as_posix()
    return f"/artifacts/{relative}"


def _artifact_payload(path: Path) -> dict[str, Any] | None:
    try:
        url = _artifact_url(path)
    except ValueError:
        return None
    if not path.exists():
        return None
    return {
        "type": "image",
        "title": path.stem.replace("_", " "),
        "url": url,
        "path": path.as_posix(),
    }


def extract_chart_artifacts(text: str) -> list[dict[str, Any]]:
    artifacts = []
    seen: set[str] = set()
    for match in CHART_PATH_PATTERN.finditer(text or ""):
        raw_path = match.group("path").strip().strip("'\"")
        path = Path(raw_path)
        if not path.is_absolute():
            path = (BASE_DIR / path).resolve()
        payload = _artifact_payload(path)
        if payload and payload["url"] not in seen:
            artifacts.append(payload)
            seen.add(payload["url"])
    return artifacts


def list_chart_artifacts(since: float) -> list[dict[str, Any]]:
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)
    artifacts = []
    for path in sorted(CHARTS_DIR.glob("*.png"), key=lambda item: item.stat().st_mtime):
        if path.stat().st_mtime + 0.5 < since:
            continue
        payload = _artifact_payload(path)
        if payload:
            artifacts.append(payload)
    return artifacts[-3:]


def merge_artifacts(*groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged = []
    seen: set[str] = set()
    for group in groups:
        for artifact in group:
            url = artifact.get("url")
            if not url or url in seen:
                continue
            merged.append(artifact)
            seen.add(url)
    return merged


def _thread_summary(thread_id: str, user_id: str) -> dict[str, Any]:
    state = get_state(thread_id, user_id)
    return {
        "pending_review": bool(REVIEW_NODE in state.get("next", [])),
        "approval_request": state.get("approval_request"),
        "pending_worker": state.get("pending_worker"),
    }


def run_chat(question: str, thread_id: str, user_id: str) -> str:
    try:
        message = run(
            question,
            thread_id=thread_id,
            user_id=user_id,
            stream_mode="invoke",
        )
    except Exception as exc:
        raise _format_error(exc) from exc
    return getattr(message, "content", str(message))


def run_chat_detail(question: str, thread_id: str, user_id: str) -> dict[str, Any]:
    started_at = time.time()
    answer = run_chat(question, thread_id, user_id)
    return {
        "answer": answer,
        "artifacts": merge_artifacts(
            extract_chart_artifacts(answer),
            list_chart_artifacts(started_at),
        ),
        **_thread_summary(thread_id, user_id),
    }


def stream_chat_events(question: str, thread_id: str, user_id: str) -> Iterator[dict[str, Any]]:
    started_at = time.time()
    app = get_app()
    config = build_config(thread_id=thread_id, user_id=user_id)
    payload = build_payload(question, resume=False)
    printed_messages: set[tuple[str, str]] = set()
    trace_texts: list[str] = []

    try:
        yield {"type": "status", "message": "开始执行多代理工作流"}
        for step in app.stream(payload, config=config, stream_mode="values"):
            step_message = get_last_message(step.get("messages"))
            if step_message is None:
                continue

            speaker = getattr(step_message, "name", None) or "assistant"
            content = getattr(step_message, "content", "")
            signature = (speaker, content)
            if content and signature not in printed_messages:
                printed_messages.add(signature)
                trace_texts.append(content)
                yield {
                    "type": "trace",
                    "node": speaker,
                    "content": content,
                }

        snapshot = app.get_state(config)
        summary = summarize_state_snapshot(snapshot)
        pending_review = is_review_pending(snapshot)
        if pending_review:
            yield {
                "type": "review_required",
                "approval_request": summary.get("approval_request")
                or "当前操作需要人工确认后才能继续执行。",
                "pending_worker": summary.get("pending_worker"),
            }

        final_message = get_final_message_from_snapshot(snapshot)
        answer = getattr(final_message, "content", None) or summary.get("latest_message") or ""
        artifacts = merge_artifacts(
            extract_chart_artifacts("\n".join([*trace_texts, answer])),
            list_chart_artifacts(started_at),
        )
        yield {
            "type": "final",
            "answer": answer,
            "pending_review": pending_review,
            "approval_request": summary.get("approval_request"),
            "pending_worker": summary.get("pending_worker"),
            "artifacts": artifacts,
        }
    except Exception as exc:
        formatted = _format_error(exc)
        yield {
            "type": "error",
            "message": formatted.detail,
            "status_code": formatted.status_code,
        }


def encode_ndjson(events: Iterator[dict[str, Any]]) -> Iterator[str]:
    for event in events:
        yield json.dumps(event, ensure_ascii=False, default=str) + "\n"


def get_state(thread_id: str, user_id: str) -> dict:
    try:
        return inspect_thread_state(thread_id=thread_id, user_id=user_id)
    except Exception as exc:
        raise _format_error(exc) from exc


def submit_review(decision: str, thread_id: str, user_id: str, review_notes: str = "") -> str | None:
    try:
        update_review_decision(
            decision,
            thread_id=thread_id,
            user_id=user_id,
            review_notes=review_notes,
        )
        message = resume_thread(
            thread_id=thread_id,
            user_id=user_id,
            stream_mode="invoke",
        )
    except Exception as exc:
        raise _format_error(exc) from exc
    return getattr(message, "content", None) if message is not None else None


def submit_review_detail(
    decision: str,
    thread_id: str,
    user_id: str,
    review_notes: str = "",
) -> dict[str, Any]:
    started_at = time.time()
    answer = submit_review(decision, thread_id, user_id, review_notes)
    return {
        "answer": answer,
        "artifacts": merge_artifacts(
            extract_chart_artifacts(answer or ""),
            list_chart_artifacts(started_at),
        ),
        **_thread_summary(thread_id, user_id),
    }


def build_graph(
    *,
    dry_run: bool,
    reset: bool,
    preview_llm: bool,
    use_gliner: bool,
) -> str:
    output = io.StringIO()
    try:
        with contextlib.redirect_stdout(output):
            build_graph_once(
                dry_run=dry_run,
                reset=reset,
                preview_llm=preview_llm,
                use_gliner=use_gliner,
            )
    except Exception as exc:
        detail = output.getvalue().strip()
        if detail:
            raise HTTPException(status_code=500, detail=f"{detail}\n{exc}") from exc
        raise _format_error(exc) from exc
    return output.getvalue()
