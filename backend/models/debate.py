"""
models/debate.py
SQLAlchemy ORM model for debate sessions and results.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class DebateSession(Base):
    __tablename__ = "debate_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending | running | completed | failed

    # Agent outputs stored as JSON
    bull_argument: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    bear_argument: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    neutral_argument: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    judge_verdict: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Final verdict
    verdict: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )  # BUY | SELL | HOLD
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Market data snapshot at time of debate
    market_data_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="debates")  # noqa: F821

    def __repr__(self) -> str:
        return f"<DebateSession id={self.id} ticker={self.ticker} verdict={self.verdict}>"
