"""
agents/bull_agent.py
Bull Agent — Optimistic Investor persona.
Focuses on growth drivers, positive trends, and upside potential.
"""

from typing import Any
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from loguru import logger

from core.config import settings

BULL_SYSTEM_PROMPT = """You are the BULL AGENT — an optimistic equity research analyst 
with deep expertise in identifying growth opportunities and market catalysts.

Your role is to make the strongest possible BULLISH case for a stock based on the data provided.

Focus on:
- Revenue growth trajectory and market share expansion
- Product pipeline, innovation, and competitive moats
- Favorable industry tailwinds and secular growth themes
- Strong balance sheet strengths and cash generation
- Positive technical momentum signals
- Undervalued aspects relative to growth potential
- Analyst upgrades and positive sentiment signals

Output format (strictly JSON):
{
  "agent": "Bull Agent",
  "stance": "BULLISH",
  "headline": "<one bold headline summarizing the bull case>",
  "key_arguments": [
    {"point": "<argument title>", "evidence": "<specific data point or metric>", "impact": "high|medium|low"},
    ...
  ],
  "growth_catalysts": ["<catalyst 1>", "<catalyst 2>", ...],
  "target_upside": "<estimated upside % based on fundamentals>",
  "key_metrics": {
    "revenue_growth": "<value>",
    "pe_ratio": "<value>",
    "analyst_recommendation": "<value>"
  },
  "confidence": <number 1-100>,
  "summary": "<2-3 sentence bull case summary>"
}

Be specific. Always cite actual numbers from the data. Do not fabricate metrics.
Return ONLY valid JSON, no markdown.
"""


class BullAgent:
    """
    First agent in the sequential debate pipeline.
    Analyzes market data from an optimistic growth perspective.
    """

    def __init__(self):
        self.llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.4,
            max_tokens=settings.LLM_MAX_TOKENS,
            model_kwargs={"response_format": {"type": "json_object"}}
        )

    async def analyze(self, market_data: dict) -> dict:
        """
        Run bull analysis on the enriched market data.
        Returns structured bull argument dict.
        """
        ticker = market_data.get("ticker", "UNKNOWN")
        logger.info(f"BullAgent: analyzing {ticker}")

        prompt = self._build_prompt(market_data)

        try:
            messages = [
                SystemMessage(content=BULL_SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ]
            response = await self.llm.ainvoke(messages)
            content = response.content.strip()

            # Parse JSON response
            from agents.utils import parse_llm_json
            result = parse_llm_json(content)
            result["ticker"] = ticker
            logger.info(f"BullAgent: completed for {ticker}")
            return result

        except Exception as e:
            logger.error(f"BullAgent error for {ticker}: {e}")
            return self._fallback(ticker, str(e))

    def _build_prompt(self, data: dict) -> str:
        return f"""
Analyze this stock and provide your BULLISH investment thesis.

=== STOCK DATA ===
Ticker: {data.get('ticker')}
Company: {data.get('company_name')}
Sector: {data.get('sector')} | Industry: {data.get('industry')}
Description: {data.get('description', '')[:300]}

=== PRICE & VALUATION ===
Current Price: ${data.get('current_price')}
52-Week High: ${data.get('52_week_high')} | 52-Week Low: ${data.get('52_week_low')}
Market Cap: ${data.get('market_cap')}
P/E Ratio: {data.get('pe_ratio')} | Forward P/E: {data.get('forward_pe')}
P/B Ratio: {data.get('pb_ratio')} | EPS: ${data.get('eps')}
Target Mean Price: ${data.get('target_mean_price')}
Analyst Recommendation: {data.get('analyst_recommendation')}
Valuation Context: {data.get('valuation_label', 'N/A')}

=== FUNDAMENTALS ===
Revenue Growth (YoY): {data.get('revenue_growth')}
Earnings Growth: {data.get('earnings_growth')}
Profit Margin: {data.get('profit_margin')}
Gross Margin: {data.get('gross_margins')}
Operating Margin: {data.get('operating_margins')}
Return on Equity: {data.get('return_on_equity')}
Free Cash Flow: ${data.get('free_cash_flow')}
Dividend Yield: {data.get('dividend_yield')}

=== TECHNICAL INDICATORS ===
RSI: {data.get('rsi', {}).get('rsi')} — {data.get('rsi_signal', 'N/A')}
MACD Histogram: {data.get('macd', {}).get('histogram')} | Bullish: {data.get('macd', {}).get('bullish')}
SMA 50: ${data.get('sma_50', {}).get('sma')} | Price Above: {data.get('above_sma50')}
SMA 200: ${data.get('sma_200', {}).get('sma')} | Golden Cross: {data.get('golden_cross')}

=== DEBT & RISK ===
Debt/Equity: {data.get('debt_to_equity')} — {data.get('debt_risk', 'N/A')}
Current Ratio: {data.get('current_ratio')}
Beta: {data.get('beta')}

=== NEWS SENTIMENT ===
Aggregate Score: {data.get('news_sentiment', {}).get('average_score')} ({data.get('news_sentiment', {}).get('label')})
Recent Headlines:
{self._format_news(data.get('news_articles', []))}

Build the strongest possible bullish case from this data.
""".strip()

    def _format_news(self, articles: list) -> str:
        if not articles:
            return "  No recent news available."
        return "\n".join(
            f"  - [{a.get('source', 'N/A')}] {a.get('title', '')[:120]} "
            f"(sentiment: {a.get('sentiment', {}).get('label', 'N/A')})"
            for a in articles[:5]
        )

    def _fallback(self, ticker: str, error: str) -> dict:
        return {
            "agent": "Bull Agent",
            "stance": "BULLISH",
            "ticker": ticker,
            "headline": "Analysis temporarily unavailable",
            "key_arguments": [],
            "growth_catalysts": [],
            "target_upside": "N/A",
            "key_metrics": {},
            "confidence": 0,
            "summary": f"Bull analysis could not be completed: {error}",
            "error": error,
        }


# Singleton
bull_agent = BullAgent()
