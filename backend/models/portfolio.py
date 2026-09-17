"""
models/portfolio.py
SQLAlchemy ORM model for user portfolio holdings and watchlist.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    company_name: Mapped[str] = mapped_column(String(200), nullable=True)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Holding details (null if watchlist only)
    shares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_buy_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_watchlist: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Paper trading
    is_paper_trade: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolios")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Portfolio ticker={self.ticker} user={self.user_id}>"
