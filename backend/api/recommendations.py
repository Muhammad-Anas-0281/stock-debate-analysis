"""
api/recommendations.py
Daily AI picks and personalized recommendation endpoints.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.user import User
from api.auth import get_current_user
from services.recommendation import recommendation_engine

router = APIRouter(prefix="/api/picks", tags=["Recommendations"])


@router.get("/daily")
async def get_daily_picks(
    top_n: int = Query(default=5, ge=1, le=10),
    current_user: User = Depends(get_current_user),
):
    """
    Get today's personalized AI stock picks for the authenticated user.
    Picks are based on user's risk tolerance and preferred sectors.
    """
    preferred_sectors = (
        [s.strip() for s in current_user.preferred_sectors.split(",") if s.strip()]
        if current_user.preferred_sectors
        else []
    )

    picks = await recommendation_engine.get_daily_picks(
        user_id=str(current_user.id),
        risk_tolerance=current_user.risk_tolerance,
        preferred_sectors=preferred_sectors or None,
        top_n=top_n,
    )

    return {
        "picks": picks,
        "count": len(picks),
        "risk_profile": current_user.risk_tolerance,
        "preferred_sectors": preferred_sectors,
    }


@router.get("/market-scan")
async def market_scan(
    sector: str = Query(default="", description="Filter by sector"),
    min_score: float = Query(default=50.0, ge=0, le=100),
    current_user: User = Depends(get_current_user),
):
    """Broad market scan returning top scored stocks."""
    picks = await recommendation_engine.get_daily_picks(
        user_id=str(current_user.id),
        risk_tolerance=current_user.risk_tolerance,
        preferred_sectors=[sector] if sector else None,
        top_n=10,
    )
    filtered = [p for p in picks if p.get("composite_score", 0) >= min_score]
    return {"results": filtered, "count": len(filtered)}
