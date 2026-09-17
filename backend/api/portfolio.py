"""
api/portfolio.py
Portfolio and watchlist management endpoints.
"""

from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional

from core.database import get_db
from models.portfolio import Portfolio
from models.user import User
from api.auth import get_current_user

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


# ─── Schemas ───────────────────────────────────────────────────────────────────

class AddHoldingRequest(BaseModel):
    ticker: str
    shares: Optional[float] = None
    avg_buy_price: Optional[float] = None
    is_watchlist: bool = False
    is_paper_trade: bool = False


class PortfolioItemResponse(BaseModel):
    id: str
    ticker: str
    company_name: Optional[str]
    sector: Optional[str]
    shares: Optional[float]
    avg_buy_price: Optional[float]
    is_watchlist: bool
    is_paper_trade: bool
    added_at: str


# ─── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all portfolio holdings and watchlist items."""
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.user_id == current_user.id)
        .order_by(Portfolio.added_at.desc())
    )
    items = result.scalars().all()

    holdings = []
    watchlist = []

    for item in items:
        data = {
            "id": str(item.id),
            "ticker": item.ticker,
            "company_name": item.company_name,
            "sector": item.sector,
            "shares": item.shares,
            "avg_buy_price": item.avg_buy_price,
            "is_watchlist": item.is_watchlist,
            "is_paper_trade": item.is_paper_trade,
            "added_at": item.added_at.isoformat(),
        }
        if item.is_watchlist:
            watchlist.append(data)
        else:
            holdings.append(data)

    return {"holdings": holdings, "watchlist": watchlist}


@router.post("/add", status_code=status.HTTP_201_CREATED)
async def add_to_portfolio(
    body: AddHoldingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a stock to portfolio holdings or watchlist."""
    ticker = body.ticker.upper().strip()

    # Check for duplicates
    existing = await db.execute(
        select(Portfolio).where(
            Portfolio.user_id == current_user.id,
            Portfolio.ticker == ticker,
            Portfolio.is_watchlist == body.is_watchlist,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, f"{ticker} already in {'watchlist' if body.is_watchlist else 'portfolio'}")

    # Fetch company info
    company_name, sector = await _get_stock_info(ticker)

    item = Portfolio(
        user_id=current_user.id,
        ticker=ticker,
        company_name=company_name,
        sector=sector,
        shares=body.shares,
        avg_buy_price=body.avg_buy_price,
        is_watchlist=body.is_watchlist,
        is_paper_trade=body.is_paper_trade,
    )
    db.add(item)
    await db.flush()

    return {
        "id": str(item.id),
        "ticker": ticker,
        "company_name": company_name,
        "message": f"Added {ticker} to {'watchlist' if body.is_watchlist else 'portfolio'}",
    }


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_portfolio(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an item from portfolio or watchlist."""
    try:
        uid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid item ID")

    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == uid,
            Portfolio.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Portfolio item not found")

    await db.delete(item)


@router.get("/watchlist")
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get watchlist items with live price data."""
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.user_id == current_user.id,
            Portfolio.is_watchlist == True,
        )
    )
    items = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "ticker": i.ticker,
            "company_name": i.company_name,
            "sector": i.sector,
            "added_at": i.added_at.isoformat(),
        }
        for i in items
    ]


async def _get_stock_info(ticker: str) -> tuple[str, str]:
    """Helper: fetch company name and sector."""
    try:
        import asyncio
        from data.yahoo_finance import yahoo_fetcher
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, yahoo_fetcher.get_stock_info, ticker)
        return info.get("company_name", ticker), info.get("sector", "Unknown")
    except Exception:
        return ticker, "Unknown"
