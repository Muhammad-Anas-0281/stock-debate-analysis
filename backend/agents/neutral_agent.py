"""
agents/neutral_agent.py
Neutral Agent — Balanced Analyst persona.
Receives both Bull and Bear outputs and provides an objective risk/reward evaluation.
"""

from agents.utils import parse_llm_json
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from loguru import logger

from core.config import settings

NEUTRAL_SYSTEM_PROMPT = """You are the NEUTRAL AGENT — a senior portfolio strategist 
with a mandate to provide completely objective, data-driven analysis.

You have reviewed both the Bull and Bear arguments. Your role is to:
1. Weigh the merit of each side's arguments based purely on data strength
2. Identify the most critical factors that should determine the decision
3. Provide a balanced risk/reward assessment
4. Highlight what scenarios would validate bull vs bear thesis

Focus on:
- Historical context and sector/industry comparisons
- Dividend sustainability and total return perspective
- Realistic probability of upside vs downside scenarios
- Key inflection points to watch (earnings, product launches, macro events)
- Risk-adjusted return perspective
- What the data objectively supports

Output format (strictly JSON):
{
  "agent": "Neutral Agent",
  "stance": "NEUTRAL",
  "headline": "<one objective headline>",
  "bull_merit_score": <1-10, how strong is the bull case>,
  "bear_merit_score": <1-10, how strong is the bear case>,
  "strongest_bull_points": ["<validated bull argument>", ...],
  "strongest_bear_points": ["<validated bear argument>", ...],
  "key_risk_reward": {
    "upside_potential_pct": "<estimated %>",
    "downside_risk_pct": "<estimated %>",
    "risk_reward_ratio": "<e.g. 2:1 favorable>"
  },
  "critical_watchpoints": ["<event or metric to monitor>", ...],
  "balanced_assessment": "<3-4 sentence balanced view>",
  "preliminary_lean": "BUY|SELL|HOLD",
  "confidence": <number 1-100>,
  "summary": "<2-3 sentence neutral summary>"
}

Be objective. Cite specific data. Do not fabricate metrics.
Return ONLY valid JSON, no markdown.
"""


class NeutralAgent:
    """
    Third agent in the sequential debate pipeline.
    Evaluates both Bull and Bear arguments from a balanced perspective.
    """

    def __init__(self):
        self.llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.4,
            max_tokens=settings.LLM_MAX_TOKENS,
            model_kwargs={"response_format": {"type": "json_object"}}
        )

    async def analyze(self, market_data: dict, bull_output: dict, bear_output: dict) -> dict:
        ticker = market_data.get("ticker", "UNKNOWN")
        logger.info(f"NeutralAgent: analyzing {ticker}")

        prompt = self._build_prompt(market_data, bull_output, bear_output)

        try:
            messages = [
                SystemMessage(content=NEUTRAL_SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ]
            response = await self.llm.ainvoke(messages)
            result = parse_llm_json(response.content.strip())
            result["ticker"] = ticker
            logger.info(f"NeutralAgent: completed for {ticker}")
            return result

        except Exception as e:
            logger.error(f"NeutralAgent error for {ticker}: {e}")
            return self._fallback(ticker, str(e))

    def _build_prompt(self, data: dict, bull: dict, bear: dict) -> str:
        def fmt_args(args, key="point"):
            return "\n".join(f"  • {a.get(key, a.get('risk', 'N/A'))}: {a.get('evidence', a.get('counter', ''))}" for a in args[:4]) or "  None"

        return f"""
You are evaluating the debate for {data.get('ticker')} — {data.get('company_name')}.

=== BULL CASE (confidence: {bull.get('confidence')}/100) ===
Headline: {bull.get('headline')}
Arguments:
{fmt_args(bull.get('key_arguments', []))}
Summary: {bull.get('summary')}

=== BEAR CASE (confidence: {bear.get('confidence')}/100) ===
Headline: {bear.get('headline')}
Key Risks:
{fmt_args(bear.get('independent_risks', []), key='risk')}
Summary: {bear.get('summary')}

=== OBJECTIVE MARKET DATA ===
Price: ${data.get('current_price')} | 52W Range: ${data.get('52_week_low')} – ${data.get('52_week_high')}
P/E: {data.get('pe_ratio')} | Forward P/E: {data.get('forward_pe')} | Valuation: {data.get('valuation_label')}
Revenue Growth: {data.get('revenue_growth')} | Profit Margin: {data.get('profit_margin')}
ROE: {data.get('return_on_equity')} | Free Cash Flow: ${data.get('free_cash_flow')}
Debt Risk: {data.get('debt_risk')} | Beta: {data.get('beta')}
RSI: {data.get('rsi', {}).get('rsi')} ({data.get('rsi_signal')})
News Sentiment: {data.get('news_sentiment', {}).get('label')} ({data.get('news_sentiment', {}).get('average_score')})
Dividend Yield: {data.get('dividend_yield')}
Analyst Target: ${data.get('target_mean_price')} | Recommendation: {data.get('analyst_recommendation')}

Weigh both sides objectively and provide your balanced assessment.
""".strip()

    def _fallback(self, ticker: str, error: str) -> dict:
        return {
            "agent": "Neutral Agent",
            "stance": "NEUTRAL",
            "ticker": ticker,
            "headline": "Balanced analysis temporarily unavailable",
            "bull_merit_score": 0,
            "bear_merit_score": 0,
            "strongest_bull_points": [],
            "strongest_bear_points": [],
            "key_risk_reward": {},
            "critical_watchpoints": [],
            "balanced_assessment": f"Neutral analysis could not be completed: {error}",
            "preliminary_lean": "HOLD",
            "confidence": 0,
            "summary": f"Neutral analysis failed: {error}",
            "error": error,
        }


neutral_agent = NeutralAgent()
