"""
agents/bear_agent.py
Bear Agent — Risk-Focused Analyst persona.
Receives Bull Agent output and generates counter-arguments.
Focuses on risks, overvaluation, macroeconomic headwinds.
"""

from agents.utils import parse_llm_json
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from loguru import logger

from core.config import settings

BEAR_SYSTEM_PROMPT = """You are the BEAR AGENT — a contrarian risk analyst specializing in 
identifying downside risks, overvaluation, and macroeconomic threats to stock investments.

You have received the Bull Agent's optimistic analysis. Your role is to:
1. Challenge and counter the bull's arguments with evidence
2. Identify risks the bull overlooked or downplayed
3. Make the strongest possible BEARISH case

Focus on:
- Valuation concerns (overpriced relative to growth, peers)
- Macroeconomic headwinds (rate sensitivity, inflation, recession risk)
- Business model weaknesses and competitive threats
- Debt levels, margin pressure, and cash burn
- Technical bearish signals (overbought, resistance levels)
- Regulatory, legal, or geopolitical risks
- News-driven downside risks

Output format (strictly JSON):
{
  "agent": "Bear Agent",
  "stance": "BEARISH",
  "headline": "<one bold headline summarizing the bear case>",
  "bull_rebuttals": [
    {"bull_point": "<the bull argument being challenged>", "counter": "<your counter-argument>", "severity": "high|medium|low"},
    ...
  ],
  "independent_risks": [
    {"risk": "<risk title>", "evidence": "<specific data>", "probability": "high|medium|low"},
    ...
  ],
  "downside_scenarios": ["<scenario 1>", "<scenario 2>", ...],
  "key_metrics_concern": {
    "valuation_risk": "<comment>",
    "debt_risk": "<comment>",
    "technical_risk": "<comment>"
  },
  "confidence": <number 1-100>,
  "summary": "<2-3 sentence bear case summary>"
}

Be specific. Always cite actual numbers from the data. Do not fabricate metrics.
Return ONLY valid JSON, no markdown.
"""


class BearAgent:
    """
    Second agent in the sequential debate pipeline.
    Receives Bull output and market data — generates bearish counter-arguments.
    """

    def __init__(self):
        self.llm = ChatGroq(
           model=settings.GROQ_MODEL,
           api_key=settings.GROQ_API_KEY,
           temperature=0.4,
           max_tokens=settings.LLM_MAX_TOKENS,
           model_kwargs={"response_format": {"type": "json_object"}}
        )

    async def analyze(self, market_data: dict, bull_output: dict) -> dict:
        """
        Run bear analysis, informed by the bull agent's output.
        """
        ticker = market_data.get("ticker", "UNKNOWN")
        logger.info(f"BearAgent: analyzing {ticker}")

        prompt = self._build_prompt(market_data, bull_output)

        try:
            messages = [
                SystemMessage(content=BEAR_SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ]
            response = await self.llm.ainvoke(messages)
            content = response.content.strip()

            result = parse_llm_json(content)
            result["ticker"] = ticker
            logger.info(f"BearAgent: completed for {ticker}")
            return result

        except Exception as e:
            logger.error(f"BearAgent error for {ticker}: {e}")
            return self._fallback(ticker, str(e))

    def _build_prompt(self, data: dict, bull: dict) -> str:
        bull_args = bull.get("key_arguments", [])
        bull_args_text = "\n".join(
            f"  - [{a.get('impact','').upper()}] {a.get('point')}: {a.get('evidence')}"
            for a in bull_args
        ) or "  No specific arguments provided."

        return f"""
The Bull Agent has made the following case for {data.get('ticker')}:

=== BULL AGENT HEADLINE ===
{bull.get('headline', 'N/A')}

=== BULL KEY ARGUMENTS ===
{bull_args_text}

=== BULL SUMMARY ===
{bull.get('summary', 'N/A')}

Now analyze the RISKS using all available market data below.
Challenge each bull argument and identify additional risks they missed.

=== MARKET DATA ===
Current Price: ${data.get('current_price')} | P/E: {data.get('pe_ratio')} | Forward P/E: {data.get('forward_pe')}
Valuation: {data.get('valuation_label', 'N/A')}
Revenue Growth: {data.get('revenue_growth')} | Earnings Growth: {data.get('earnings_growth')}
Debt/Equity: {data.get('debt_to_equity')} — Risk: {data.get('debt_risk', 'N/A')}
Current Ratio: {data.get('current_ratio')}
Beta: {data.get('beta')} | 52W High: ${data.get('52_week_high')} | 52W Low: ${data.get('52_week_low')}
RSI: {data.get('rsi', {}).get('rsi')} — {data.get('rsi_signal', 'N/A')}
MACD Bullish: {data.get('macd', {}).get('bullish')}
News Sentiment: {data.get('news_sentiment', {}).get('label')} (score: {data.get('news_sentiment', {}).get('average_score')})

Recent Headlines:
{self._format_news(data.get('news_articles', []))}

Make the strongest possible BEARISH case. Challenge every bull point.
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
            "agent": "Bear Agent",
            "stance": "BEARISH",
            "ticker": ticker,
            "headline": "Risk analysis temporarily unavailable",
            "bull_rebuttals": [],
            "independent_risks": [],
            "downside_scenarios": [],
            "key_metrics_concern": {},
            "confidence": 0,
            "summary": f"Bear analysis could not be completed: {error}",
            "error": error,
        }


# Singleton
bear_agent = BearAgent()
