"""
data/yahoo_finance.py
Fetches real-time and historical market data using yfinance.
"""

from __future__ import annotations

from typing import Optional
import requests
import yfinance as yf
import pandas as pd
from loguru import logger

# Bypass Yahoo Finance 429 rate limiting by using a browser User-Agent


class YahooFinanceFetcher:
    """
    Wraps yfinance to provide clean, structured market data
    for the debate agents.
    """

    def get_stock_info(self, ticker: str) -> dict:
        """
        Fetch comprehensive stock info including price, fundamentals.
        Returns a clean dict ready for agent consumption.
        """
        try:
            stock = yf.Ticker(ticker.upper())
            info = stock.info
            return {
                "ticker": ticker.upper(),
                "company_name": info.get("longName", ticker),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown"),
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "previous_close": info.get("previousClose"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "forward_pe": info.get("forwardPE"),
                "pb_ratio": info.get("priceToBook"),
                "ps_ratio": info.get("priceToSalesTrailing12Months"),
                "eps": info.get("trailingEps"),
                "dividend_yield": info.get("dividendYield"),
                "beta": info.get("beta"),
                "52_week_high": info.get("fiftyTwoWeekHigh"),
                "52_week_low": info.get("fiftyTwoWeekLow"),
                "avg_volume": info.get("averageVolume"),
                "revenue_growth": info.get("revenueGrowth"),
                "earnings_growth": info.get("earningsGrowth"),
                "profit_margin": info.get("profitMargins"),
                "debt_to_equity": info.get("debtToEquity"),
                "current_ratio": info.get("currentRatio"),
                "free_cash_flow": info.get("freeCashflow"),
                "return_on_equity": info.get("returnOnEquity"),
                "gross_margins": info.get("grossMargins"),
                "operating_margins": info.get("operatingMargins"),
                "analyst_recommendation": info.get("recommendationKey"),
                "target_mean_price": info.get("targetMeanPrice"),
                "description": (info.get("longBusinessSummary") or "")[:500],
            }
        except Exception as e:
            logger.error(f"YahooFinance error for {ticker}: {e}")
            return {"ticker": ticker.upper(), "error": str(e)}

    def get_historical_prices(
        self,
        ticker: str,
        period: str = "1y",
        interval: str = "1d",
    ) -> list[dict]:
        """
        Fetch OHLCV historical price data.
        period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y
        interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo
        """
        try:
            stock = yf.Ticker(ticker.upper())
            hist = stock.history(period=period, interval=interval)
            if hist.empty:
                return []
            hist.reset_index(inplace=True)
            records = []
            for _, row in hist.iterrows():
                records.append({
                    "date": str(row["Date"].date() if hasattr(row["Date"], "date") else row["Date"]),
                    "open": round(float(row["Open"]), 4),
                    "high": round(float(row["High"]), 4),
                    "low": round(float(row["Low"]), 4),
                    "close": round(float(row["Close"]), 4),
                    "volume": int(row["Volume"]),
                })
            return records
        except Exception as e:
            logger.error(f"Historical price error for {ticker}: {e}")
            return []

    def get_price_change(self, ticker: str) -> dict:
        """Return % change for 1d, 1w, 1m, 3m, 1y."""
        try:
            stock = yf.Ticker(ticker.upper())
            hist = stock.history(period="1y")
            if hist.empty:
                return {}
            current = hist["Close"].iloc[-1]
            changes = {}
            periods = {"1d": 1, "1w": 5, "1m": 21, "3m": 63, "1y": 252}
            for label, days in periods.items():
                if len(hist) > days:
                    past = hist["Close"].iloc[-days - 1]
                    changes[label] = round((current - past) / past * 100, 2)
            return changes
        except Exception as e:
            logger.error(f"Price change error for {ticker}: {e}")
            return {}


# Singleton instance
yahoo_fetcher = YahooFinanceFetcher()
