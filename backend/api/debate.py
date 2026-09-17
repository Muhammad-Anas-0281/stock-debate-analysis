"""
api/debate.py
Debate endpoints: start debate, get result, WebSocket streaming.
"""

from __future__ import annotations

import json
import uuid
import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from core.database import get_db
from models.debate import DebateSession
from models.user import User
from agents.debate_graph import debate_graph
from api.auth import get_current_user

router = APIRouter(prefix="/api/debate", tags=["Debate"])

# Track active WebSocket connections: debate_id → websocket
active_connections: dict[str, WebSocket] = {}


# ─── Schemas ───────────────────────────────────────────────────────────────────

class StartDebateRequest(BaseModel):
    ticker: str

    def model_post_init(self, __context):
        self.ticker = self.ticker.upper().strip()


class DebateResponse(BaseModel):
    debate_id: str
    ticker: str
    status: str
    verdict: str | None = None
    confidence_score: float | None = None
    bull_argument: dict | None = None
    bear_argument: dict | None = None
    neutral_argument: dict | None = None
    judge_verdict: dict | None = None
    market_data_snapshot: dict | None = None


# ─── Routes ────────────────────────────────────────────────────────────────────

@router.post("/start", status_code=status.HTTP_202_ACCEPTED)
async def start_debate(
    body: StartDebateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new debate session for a stock ticker.
    Returns the debate_id immediately — connect to WebSocket for real-time updates.
    """
    # Validate ticker (basic)
    if not body.ticker.isalpha() or len(body.ticker) > 10:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid ticker symbol")

    # Create debate record
    debate = DebateSession(
        user_id=current_user.id,
        ticker=body.ticker,
        status="pending",
    )
    db.add(debate)
    await db.flush()
    debate_id = str(debate.id)

    # Run debate in background (non-blocking)
    # Small delay lets the frontend WebSocket connect before streaming starts
    async def _delayed_debate():
        await asyncio.sleep(1.5)
        await _run_debate_background(debate_id, body.ticker, db)

    asyncio.create_task(_delayed_debate())

    return {"debate_id": debate_id, "ticker": body.ticker, "status": "pending"}


@router.get("/{debate_id}", response_model=DebateResponse)
async def get_debate(
    debate_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current state/result of a debate session."""
    try:
        uid = uuid.UUID(debate_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid debate ID")

    result = await db.execute(
        select(DebateSession).where(
            DebateSession.id == uid,
            DebateSession.user_id == current_user.id,
        )
    )
    debate = result.scalar_one_or_none()
    if not debate:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Debate not found")

    return DebateResponse(
        debate_id=str(debate.id),
        ticker=debate.ticker,
        status=debate.status,
        verdict=debate.verdict,
        confidence_score=debate.confidence_score,
        bull_argument=debate.bull_argument,
        bear_argument=debate.bear_argument,
        neutral_argument=debate.neutral_argument,
        judge_verdict=debate.judge_verdict,
        market_data_snapshot=debate.market_data_snapshot,
    )


@router.get("/history/me")
async def get_my_debates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the authenticated user's debate history."""
    result = await db.execute(
        select(DebateSession)
        .where(DebateSession.user_id == current_user.id)
        .order_by(DebateSession.created_at.desc())
        .limit(20)
    )
    debates = result.scalars().all()
    return [
        {
            "debate_id": str(d.id),
            "ticker": d.ticker,
            "company_name": d.company_name,
            "verdict": d.verdict,
            "confidence_score": d.confidence_score,
            "status": d.status,
            "created_at": d.created_at.isoformat(),
        }
        for d in debates
    ]


# ─── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/{debate_id}")
async def debate_websocket(websocket: WebSocket, debate_id: str):
    """
    WebSocket endpoint for real-time debate streaming.
    Client receives step-by-step agent updates as JSON messages.
    """
    await websocket.accept()
    active_connections[debate_id] = websocket

    try:
        # Keep connection alive — debate_background will push updates
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=120)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    finally:
        active_connections.pop(debate_id, None)


# ─── Background Task ───────────────────────────────────────────────────────────

async def _run_debate_background(debate_id: str, ticker: str, db: AsyncSession):
    """
    Runs the full debate pipeline in background and streams updates
    to the connected WebSocket client.
    """
    from core.database import AsyncSessionLocal
    from datetime import datetime, timezone

    async def on_step(step_name: str, data: dict):
        """Push step update to connected WebSocket."""
        ws = active_connections.get(debate_id)
        if ws:
            try:
                await ws.send_json({
                    "type": "step_update",
                    "step": step_name,
                    **data,
                })
            except Exception:
                pass

    try:
        # Run the debate graph
        state = await debate_graph.run(ticker, on_step=on_step)

        # Persist results to database
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(DebateSession).where(DebateSession.id == uuid.UUID(debate_id))
            )
            debate = result.scalar_one_or_none()
            if debate:
                judge = state.get("judge_output") or {}
                debate.status = state.get("status", "completed")
                debate.company_name = state.get("market_data", {}).get("company_name")
                debate.bull_argument = state.get("bull_output")
                debate.bear_argument = state.get("bear_output")
                debate.neutral_argument = state.get("neutral_output")
                debate.judge_verdict = state.get("judge_output")
                debate.verdict = judge.get("final_verdict")
                debate.confidence_score = judge.get("confidence_score")
                debate.summary = judge.get("summary")
                debate.market_data_snapshot = {
                    k: v for k, v in (state.get("market_data") or {}).items()
                    if not isinstance(v, (list, dict))
                }
                debate.completed_at = datetime.now(timezone.utc)
                await session.commit()

    except Exception as e:
        # Mark debate as failed
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(DebateSession).where(DebateSession.id == uuid.UUID(debate_id))
            )
            debate = result.scalar_one_or_none()
            if debate:
                debate.status = "failed"
                await session.commit()

        ws = active_connections.get(debate_id)
        if ws:
            try:
                await ws.send_json({"type": "error", "message": str(e)})
            except Exception:
                pass
