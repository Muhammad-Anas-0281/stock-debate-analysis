"""
data/pipeline.py
ETL pipeline: Fetch → Clean → Enrich → Return structured context for agents.
"""

import asyncio
from typing import Optional
from loguru import logger

from data.yahoo_finance import yahoo_fetcher
from data.alpha_vantage import alpha_vantage_fetcher
from data.news_api import news_fetcher


class DataPipeline:
    """
    Orchestrates data fetching from all sources and returns
    a unified, enriched context dict ready for agent consumption.
    """

    async def fetch_all(self, ticker: str) -> dict:
        """
        Fetch data from Yahoo Finance, Alpha Vantage, and NewsAPI concurrently.
        Returns a single enriched dict.
        """
        ticker = ticker.upper().strip()
        logger.info(f"DataPipeline: fetching all data for {ticker}")

        # Step 1: Fetch concurrently
        results = await asyncio.gather(
            self._fetch_yahoo(ticker),
            self._fetch_technicals(ticker),
            self._fetch_news(ticker),
            return_exceptions=True,
        )

        yahoo_data, tech_data, news_data = results

        # Step 2: Handle exceptions gracefully
        if isinstance(yahoo_data, Exception):
            logger.error(f"Yahoo Finance failed: {yahoo_data}")
            yahoo_data = {}
        if isinstance(tech_data, Exception):
            logger.error(f"Alpha Vantage failed: {tech_data}")
            tech_data = {}
        if isinstance(news_data, Exception):
            logger.error(f"NewsAPI failed: {news_data}")
            news_data = {}

        # Step 3: Clean & normalize
        cleaned = self._clean(yahoo_data, tech_data, news_data)

        # Step 4: Enrich with derived signals
        enriched = self._enrich(cleaned)

        logger.info(f"DataPipeline: completed for {ticker}")
        return enriched

    async def _fetch_yahoo(self, ticker: str) -> dict:
        """Run sync yfinance in thread pool."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, yahoo_fetcher.get_stock_info, ticker)

    async def _fetch_technicals(self, ticker: str) -> dict:
        return await alpha_vantage_fetcher.get_all_indicators(ticker)

    async def _fetch_news(self, ticker: str) -> dict:
        return await news_fetcher.get_company_news(ticker, days_back=7)

    def _clean(self, yahoo: dict, tech: dict, news: dict) -> dict:
        """Merge and normalize all data sources."""
        return {
            # Basic info
            "ticker": yahoo.get("ticker", "UNKNOWN"),
            "company_name": yahoo.get("company_name", "Unknown Company"),
            "sector": yahoo.get("sector", "Unknown"),
            "industry": yahoo.get("industry", "Unknown"),
            "description": yahoo.get("description", ""),

            # Price data
            "current_price": yahoo.get("current_price"),
            "previous_close": yahoo.get("previous_close"),
            "market_cap": yahoo.get("market_cap"),
            "52_week_high": yahoo.get("52_week_high"),
            "52_week_low": yahoo.get("52_week_low"),
            "avg_volume": yahoo.get("avg_volume"),

            # Valuation
            "pe_ratio": yahoo.get("pe_ratio"),
            "forward_pe": yahoo.get("forward_pe"),
            "pb_ratio": yahoo.get("pb_ratio"),
            "ps_ratio": yahoo.get("ps_ratio"),
            "eps": yahoo.get("eps"),
            "target_mean_price": yahoo.get("target_mean_price"),
            "analyst_recommendation": yahoo.get("analyst_recommendation"),

            # Fundamentals
            "revenue_growth": yahoo.get("revenue_growth"),
            "earnings_growth": yahoo.get("earnings_growth"),
            "profit_margin": yahoo.get("profit_margin"),
            "debt_to_equity": yahoo.get("debt_to_equity"),
            "current_ratio": yahoo.get("current_ratio"),
            "free_cash_flow": yahoo.get("free_cash_flow"),
            "return_on_equity": yahoo.get("return_on_equity"),
            "gross_margins": yahoo.get("gross_margins"),
            "operating_margins": yahoo.get("operating_margins"),
            "dividend_yield": yahoo.get("dividend_yield"),
            "beta": yahoo.get("beta"),

            # Technical indicators
            "rsi": tech.get("rsi", {}),
            "macd": tech.get("macd", {}),
            "sma_50": tech.get("sma_50", {}),
            "sma_200": tech.get("sma_200", {}),

            # News & sentiment
            "news_articles": news.get("articles", [])[:5],  # top 5
            "news_sentiment": news.get("aggregate_sentiment", {}),
        }

    def _enrich(self, data: dict) -> dict:
        """Add derived signals to help agents reason better."""
        enriched = dict(data)

        # Price vs moving averages
        price = data.get("current_price")
        sma50 = data.get("sma_50", {}).get("sma")
        sma200 = data.get("sma_200", {}).get("sma")

        if price and sma50:
            enriched["above_sma50"] = price > sma50
            enriched["pct_from_sma50"] = round((price - sma50) / sma50 * 100, 2)
        if price and sma200:
            enriched["above_sma200"] = price > sma200
            enriched["golden_cross"] = sma50 > sma200 if (sma50 and sma200) else None

        # RSI signal
        rsi_val = data.get("rsi", {}).get("rsi")
        if rsi_val:
            if rsi_val >= 70:
                enriched["rsi_signal"] = "overbought — potential reversal risk"
            elif rsi_val <= 30:
                enriched["rsi_signal"] = "oversold — potential bounce opportunity"
            else:
                enriched["rsi_signal"] = "neutral momentum"

        # Valuation context
        pe = data.get("pe_ratio")
        if pe:
            if pe > 40:
                enriched["valuation_label"] = "richly valued (high growth expectations)"
            elif pe > 20:
                enriched["valuation_label"] = "fairly valued"
            elif pe > 0:
                enriched["valuation_label"] = "value territory"
            else:
                enriched["valuation_label"] = "negative earnings"

        # Debt risk
        de = data.get("debt_to_equity")
        if de is not None:
            enriched["debt_risk"] = "high" if de > 2 else "moderate" if de > 1 else "low"

        return enriched


# Singleton
pipeline = DataPipeline()
