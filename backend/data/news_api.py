"""
data/news_api.py
Fetches recent market news and computes simple sentiment scores.
"""

from typing import Optional
import httpx
from loguru import logger
from datetime import datetime, timedelta, timezone

from core.config import settings


# Simple keyword-based sentiment scorer
POSITIVE_KEYWORDS = [
    "surge", "rally", "growth", "beat", "record", "profit", "expansion",
    "upgrade", "strong", "bullish", "gains", "innovation", "partnership",
    "acquisition", "revenue", "exceed", "outperform", "positive",
]
NEGATIVE_KEYWORDS = [
    "decline", "fall", "loss", "miss", "layoff", "lawsuit", "investigation",
    "downgrade", "bearish", "sell-off", "debt", "warning", "risk", "crash",
    "bankruptcy", "fraud", "cut", "shortfall", "underperform", "negative",
]


def compute_sentiment(text: str) -> dict:
    """
    Simple lexicon-based sentiment score.
    Returns score in [-1, 1] and label.
    """
    text_lower = text.lower()
    pos = sum(1 for kw in POSITIVE_KEYWORDS if kw in text_lower)
    neg = sum(1 for kw in NEGATIVE_KEYWORDS if kw in text_lower)
    total = pos + neg
    if total == 0:
        return {"score": 0.0, "label": "neutral", "positive": 0, "negative": 0}
    score = (pos - neg) / total
    label = "positive" if score > 0.1 else "negative" if score < -0.1 else "neutral"
    return {"score": round(score, 3), "label": label, "positive": pos, "negative": neg}


class NewsApiFetcher:
    """Client for NewsAPI — fetches recent articles mentioning a stock ticker."""

    BASE_URL = settings.NEWS_API_BASE_URL
    API_KEY = settings.NEWS_API_KEY
    TIMEOUT = 10.0

    async def get_company_news(
        self,
        ticker: str,
        company_name: Optional[str] = None,
        days_back: int = 7,
        max_articles: int = 10,
    ) -> dict:
        """
        Fetch recent news articles for a stock ticker/company.
        Returns articles with sentiment scores and aggregate sentiment.
        """
        query = company_name or ticker
        from_date = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime(
            "%Y-%m-%d"
        )

        params = {
            "q": f'"{query}" OR "{ticker}"',
            "from": from_date,
            "sortBy": "relevancy",
            "language": "en",
            "pageSize": max_articles,
            "apiKey": self.API_KEY,
        }

        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                resp = await client.get(f"{self.BASE_URL}/everything", params=params)
                resp.raise_for_status()
                data = resp.json()

            articles = data.get("articles", [])
            processed = []
            sentiments = []

            for art in articles[:max_articles]:
                title = art.get("title") or ""
                description = art.get("description") or ""
                combined_text = f"{title} {description}"
                sentiment = compute_sentiment(combined_text)
                sentiments.append(sentiment["score"])

                processed.append({
                    "title": title[:200],
                    "description": description[:400],
                    "source": art.get("source", {}).get("name", "Unknown"),
                    "published_at": art.get("publishedAt"),
                    "url": art.get("url"),
                    "sentiment": sentiment,
                })

            # Aggregate sentiment
            avg_score = round(sum(sentiments) / len(sentiments), 3) if sentiments else 0
            aggregate = {
                "average_score": avg_score,
                "label": "positive" if avg_score > 0.1 else "negative" if avg_score < -0.1 else "neutral",
                "article_count": len(processed),
            }

            return {
                "ticker": ticker.upper(),
                "articles": processed,
                "aggregate_sentiment": aggregate,
                "query_period_days": days_back,
            }

        except Exception as e:
            logger.warning(f"NewsAPI fetch failed for {ticker}: {e}")
            return {
                "ticker": ticker.upper(),
                "articles": [],
                "aggregate_sentiment": {"average_score": 0, "label": "neutral", "article_count": 0},
                "error": str(e),
            }


# Singleton
news_fetcher = NewsApiFetcher()
