"""
standalone_demo.py
==================
Standalone demo of the Multi-Agent Stock Debate System.
Runs the complete debate pipeline WITHOUT PostgreSQL/Redis.
Demonstrates: Data Pipeline → Bull Agent → Bear Agent → Neutral Agent → Judge Agent

Usage:
    python standalone_demo.py AAPL
    python standalone_demo.py TSLA
"""

from __future__ import annotations

import sys
import os
import json
import asyncio
import time
from datetime import datetime
import contextvars
import functools

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Robust JSON loading patch for LLMs that return markdown blocks
_original_loads = json.loads
def robust_loads(s, *args, **kwargs):
    if isinstance(s, str):
        s = s.strip()
        if s.startswith("```"):
            lines = s.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            s = "\n".join(lines).strip()
    return _original_loads(s, *args, **kwargs)
json.loads = robust_loads

# Polyfill for asyncio.to_thread for Python 3.9.0b1
if not hasattr(asyncio, 'to_thread'):
    async def to_thread(func, /, *args, **kwargs):
        loop = asyncio.get_running_loop()
        ctx = contextvars.copy_context()
        func_call = functools.partial(ctx.run, func, *args, **kwargs)
        return await loop.run_in_executor(None, func_call)
    asyncio.to_thread = to_thread

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

# Load environment
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from core.config import settings

# ─── Pretty print helpers ───────────────────────────────────────────────────

COLORS = {
    "RESET": "\033[0m",
    "BOLD": "\033[1m",
    "GREEN": "\033[92m",
    "RED": "\033[91m",
    "YELLOW": "\033[93m",
    "BLUE": "\033[94m",
    "MAGENTA": "\033[95m",
    "CYAN": "\033[96m",
    "WHITE": "\033[97m",
    "DIM": "\033[2m",
}

def banner(text, color="CYAN"):
    c = COLORS.get(color, "")
    r = COLORS["RESET"]
    b = COLORS["BOLD"]
    print(f"\n{c}{b}{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}{r}\n")

def section(text, color="YELLOW"):
    c = COLORS.get(color, "")
    r = COLORS["RESET"]
    b = COLORS["BOLD"]
    print(f"\n{c}{b}── {text} ──{r}")

def status(text, state="info"):
    icons = {"ok": "✅", "fail": "❌", "info": "ℹ️ ", "wait": "⏳", "warn": "⚠️ "}
    print(f"  {icons.get(state, '•')} {text}")

def print_json_section(title, data, color="WHITE"):
    c = COLORS.get(color, "")
    r = COLORS["RESET"]
    print(f"\n{c}{COLORS['BOLD']}{title}:{r}")
    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, (list, dict)):
                print(f"  {COLORS['DIM']}{k}:{r}")
                if isinstance(v, list):
                    for item in v:
                        if isinstance(item, dict):
                            for ik, iv in item.items():
                                print(f"    {COLORS['DIM']}{ik}:{r} {iv}")
                            print()
                        else:
                            print(f"    • {item}")
                elif isinstance(v, dict):
                    for ik, iv in v.items():
                        print(f"    {COLORS['DIM']}{ik}:{r} {iv}")
            else:
                print(f"  {COLORS['DIM']}{k}:{r} {v}")
    else:
        print(f"  {data}")


# ─── Main demo ──────────────────────────────────────────────────────────────

async def run_demo(ticker: str):
    banner(f"MULTI-AGENT STOCK DEBATE SYSTEM", "CYAN")
    print(f"  Ticker:    {COLORS['BOLD']}{ticker}{COLORS['RESET']}")
    print(f"  Model:     {settings.GROQ_MODEL}")
    print(f"  Time:      {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Provider:  Groq Cloud API")

    # ─── STEP 1: Data Pipeline ──────────────────────────────────────────
    banner("STEP 1/5: DATA PIPELINE", "MAGENTA")
    status("Fetching market data from Yahoo Finance, Alpha Vantage, NewsAPI...", "wait")

    from data.pipeline import pipeline
    start = time.time()

    try:
        market_data = await pipeline.fetch_all(ticker)
        elapsed = time.time() - start
        status(f"Data collected in {elapsed:.1f}s", "ok")

        # Show key market data
        section("Market Overview")
        key_fields = [
            "company_name", "sector", "current_price", "market_cap",
            "pe_ratio", "forward_pe", "profit_margin", "revenue_growth",
            "fifty_two_week_high", "fifty_two_week_low",
            "analyst_target_mean_price", "recommendation_key"
        ]
        for field in key_fields:
            val = market_data.get(field)
            if val is not None:
                label = field.replace("_", " ").title()
                if isinstance(val, float) and "price" in field.lower():
                    print(f"  {COLORS['DIM']}{label}:{COLORS['RESET']} ${val:,.2f}")
                elif isinstance(val, float) and "cap" in field.lower():
                    print(f"  {COLORS['DIM']}{label}:{COLORS['RESET']} ${val/1e9:,.1f}B")
                elif isinstance(val, float):
                    print(f"  {COLORS['DIM']}{label}:{COLORS['RESET']} {val:.4f}")
                else:
                    print(f"  {COLORS['DIM']}{label}:{COLORS['RESET']} {val}")

        # Technical indicators
        section("Technical Indicators")
        tech_fields = ["rsi_14", "macd", "sma_50", "sma_200",
                       "rsi_signal", "golden_cross", "above_sma50", "above_sma200"]
        for field in tech_fields:
            val = market_data.get(field)
            if val is not None:
                label = field.replace("_", " ").upper()
                print(f"  {COLORS['DIM']}{label}:{COLORS['RESET']} {val}")

        # News sentiment
        section("News Sentiment")
        sentiment = market_data.get("news_sentiment", {})
        if sentiment:
            for k, v in sentiment.items():
                print(f"  {COLORS['DIM']}{k}:{COLORS['RESET']} {v}")

    except Exception as e:
        status(f"Data pipeline error: {e}", "fail")
        status("Continuing with minimal data...", "warn")
        market_data = {"ticker": ticker, "company_name": ticker, "error": str(e)}

    # ─── STEP 2: Bull Agent ─────────────────────────────────────────────
    banner("STEP 2/5: 🟢 BULL AGENT (Optimistic Analyst)", "GREEN")
    status("Generating bullish investment thesis...", "wait")

    from agents.bull_agent import bull_agent
    start = time.time()
    bull_result = await bull_agent.analyze(market_data)
    elapsed = time.time() - start
    status(f"Bull analysis complete in {elapsed:.1f}s", "ok")

    if bull_result.get("error"):
        status(f"Bull error: {bull_result['error']}", "fail")
    else:
        print(f"\n  {COLORS['GREEN']}{COLORS['BOLD']}📈 {bull_result.get('headline', 'N/A')}{COLORS['RESET']}")
        print(f"  {COLORS['DIM']}Confidence:{COLORS['RESET']} {bull_result.get('confidence', 'N/A')}%")
        print(f"  {COLORS['DIM']}Target Upside:{COLORS['RESET']} {bull_result.get('target_upside', 'N/A')}")

        if bull_result.get("key_arguments"):
            section("Key Bull Arguments", "GREEN")
            for i, arg in enumerate(bull_result["key_arguments"], 1):
                if isinstance(arg, dict):
                    print(f"  {i}. [{arg.get('impact','?').upper()}] {arg.get('point', 'N/A')}")
                    print(f"     Evidence: {arg.get('evidence', 'N/A')}")
                else:
                    print(f"  {i}. {arg}")

        if bull_result.get("growth_catalysts"):
            section("Growth Catalysts", "GREEN")
            for cat in bull_result["growth_catalysts"]:
                print(f"  🚀 {cat}")

        print(f"\n  {COLORS['DIM']}Summary:{COLORS['RESET']} {bull_result.get('summary', 'N/A')}")

    # ─── STEP 3: Bear Agent ─────────────────────────────────────────────
    banner("STEP 3/5: 🔴 BEAR AGENT (Risk Analyst)", "RED")
    status("Generating bearish counter-arguments...", "wait")

    from agents.bear_agent import bear_agent
    start = time.time()
    bear_result = await bear_agent.analyze(market_data, bull_result)
    elapsed = time.time() - start
    status(f"Bear analysis complete in {elapsed:.1f}s", "ok")

    if bear_result.get("error"):
        status(f"Bear error: {bear_result['error']}", "fail")
    else:
        print(f"\n  {COLORS['RED']}{COLORS['BOLD']}📉 {bear_result.get('headline', 'N/A')}{COLORS['RESET']}")
        print(f"  {COLORS['DIM']}Confidence:{COLORS['RESET']} {bear_result.get('confidence', 'N/A')}%")

        if bear_result.get("bull_rebuttals"):
            section("Bull Rebuttals", "RED")
            for i, reb in enumerate(bear_result["bull_rebuttals"], 1):
                if isinstance(reb, dict):
                    print(f"  {i}. [{reb.get('severity','?').upper()}] vs Bull: \"{reb.get('bull_point', 'N/A')}\"")
                    print(f"     Counter: {reb.get('counter', 'N/A')}")
                else:
                    print(f"  {i}. {reb}")

        if bear_result.get("independent_risks"):
            section("Independent Risks", "RED")
            for risk in bear_result["independent_risks"]:
                if isinstance(risk, dict):
                    print(f"  ⚠️  [{risk.get('probability','?').upper()}] {risk.get('risk', 'N/A')}")
                    print(f"     Evidence: {risk.get('evidence', 'N/A')}")
                else:
                    print(f"  ⚠️  {risk}")

        if bear_result.get("downside_scenarios"):
            section("Downside Scenarios", "RED")
            for sc in bear_result["downside_scenarios"]:
                print(f"  📉 {sc}")

        print(f"\n  {COLORS['DIM']}Summary:{COLORS['RESET']} {bear_result.get('summary', 'N/A')}")

    # ─── STEP 4: Neutral Agent ──────────────────────────────────────────
    banner("STEP 4/5: 🟣 NEUTRAL AGENT (Balanced Evaluator)", "MAGENTA")
    status("Evaluating both sides of the debate...", "wait")

    from agents.neutral_agent import neutral_agent
    start = time.time()
    neutral_result = await neutral_agent.analyze(market_data, bull_result, bear_result)
    elapsed = time.time() - start
    status(f"Neutral analysis complete in {elapsed:.1f}s", "ok")

    if neutral_result.get("error"):
        status(f"Neutral error: {neutral_result['error']}", "fail")
    else:
        print(f"\n  {COLORS['MAGENTA']}{COLORS['BOLD']}⚖️  {neutral_result.get('headline', 'N/A')}{COLORS['RESET']}")
        print(f"  {COLORS['DIM']}Bull Merit Score:{COLORS['RESET']} {neutral_result.get('bull_merit_score', 'N/A')}/10")
        print(f"  {COLORS['DIM']}Bear Merit Score:{COLORS['RESET']} {neutral_result.get('bear_merit_score', 'N/A')}/10")
        print(f"  {COLORS['DIM']}Preliminary Lean:{COLORS['RESET']} {neutral_result.get('preliminary_lean', 'N/A')}")
        print(f"  {COLORS['DIM']}Confidence:{COLORS['RESET']} {neutral_result.get('confidence', 'N/A')}%")

        rr = neutral_result.get("key_risk_reward", {})
        if rr:
            section("Risk/Reward Analysis", "MAGENTA")
            print(f"  Upside Potential: {rr.get('upside_potential_pct', 'N/A')}")
            print(f"  Downside Risk:    {rr.get('downside_risk_pct', 'N/A')}")
            print(f"  Risk/Reward:      {rr.get('risk_reward_ratio', 'N/A')}")

        if neutral_result.get("critical_watchpoints"):
            section("Critical Watchpoints", "MAGENTA")
            for wp in neutral_result["critical_watchpoints"]:
                print(f"  👁️  {wp}")

        print(f"\n  {COLORS['DIM']}Assessment:{COLORS['RESET']} {neutral_result.get('balanced_assessment', 'N/A')}")

    # ─── STEP 5: Judge Agent ────────────────────────────────────────────
    banner("STEP 5/5: 🔵 JUDGE AGENT (Final Verdict)", "BLUE")
    status("Synthesizing all arguments for final verdict...", "wait")

    from agents.judge_agent import judge_agent
    start = time.time()
    judge_result = await judge_agent.synthesize(
        market_data, bull_result, bear_result, neutral_result
    )
    elapsed = time.time() - start
    status(f"Judge verdict delivered in {elapsed:.1f}s", "ok")

    if judge_result.get("error"):
        status(f"Judge error: {judge_result['error']}", "fail")
    else:
        verdict = judge_result.get("final_verdict", "N/A")
        confidence = judge_result.get("confidence_score", 0)

        verdict_colors = {"BUY": "GREEN", "SELL": "RED", "HOLD": "YELLOW"}
        vc = COLORS.get(verdict_colors.get(verdict, "WHITE"), "")

        print(f"\n  {vc}{COLORS['BOLD']}{'='*50}")
        print(f"  🎯 FINAL VERDICT: {verdict}")
        print(f"  📊 Confidence:    {confidence}%")
        print(f"  💪 Strength:      {judge_result.get('verdict_strength', 'N/A')}")
        print(f"  {'='*50}{COLORS['RESET']}")

        print(f"\n  {COLORS['DIM']}Headline:{COLORS['RESET']} {judge_result.get('headline', 'N/A')}")
        print(f"  {COLORS['DIM']}Rationale:{COLORS['RESET']} {judge_result.get('verdict_rationale', 'N/A')}")
        print(f"  {COLORS['DIM']}Horizon:{COLORS['RESET']} {judge_result.get('investment_horizon', 'N/A')}")

        # Price targets
        pt = judge_result.get("price_targets", {})
        if pt:
            section("Price Targets", "BLUE")
            print(f"  🐂 Bull Case: {pt.get('bull_case', 'N/A')}")
            print(f"  📊 Base Case: {pt.get('base_case', 'N/A')}")
            print(f"  🐻 Bear Case: {pt.get('bear_case', 'N/A')}")

        # Key synthesis
        synth = judge_result.get("key_arguments_synthesis", {})
        if synth:
            if synth.get("deciding_factors"):
                section("Deciding Factors", "BLUE")
                for f in synth["deciding_factors"]:
                    print(f"  ★ {f}")

        # Risks
        if judge_result.get("identified_risks"):
            section("Identified Risks", "BLUE")
            for risk in judge_result["identified_risks"]:
                if isinstance(risk, dict):
                    print(f"  [{risk.get('severity','?').upper()}] {risk.get('risk', 'N/A')}")
                else:
                    print(f"  • {risk}")

    # ─── FINAL SUMMARY ──────────────────────────────────────────────────
    banner("DEBATE COMPLETE", "CYAN")
    print(f"  Ticker:     {COLORS['BOLD']}{ticker}{COLORS['RESET']}")
    if not judge_result.get("error"):
        vc = COLORS.get(verdict_colors.get(verdict, "WHITE"), "")
        print(f"  Verdict:    {vc}{COLORS['BOLD']}{verdict}{COLORS['RESET']}")
        print(f"  Confidence: {confidence}%")
    print(f"  Agents:     Bull ✅ → Bear ✅ → Neutral ✅ → Judge ✅")
    print(f"  Model:      {settings.GROQ_MODEL}")
    print()

    # Save results to file
    results = {
        "ticker": ticker,
        "timestamp": datetime.now().isoformat(),
        "model": settings.GROQ_MODEL,
        "market_data_summary": {
            k: market_data.get(k) for k in [
                "company_name", "sector", "current_price", "pe_ratio",
                "rsi_14", "sma_50", "sma_200"
            ] if market_data.get(k) is not None
        },
        "bull_analysis": bull_result,
        "bear_analysis": bear_result,
        "neutral_analysis": neutral_result,
        "judge_verdict": judge_result,
    }

    output_file = os.path.join(
        os.path.dirname(__file__),
        f"debate_result_{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)
    status(f"Full results saved to: {output_file}", "ok")


if __name__ == "__main__":
    ticker = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    ticker = ticker.upper().strip()
    print(f"\nStarting debate for {ticker}...")
    asyncio.run(run_demo(ticker))
