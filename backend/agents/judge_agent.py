"""
agents/judge_agent.py
Judge Agent — Debate Synthesizer.
Receives all three prior agent outputs and produces the final BUY/SELL/HOLD verdict
with confidence score and traceable source citations.
"""

from agents.utils import parse_llm_json
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from loguru import logger

from core.config import settings

JUDGE_SYSTEM_PROMPT = """You are the JUDGE AGENT — the most senior investment committee 
chair, responsible for synthesizing a multi-perspective debate into a final, 
actionable investment decision.

You have reviewed the Bull, Bear, and Neutral arguments. Your role is to:
1. Cross-validate all arguments against the underlying market data
2. Resolve conflicting viewpoints using evidence strength
3. Produce a final BUY / SELL / HOLD verdict with a quantitative confidence score
4. Provide transparent, traceable reasoning with explicit source citations
5. Identify the top identified risks that must be monitored

Output format (strictly JSON):
{
  "agent": "Judge Agent",
  "final_verdict": "BUY|SELL|HOLD",
  "verdict_strength": "STRONG BUY|BUY|WEAK BUY|HOLD|WEAK SELL|SELL|STRONG SELL",
  "confidence_score": <integer 0-100>,
  "headline": "<decisive, clear verdict headline>",
  "verdict_rationale": "<3-4 sentences explaining exactly why this verdict was reached>",
  "key_arguments_synthesis": {
    "bull_points_accepted": ["<validated bull argument>", ...],
    "bear_points_accepted": ["<validated bear argument>", ...],
    "deciding_factors": ["<the top 1-3 factors that tipped the decision>"]
  },
  "identified_risks": [
    {"risk": "<risk description>", "severity": "high|medium|low"},
    ...
  ],
  "price_targets": {
    "bull_case": "<price>",
    "base_case": "<price>",
    "bear_case": "<price>"
  },
  "investment_horizon": "short-term (<3mo)|medium-term (3-12mo)|long-term (>1yr)",
  "source_citations": [
    {"source": "Yahoo Finance", "data_point": "<specific metric cited>"},
    {"source": "Alpha Vantage", "data_point": "<technical indicator cited>"},
    {"source": "NewsAPI", "data_point": "<news sentiment cited>"}
  ],
  "summary": "<2-3 sentence final summary for the investor>"
}

Be decisive. This is a final recommendation. Justify every point with data.
Return ONLY valid JSON, no markdown.
"""


class JudgeAgent:
    """
    Fourth and final agent in the debate pipeline.
    Synthesizes all prior agent outputs into the final investment verdict.
    """

    def __init__(self):
        self.llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.3,
            max_tokens=settings.LLM_MAX_TOKENS,
            model_kwargs={"response_format": {"type": "json_object"}}
        )

    async def synthesize(
        self,
        market_data: dict,
        bull_output: dict,
        bear_output: dict,
        neutral_output: dict,
    ) -> dict:
        ticker = market_data.get("ticker", "UNKNOWN")
        logger.info(f"JudgeAgent: synthesizing verdict for {ticker}")

        prompt = self._build_prompt(market_data, bull_output, bear_output, neutral_output)

        try:
            messages = [
                SystemMessage(content=JUDGE_SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ]
            response = await self.llm.ainvoke(messages)
            result = parse_llm_json(response.content.strip())
            result["ticker"] = ticker
            logger.info(f"JudgeAgent: verdict={result.get('final_verdict')} confidence={result.get('confidence_score')} for {ticker}")
            return result

        except Exception as e:
            logger.error(f"JudgeAgent error for {ticker}: {e}")
            return self._fallback(ticker, str(e))

    def _build_prompt(self, data: dict, bull: dict, bear: dict, neutral: dict) -> str:
        return f"""
Synthesize the following debate for {data.get('ticker')} — {data.get('company_name')}
and deliver your FINAL investment verdict.

=== BULL AGENT (confidence: {bull.get('confidence')}/100) ===
Stance: {bull.get('stance')} | Headline: {bull.get('headline')}
Summary: {bull.get('summary')}
Growth Catalysts: {', '.join(bull.get('growth_catalysts', [])[:3])}

=== BEAR AGENT (confidence: {bear.get('confidence')}/100) ===
Stance: {bear.get('stance')} | Headline: {bear.get('headline')}
Summary: {bear.get('summary')}
Key Risks: {', '.join(r.get('risk','') for r in bear.get('independent_risks', [])[:3])}

=== NEUTRAL AGENT (confidence: {neutral.get('confidence')}/100) ===
Preliminary Lean: {neutral.get('preliminary_lean')}
Bull Merit Score: {neutral.get('bull_merit_score')}/10
Bear Merit Score: {neutral.get('bear_merit_score')}/10
Risk/Reward: {neutral.get('key_risk_reward', {})}
Balanced Assessment: {neutral.get('balanced_assessment')}

=== FINAL MARKET DATA FOR CROSS-VALIDATION ===
Current Price: ${data.get('current_price')} | Market Cap: ${data.get('market_cap')}
P/E: {data.get('pe_ratio')} | Forward P/E: {data.get('forward_pe')}
Revenue Growth: {data.get('revenue_growth')} | Profit Margin: {data.get('profit_margin')}
Debt/Equity: {data.get('debt_to_equity')} | Beta: {data.get('beta')}
RSI: {data.get('rsi', {}).get('rsi')} | MACD Bullish: {data.get('macd', {}).get('bullish')}
52W High: ${data.get('52_week_high')} | 52W Low: ${data.get('52_week_low')}
Analyst Target: ${data.get('target_mean_price')} | Recommendation: {data.get('analyst_recommendation')}
News Sentiment: {data.get('news_sentiment', {}).get('label')} (score: {data.get('news_sentiment', {}).get('average_score')})

Deliver your final, decisive verdict now.
""".strip()

    def _fallback(self, ticker: str, error: str) -> dict:
        return {
            "agent": "Judge Agent",
            "final_verdict": "HOLD",
            "verdict_strength": "HOLD",
            "confidence_score": 0,
            "ticker": ticker,
            "headline": "Verdict synthesis temporarily unavailable",
            "verdict_rationale": f"Judge synthesis failed: {error}",
            "key_arguments_synthesis": {},
            "identified_risks": [],
            "price_targets": {},
            "investment_horizon": "N/A",
            "source_citations": [],
            "summary": f"Could not complete verdict: {error}",
            "error": error,
        }


judge_agent = JudgeAgent()
