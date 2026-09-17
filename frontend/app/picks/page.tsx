"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Star, RefreshCw, TrendingUp, BarChart3, Target, Zap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { picksApi } from "@/lib/api";
import { StockPick } from "@/lib/types";

const SCORE_COLOR = (score: number) =>
  score >= 70 ? "var(--bull)" : score >= 50 ? "var(--judge)" : "var(--muted)";

const SCORE_LABEL = (score: number) =>
  score >= 75 ? "Strong Buy Signal" : score >= 60 ? "Moderate Signal" : "Weak Signal";

export default function PicksPage() {
  const router = useRouter();
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topN, setTopN] = useState(5);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { router.push("/auth/login"); return; }
    loadPicks();
  }, [router]);

  const loadPicks = async (n = topN) => {
    setRefreshing(true);
    try {
      const { data } = await picksApi.daily(n);
      setPicks(data.picks || []);
    } catch { toast.error("Failed to load picks"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const analyzePick = (ticker: string) => router.push(`/debate?ticker=${ticker}`);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={18} className="text-[var(--judge)]" />
              <span className="text-[var(--judge)] text-[12px] font-medium uppercase tracking-wider">AI Curated</span>
            </div>
            <h1 className="font-display font-800 text-3xl text-[var(--foreground)]">
              Daily <span className="text-[var(--accent)]">Picks</span>
            </h1>
            <p className="text-[var(--muted)] text-[14px] mt-1">
              Personalized stock recommendations based on your risk profile and market conditions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="input py-2 text-sm w-24"
              value={topN}
              onChange={(e) => { setTopN(Number(e.target.value)); loadPicks(Number(e.target.value)); }}
            >
              {[3, 5, 7, 10].map((n) => <option key={n} value={n}>Top {n}</option>)}
            </select>
            <button
              className="btn-ghost flex items-center gap-2 text-sm"
              onClick={() => loadPicks()}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="card p-4 mb-6 flex items-start gap-3 border-[var(--accent)]/20 bg-[var(--accent)]/5">
          <Zap size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[var(--muted)]">
            Picks are scored using a composite AI model combining revenue growth, analyst recommendations, valuation metrics, and market momentum.
            Click <strong className="text-[var(--foreground)]">Analyze</strong> to run a full multi-agent debate on any pick.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card p-6 h-28 shimmer" />
            ))}
          </div>
        ) : picks.length === 0 ? (
          <div className="card p-16 text-center">
            <Star size={32} className="text-[var(--muted)] mx-auto mb-4" />
            <h3 className="font-display font-700 text-lg mb-2">No picks available</h3>
            <p className="text-[var(--muted)] text-[14px]">Check back later or refresh to scan the market.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {picks.map((pick, idx) => (
              <div key={pick.ticker} className="card card-hover p-5 animate-fade-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                  {/* Rank + Ticker */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-[13px] bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)]">
                      #{idx + 1}
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                      <TrendingUp size={18} className="text-[var(--accent)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-[16px]">{pick.ticker}</span>
                        {pick.sector && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--card-border)] text-[var(--muted)]">
                            {pick.sector}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--muted)]">{pick.company_name}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 sm:gap-6">
                    {pick.current_price && (
                      <div>
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">Price</p>
                        <p className="font-mono font-medium text-[14px]">${pick.current_price.toFixed(2)}</p>
                      </div>
                    )}
                    {pick.pe_ratio && (
                      <div>
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">P/E</p>
                        <p className="font-mono font-medium text-[14px]">{pick.pe_ratio.toFixed(1)}x</p>
                      </div>
                    )}
                    {pick.revenue_growth && (
                      <div>
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">Rev Growth</p>
                        <p className="font-mono font-medium text-[14px] text-[var(--bull)]">
                          +{(pick.revenue_growth * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Score + CTA */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">AI Score</p>
                      <p className="font-display font-bold text-xl" style={{ color: SCORE_COLOR(pick.composite_score) }}>
                        {pick.composite_score}
                      </p>
                      <p className="text-[10px]" style={{ color: SCORE_COLOR(pick.composite_score) }}>
                        {SCORE_LABEL(pick.composite_score)}
                      </p>
                    </div>
                    <button
                      onClick={() => analyzePick(pick.ticker)}
                      className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
                    >
                      <BarChart3 size={14} />
                      Analyze
                    </button>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-4 progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pick.composite_score}%`,
                      background: `linear-gradient(90deg, ${SCORE_COLOR(pick.composite_score)}88, ${SCORE_COLOR(pick.composite_score)})`,
                    }}
                  />
                </div>

                {/* Analyst rec badge */}
                {pick.analyst_recommendation && (
                  <div className="mt-3 flex items-center gap-2">
                    <Target size={12} className="text-[var(--muted)]" />
                    <span className="text-[11px] text-[var(--muted)]">Analyst consensus:</span>
                    <span className="text-[11px] font-medium capitalize text-[var(--foreground)]">
                      {pick.analyst_recommendation.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
