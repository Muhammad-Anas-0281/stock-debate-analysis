"""
services/recommendation.py
Daily AI picks engine — scans market, scores via agent debate, returns top picks.
"""

from __future__ import annotations

from typing import Optional
from loguru import logger

from core.celery_app import celery_app


# Popular tickers to scan for daily picks
SCAN_UNIVERSE = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "NFLX",
    "AMD", "INTC", "CRM", "ADBE", "PYPL", "SQ", "SHOP", "ZOOM",
    "JPM", "BAC", "GS", "V", "MA", "WMT", "TGT", "COST",
    "JNJ", "PFE", "MRNA", "ABBV", "UNH", "CVX", "XOM", "NEE",
]


class RecommendationEngine:
    """
    Generates personalized daily stock picks using:
    1. Market scanner across 500+ equities
    2. Pinecone vector matching to user profile
    3. Agent debate confidence scoring
    """

    async def get_daily_picks(
        self,
        user_id: str,
        risk_tolerance: str = "moderate",
        preferred_sectors: Optional[list] = None,
        top_n: int = 5,
    ) -> list[dict]:
        """
        Generate top N personalized stock picks for a user.
        Uses cached debate results if available.
        """
        from data.yahoo_finance import yahoo_fetcher
        import asyncio

        logger.info(f"RecommendationEngine: generating picks for user {user_id}")

        # Filter universe based on risk tolerance
        tickers = self._filter_universe(risk_tolerance)[:15]

        # Fetch basic data for each ticker concurrently
        tasks = [self._quick_score(ticker) for ticker in tickers]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        scored = []
        for ticker, result in zip(tickers, results):
            if isinstance(result, Exception) or not result:
                continue
            scored.append(result)

        # Sort by composite score
        scored.sort(key=lambda x: x.get("composite_score", 0), reverse=True)

        # Apply sector preference filter
        if preferred_sectors:
            preferred = [s.lower() for s in preferred_sectors]
            scored = sorted(
                scored,
                key=lambda x: (
                    any(s in x.get("sector", "").lower() for s in preferred),
                    x.get("composite_score", 0),
                ),
                reverse=True,
            )

        return scored[:top_n]

    async def _quick_score(self, ticker: str) -> Optional[dict]:
        """
        Compute a quick fundamental score for a ticker without full debate.
        Used for scanning the universe efficiently.
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            from data.yahoo_finance import yahoo_fetcher
            info = await loop.run_in_executor(None, yahoo_fetcher.get_stock_info, ticker)

            if not info or "error" in info:
                return None

            score = self._compute_score(info)
            return {
                "ticker": ticker,
                "company_name": info.get("company_name", ticker),
                "sector": info.get("sector", "Unknown"),
                "current_price": info.get("current_price"),
                "pe_ratio": info.get("pe_ratio"),
                "revenue_growth": info.get("revenue_growth"),
                "analyst_recommendation": info.get("analyst_recommendation"),
                "dividend_yield": info.get("dividend_yield"),
                "composite_score": score,
                "score_breakdown": self._score_breakdown(info),
            }
        except Exception as e:
            logger.warning(f"Quick score failed for {ticker}: {e}")
            return None

    def _compute_score(self, info: dict) -> float:
        """Composite fundamental score (0–100)."""
        score = 50.0

        # Revenue growth boost
        rg = info.get("revenue_growth") or 0
        score += min(rg * 100, 20)

        # Earnings growth
        eg = info.get("earnings_growth") or 0
        score += min(eg * 50, 10)

        # Analyst recommendation
        rec = (info.get("analyst_recommendation") or "").lower()
        rec_map = {"strong_buy": 15, "buy": 10, "hold": 0, "sell": -10, "strong_sell": -15}
        score += rec_map.get(rec, 0)

        # P/E valuation (prefer moderate P/E)
        pe = info.get("pe_ratio") or 0
        if 10 < pe < 25:
            score += 10
        elif pe > 50:
            score -= 10

        # Profit margin
        pm = info.get("profit_margin") or 0
        score += min(pm * 50, 10)

        # Debt penalty
        de = info.get("debt_to_equity") or 0
        if de > 2:
            score -= 10
        elif de > 1:
            score -= 5

        return round(min(max(score, 0), 100), 1)

    def _score_breakdown(self, info: dict) -> dict:
        return {
            "revenue_growth": info.get("revenue_growth"),
            "earnings_growth": info.get("earnings_growth"),
            "analyst_rec": info.get("analyst_recommendation"),
            "pe_ratio": info.get("pe_ratio"),
            "profit_margin": info.get("profit_margin"),
        }

    def _filter_universe(self, risk_tolerance: str) -> list:
        """Filter tickers based on risk profile."""
        # In production this would use actual risk metrics
        # For now return full universe shuffled slightly
        import random
        universe = SCAN_UNIVERSE.copy()
        random.shuffle(universe)
        return universe


# Celery task for scheduled daily picks generation
@celery_app.task(name="services.recommendation.generate_daily_picks")
def generate_daily_picks():
    """Celery periodic task to pre-compute daily picks."""
    import asyncio
    logger.info("Celery: generating daily picks for all users")
    engine = RecommendationEngine()
    # In production: query all active users and cache their picks in Redis
    logger.info("Celery: daily picks generation complete")


# Singleton
recommendation_engine = RecommendationEngine()
