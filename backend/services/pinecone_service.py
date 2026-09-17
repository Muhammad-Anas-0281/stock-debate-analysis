"""
services/pinecone_service.py
Pinecone vector DB operations for personalized stock recommendations.
Embeds user profiles and market data to find correlated investment ideas.
"""

from __future__ import annotations

import json
import hashlib
from typing import Optional
from loguru import logger

try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    logger.warning("Pinecone not installed — recommendation features disabled.")

from core.config import settings


class PineconeService:
    """
    Manages vector embeddings for:
    - User interest profiles
    - Stock fundamental snapshots
    - Debate result embeddings
    """

    def __init__(self):
        self._client = None
        self._index = None

    def _get_client(self):
        if not PINECONE_AVAILABLE:
            return None
        if self._client is None:
            try:
                self._client = Pinecone(api_key=settings.PINECONE_API_KEY)
                self._ensure_index()
            except Exception as e:
                logger.error(f"Pinecone init failed: {e}")
                return None
        return self._client

    def _ensure_index(self):
        """Create index if it doesn't exist."""
        client = self._client
        existing = [i.name for i in client.list_indexes()]
        if settings.PINECONE_INDEX_NAME not in existing:
            client.create_index(
                name=settings.PINECONE_INDEX_NAME,
                dimension=settings.PINECONE_DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            logger.info(f"Created Pinecone index: {settings.PINECONE_INDEX_NAME}")
        self._index = client.Index(settings.PINECONE_INDEX_NAME)

    def _get_index(self):
        client = self._get_client()
        if client and self._index is None:
            self._index = client.Index(settings.PINECONE_INDEX_NAME)
        return self._index

    async def upsert_stock_embedding(
        self,
        ticker: str,
        embedding: list[float],
        metadata: dict,
    ) -> bool:
        """Store a stock's embedding with metadata."""
        index = self._get_index()
        if not index:
            return False
        try:
            index.upsert(vectors=[{
                "id": f"stock_{ticker}",
                "values": embedding,
                "metadata": {
                    "ticker": ticker,
                    "sector": metadata.get("sector", ""),
                    "verdict": metadata.get("verdict", ""),
                    "confidence": metadata.get("confidence", 0),
                    **{k: v for k, v in metadata.items() if isinstance(v, (str, int, float, bool))},
                },
            }])
            return True
        except Exception as e:
            logger.error(f"Pinecone upsert failed for {ticker}: {e}")
            return False

    async def upsert_user_profile(
        self,
        user_id: str,
        embedding: list[float],
        metadata: dict,
    ) -> bool:
        """Store a user's interest profile embedding."""
        index = self._get_index()
        if not index:
            return False
        try:
            index.upsert(vectors=[{
                "id": f"user_{user_id}",
                "values": embedding,
                "metadata": {
                    "type": "user_profile",
                    "user_id": user_id,
                    "risk_tolerance": metadata.get("risk_tolerance", "moderate"),
                    "preferred_sectors": metadata.get("preferred_sectors", ""),
                },
            }])
            return True
        except Exception as e:
            logger.error(f"Pinecone user upsert failed: {e}")
            return False

    async def find_similar_stocks(
        self,
        query_embedding: list[float],
        top_k: int = 10,
        filter_dict: Optional[dict] = None,
    ) -> list[dict]:
        """Find top-k stocks similar to the query embedding."""
        index = self._get_index()
        if not index:
            return []
        try:
            result = index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict,
            )
            return [
                {
                    "ticker": match.metadata.get("ticker"),
                    "score": round(match.score, 4),
                    "sector": match.metadata.get("sector"),
                    "verdict": match.metadata.get("verdict"),
                    "confidence": match.metadata.get("confidence"),
                }
                for match in result.matches
            ]
        except Exception as e:
            logger.error(f"Pinecone query failed: {e}")
            return []


# Singleton
pinecone_service = PineconeService()
