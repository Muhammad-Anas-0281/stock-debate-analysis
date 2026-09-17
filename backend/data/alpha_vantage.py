"""
data/alpha_vantage.py
Fetches technical indicators and financial statements from Alpha Vantage API.
"""

from typing import Optional
import httpx
from loguru import logger

from core.config import settings


class AlphaVantageFetcher:
    """
    Client for Alpha Vantage financial data API.
    Provides technical indicators (RSI, MACD, SMA) and income statements.
    """

    BASE_URL = settings.ALPHA_VANTAGE_BASE_URL
    API_KEY = settings.ALPHA_VANTAGE_API_KEY
    TIMEOUT = 15.0

    async def _fetch(self, params: dict) -> dict:
        params["apikey"] = self.API_KEY
        async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
            response = await client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            return response.json()

    async def get_rsi(self, ticker: str, interval: str = "daily", time_period: int = 14) -> dict:
        """Relative Strength Index."""
        try:
            data = await self._fetch({
                "function": "RSI",
                "symbol": ticker.upper(),
                "interval": interval,
                "time_period": time_period,
                "series_type": "close",
            })
            rsi_data = data.get("Technical Analysis: RSI", {})
            latest_date = next(iter(rsi_data), None)
            if latest_date:
                return {
                    "rsi": float(rsi_data[latest_date]["RSI"]),
                    "date": latest_date,
                    "interpretation": self._interpret_rsi(float(rsi_data[latest_date]["RSI"])),
                }
            return {}
        except Exception as e:
            logger.warning(f"RSI fetch failed for {ticker}: {e}")
            return {}

    async def get_macd(self, ticker: str, interval: str = "daily") -> dict:
        """Moving Average Convergence Divergence."""
        try:
            data = await self._fetch({
                "function": "MACD",
                "symbol": ticker.upper(),
                "interval": interval,
                "series_type": "close",
            })
            macd_data = data.get("Technical Analysis: MACD", {})
            latest_date = next(iter(macd_data), None)
            if latest_date:
                entry = macd_data[latest_date]
                return {
                    "macd": float(entry["MACD"]),
                    "signal": float(entry["MACD_Signal"]),
                    "histogram": float(entry["MACD_Hist"]),
                    "date": latest_date,
                    "bullish": float(entry["MACD_Hist"]) > 0,
                }
            return {}
        except Exception as e:
            logger.warning(f"MACD fetch failed for {ticker}: {e}")
            return {}

    async def get_sma(self, ticker: str, period: int = 50, interval: str = "daily") -> dict:
        """Simple Moving Average."""
        try:
            data = await self._fetch({
                "function": "SMA",
                "symbol": ticker.upper(),
                "interval": interval,
                "time_period": period,
                "series_type": "close",
            })
            sma_data = data.get("Technical Analysis: SMA", {})
            latest_date = next(iter(sma_data), None)
            if latest_date:
                return {
                    "sma": float(sma_data[latest_date]["SMA"]),
                    "period": period,
                    "date": latest_date,
                }
            return {}
        except Exception as e:
            logger.warning(f"SMA fetch failed for {ticker}: {e}")
            return {}

    async def get_income_statement(self, ticker: str) -> dict:
        """Annual income statement (revenue, net income, etc.)."""
        try:
            data = await self._fetch({
                "function": "INCOME_STATEMENT",
                "symbol": ticker.upper(),
            })
            reports = data.get("annualReports", [])
            if not reports:
                return {}
            latest = reports[0]
            prev = reports[1] if len(reports) > 1 else {}
            revenue = int(latest.get("totalRevenue", 0) or 0)
            prev_revenue = int(prev.get("totalRevenue", 0) or 0)
            net_income = int(latest.get("netIncome", 0) or 0)
            return {
                "fiscal_year": latest.get("fiscalDateEnding"),
                "total_revenue": revenue,
                "net_income": net_income,
                "gross_profit": int(latest.get("grossProfit", 0) or 0),
                "operating_income": int(latest.get("operatingIncome", 0) or 0),
                "revenue_yoy_growth": round((revenue - prev_revenue) / prev_revenue * 100, 2)
                if prev_revenue else None,
            }
        except Exception as e:
            logger.warning(f"Income statement fetch failed for {ticker}: {e}")
            return {}

    async def get_all_indicators(self, ticker: str) -> dict:
        """Fetch RSI, MACD, SMA(50), SMA(200) concurrently."""
        import asyncio
        rsi, macd, sma50, sma200 = await asyncio.gather(
            self.get_rsi(ticker),
            self.get_macd(ticker),
            self.get_sma(ticker, 50),
            self.get_sma(ticker, 200),
            return_exceptions=True,
        )
        return {
            "rsi": rsi if not isinstance(rsi, Exception) else {},
            "macd": macd if not isinstance(macd, Exception) else {},
            "sma_50": sma50 if not isinstance(sma50, Exception) else {},
            "sma_200": sma200 if not isinstance(sma200, Exception) else {},
        }

    @staticmethod
    def _interpret_rsi(rsi_value: float) -> str:
        if rsi_value >= 70:
            return "overbought"
        elif rsi_value <= 30:
            return "oversold"
        else:
            return "neutral"


# Singleton
alpha_vantage_fetcher = AlphaVantageFetcher()
