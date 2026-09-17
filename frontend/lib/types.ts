// lib/types.ts — Central TypeScript type definitions

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  risk_tolerance: "conservative" | "moderate" | "aggressive";
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ─── Agent Output Types ────────────────────────────────────────────────────

export interface AgentArgument {
  point: string;
  evidence: string;
  impact: "high" | "medium" | "low";
}

export interface BullOutput {
  agent: "Bull Agent";
  stance: "BULLISH";
  ticker: string;
  headline: string;
  key_arguments: AgentArgument[];
  growth_catalysts: string[];
  target_upside: string;
  key_metrics: Record<string, string | number>;
  confidence: number;
  summary: string;
  error?: string;
}

export interface BearRebuttal {
  bull_point: string;
  counter: string;
  severity: "high" | "medium" | "low";
}

export interface BearRisk {
  risk: string;
  evidence: string;
  probability: "high" | "medium" | "low";
}

export interface BearOutput {
  agent: "Bear Agent";
  stance: "BEARISH";
  ticker: string;
  headline: string;
  bull_rebuttals: BearRebuttal[];
  independent_risks: BearRisk[];
  downside_scenarios: string[];
  key_metrics_concern: Record<string, string>;
  confidence: number;
  summary: string;
  error?: string;
}

export interface NeutralOutput {
  agent: "Neutral Agent";
  stance: "NEUTRAL";
  ticker: string;
  headline: string;
  bull_merit_score: number;
  bear_merit_score: number;
  strongest_bull_points: string[];
  strongest_bear_points: string[];
  key_risk_reward: {
    upside_potential_pct: string;
    downside_risk_pct: string;
    risk_reward_ratio: string;
  };
  critical_watchpoints: string[];
  balanced_assessment: string;
  preliminary_lean: "BUY" | "SELL" | "HOLD";
  confidence: number;
  summary: string;
  error?: string;
}

export interface SourceCitation {
  source: string;
  data_point: string;
}

export interface IdentifiedRisk {
  risk: string;
  severity: "high" | "medium" | "low";
}

export interface JudgeOutput {
  agent: "Judge Agent";
  final_verdict: "BUY" | "SELL" | "HOLD";
  verdict_strength: string;
  confidence_score: number;
  ticker: string;
  headline: string;
  verdict_rationale: string;
  key_arguments_synthesis: {
    bull_points_accepted: string[];
    bear_points_accepted: string[];
    deciding_factors: string[];
  };
  identified_risks: IdentifiedRisk[];
  price_targets: {
    bull_case: string;
    base_case: string;
    bear_case: string;
  };
  investment_horizon: string;
  source_citations: SourceCitation[];
  summary: string;
  error?: string;
}

// ─── Debate ───────────────────────────────────────────────────────────────

export type DebateStatus = "pending" | "running" | "completed" | "failed";

export interface DebateSession {
  debate_id: string;
  ticker: string;
  status: DebateStatus;
  verdict?: "BUY" | "SELL" | "HOLD";
  confidence_score?: number;
  bull_argument?: BullOutput;
  bear_argument?: BearOutput;
  neutral_argument?: NeutralOutput;
  judge_verdict?: JudgeOutput;
  market_data_snapshot?: Record<string, string | number | boolean | null>;
}

export interface DebateStep {
  type: "step_update" | "ping" | "error";
  step: string;
  status: "running" | "done" | "failed";
  message: string;
  data?: BullOutput | BearOutput | NeutralOutput | JudgeOutput | Record<string, unknown>;
}

// ─── Portfolio ────────────────────────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  ticker: string;
  company_name?: string;
  sector?: string;
  shares?: number;
  avg_buy_price?: number;
  is_watchlist: boolean;
  is_paper_trade: boolean;
  added_at: string;
}

// ─── Picks ────────────────────────────────────────────────────────────────

export interface StockPick {
  ticker: string;
  company_name: string;
  sector: string;
  current_price?: number;
  pe_ratio?: number;
  revenue_growth?: number;
  analyst_recommendation?: string;
  dividend_yield?: number;
  composite_score: number;
  score_breakdown: Record<string, number | string | null>;
}

// ─── Market Data ──────────────────────────────────────────────────────────

export interface MarketData {
  ticker: string;
  company_name: string;
  sector: string;
  current_price?: number;
  market_cap?: number;
  pe_ratio?: number;
  revenue_growth?: number;
  news_sentiment?: {
    average_score: number;
    label: "positive" | "negative" | "neutral";
    article_count: number;
  };
}
