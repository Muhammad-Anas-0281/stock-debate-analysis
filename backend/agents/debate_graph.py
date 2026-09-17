"""
agents/debate_graph.py
LangGraph state machine orchestrating the sequential multi-agent debate.
Flow: market_data → Bull → Bear → Neutral → Judge → Final Verdict
"""

import asyncio
from typing import TypedDict, Optional, Callable, Awaitable
from loguru import logger

from agents.bull_agent import bull_agent
from agents.bear_agent import bear_agent
from agents.neutral_agent import neutral_agent
from agents.judge_agent import judge_agent
from data.pipeline import pipeline


# ─── State Schema ──────────────────────────────────────────────────────────────

class DebateState(TypedDict):
    ticker: str
    market_data: dict
    bull_output: Optional[dict]
    bear_output: Optional[dict]
    neutral_output: Optional[dict]
    judge_output: Optional[dict]
    status: str          # pending | running | completed | failed
    error: Optional[str]


# ─── Debate Graph ──────────────────────────────────────────────────────────────

class DebateGraph:
    """
    Orchestrates the 4-agent sequential debate using LangGraph-style state passing.
    Supports streaming callbacks to emit real-time updates over WebSocket.
    """

    async def run(
        self,
        ticker: str,
        on_step: Optional[Callable[[str, dict], Awaitable[None]]] = None,
    ) -> DebateState:
        """
        Run the full debate pipeline for a given ticker.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL")
            on_step: Async callback called after each agent step.
                     Signature: on_step(step_name: str, data: dict)

        Returns:
            Final DebateState with all agent outputs and verdict.
        """
        state: DebateState = {
            "ticker": ticker.upper(),
            "market_data": {},
            "bull_output": None,
            "bear_output": None,
            "neutral_output": None,
            "judge_output": None,
            "status": "running",
            "error": None,
        }

        try:
            # ── Step 1: Data Pipeline ────────────────────────────────────────
            logger.info(f"DebateGraph [{ticker}]: Step 1 — Data Pipeline")
            await self._emit(on_step, "data_pipeline", {
                "step": 1, "total": 5,
                "message": f"Fetching market data for {ticker}...",
                "status": "running",
            })

            state["market_data"] = await pipeline.fetch_all(ticker)

            await self._emit(on_step, "data_pipeline", {
                "step": 1, "total": 5,
                "message": f"Market data collected for {state['market_data'].get('company_name', ticker)}",
                "status": "done",
                "data": {
                    "company_name": state["market_data"].get("company_name"),
                    "current_price": state["market_data"].get("current_price"),
                    "sector": state["market_data"].get("sector"),
                },
            })

            # ── Step 2: Bull Agent ───────────────────────────────────────────
            logger.info(f"DebateGraph [{ticker}]: Step 2 — Bull Agent")
            await self._emit(on_step, "bull_agent", {
                "step": 2, "total": 5,
                "message": "Bull Agent analyzing growth opportunities...",
                "status": "running",
            })

            state["bull_output"] = await bull_agent.analyze(state["market_data"])

            await self._emit(on_step, "bull_agent", {
                "step": 2, "total": 5,
                "message": state["bull_output"].get("headline", "Bull analysis complete"),
                "status": "done",
                "data": state["bull_output"],
            })

            # ── Step 3: Bear Agent ───────────────────────────────────────────
            logger.info(f"DebateGraph [{ticker}]: Step 3 — Bear Agent")
            await self._emit(on_step, "bear_agent", {
                "step": 3, "total": 5,
                "message": "Bear Agent evaluating risks and counter-arguments...",
                "status": "running",
            })

            state["bear_output"] = await bear_agent.analyze(
                state["market_data"], state["bull_output"]
            )

            await self._emit(on_step, "bear_agent", {
                "step": 3, "total": 5,
                "message": state["bear_output"].get("headline", "Bear analysis complete"),
                "status": "done",
                "data": state["bear_output"],
            })

            # ── Step 4: Neutral Agent ────────────────────────────────────────
            logger.info(f"DebateGraph [{ticker}]: Step 4 — Neutral Agent")
            await self._emit(on_step, "neutral_agent", {
                "step": 4, "total": 5,
                "message": "Neutral Agent weighing both sides...",
                "status": "running",
            })

            state["neutral_output"] = await neutral_agent.analyze(
                state["market_data"], state["bull_output"], state["bear_output"]
            )

            await self._emit(on_step, "neutral_agent", {
                "step": 4, "total": 5,
                "message": state["neutral_output"].get("headline", "Neutral analysis complete"),
                "status": "done",
                "data": state["neutral_output"],
            })

            # ── Step 5: Judge Agent ──────────────────────────────────────────
            logger.info(f"DebateGraph [{ticker}]: Step 5 — Judge Agent")
            await self._emit(on_step, "judge_agent", {
                "step": 5, "total": 5,
                "message": "Judge Agent synthesizing final verdict...",
                "status": "running",
            })

            state["judge_output"] = await judge_agent.synthesize(
                state["market_data"],
                state["bull_output"],
                state["bear_output"],
                state["neutral_output"],
            )

            state["status"] = "completed"

            await self._emit(on_step, "judge_agent", {
                "step": 5, "total": 5,
                "message": f"Verdict: {state['judge_output'].get('final_verdict')} "
                           f"(Confidence: {state['judge_output'].get('confidence_score')}%)",
                "status": "done",
                "data": state["judge_output"],
            })

            await self._emit(on_step, "completed", {
                "status": "completed",
                "verdict": state["judge_output"].get("final_verdict"),
                "confidence": state["judge_output"].get("confidence_score"),
            })

            logger.info(f"DebateGraph [{ticker}]: COMPLETED — {state['judge_output'].get('final_verdict')}")

        except Exception as e:
            state["status"] = "failed"
            state["error"] = str(e)
            logger.error(f"DebateGraph [{ticker}]: FAILED — {e}")
            await self._emit(on_step, "error", {
                "status": "failed",
                "message": str(e),
            })

        return state

    async def _emit(
        self,
        callback: Optional[Callable],
        step_name: str,
        data: dict,
    ) -> None:
        """Safely call the step callback if provided."""
        if callback:
            try:
                await callback(step_name, data)
            except Exception as e:
                logger.warning(f"DebateGraph emit error: {e}")


# Singleton
debate_graph = DebateGraph()
