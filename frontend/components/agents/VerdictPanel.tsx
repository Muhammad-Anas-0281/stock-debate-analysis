"use client";

import { JudgeOutput } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BookOpen, Target } from "lucide-react";

interface VerdictPanelProps {
  data: JudgeOutput;
  ticker: string;
}

const VERDICT_CONFIG = {
  BUY: {
    label: "BUY",
    icon: TrendingUp,
    color: "var(--bull)",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.35)",
    glow: "0 0 40px rgba(34,197,94,0.2)",
    className: "verdict-buy",
  },
  SELL: {
    label: "SELL",
    icon: TrendingDown,
    color: "var(--bear)",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.35)",
    glow: "0 0 40px rgba(239,68,68,0.2)",
    className: "verdict-sell",
  },
  HOLD: {
    label: "HOLD",
    icon: Minus,
    color: "var(--judge)",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.35)",
    glow: "0 0 40px rgba(245,158,11,0.2)",
    className: "verdict-hold",
  },
};

export default function VerdictPanel({ data, ticker }: VerdictPanelProps) {
  const verdict = data.final_verdict as "BUY" | "SELL" | "HOLD";
  const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.HOLD;
  const Icon = cfg.icon;

  return (
    <div
      className="card animate-fade-in"
      style={{ borderColor: cfg.border, boxShadow: cfg.glow }}
    >
      {/* Top verdict banner */}
      <div
        className="p-6 rounded-t-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ background: cfg.bg }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: cfg.border }}
          >
            <Icon size={28} style={{ color: cfg.color }} />
          </div>
          <div>
            <p className="text-sm text-[var(--muted)] uppercase tracking-wider font-medium mb-1">
              Final Verdict — {ticker}
            </p>
            <h2
              className="font-display text-4xl font-800 tracking-tight"
              style={{ color: cfg.color }}
            >
              {data.verdict_strength || verdict}
            </h2>
          </div>
        </div>

        {/* Confidence meter */}
        <div className="min-w-[180px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[var(--muted)] uppercase tracking-wider">Confidence</span>
            <span className="font-display font-bold text-xl" style={{ color: cfg.color }}>
              {data.confidence_score}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${data.confidence_score}%`,
                background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
              }}
            />
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1.5">{data.investment_horizon}</p>
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-6">
        {/* Rationale */}
        <div className="md:col-span-2">
          <p className="text-[13px] uppercase tracking-wider text-[var(--muted)] mb-2 font-medium">
            Verdict Rationale
          </p>
          <p className="text-[14px] text-[var(--foreground)] leading-relaxed">
            {data.verdict_rationale}
          </p>
        </div>

        {/* Price Targets */}
        {data.price_targets && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-[var(--accent)]" />
              <p className="text-[12px] uppercase tracking-wider text-[var(--muted)] font-medium">
                Price Targets
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Bear Case", value: data.price_targets.bear_case, color: "var(--bear)" },
                { label: "Base Case", value: data.price_targets.base_case, color: "var(--foreground)" },
                { label: "Bull Case", value: data.price_targets.bull_case, color: "var(--bull)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl text-center"
                  style={{ background: "var(--background)" }}
                >
                  <p className="text-[10px] text-[var(--muted)] mb-1">{label}</p>
                  <p className="font-display font-bold text-[15px]" style={{ color }}>
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Identified Risks */}
        {data.identified_risks?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-[var(--warning)]" />
              <p className="text-[12px] uppercase tracking-wider text-[var(--muted)] font-medium">
                Key Risks
              </p>
            </div>
            <div className="space-y-2">
              {data.identified_risks.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{
                      color: r.severity === "high" ? "var(--bear)" : r.severity === "medium" ? "var(--warning)" : "var(--muted)",
                      background: r.severity === "high" ? "var(--bear-bg)" : r.severity === "medium" ? "rgba(245,158,11,0.1)" : "var(--card)",
                    }}
                  >
                    {r.severity}
                  </span>
                  <p className="text-[12px] text-[var(--muted)] leading-snug">{r.risk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deciding Factors */}
        {data.key_arguments_synthesis?.deciding_factors?.length > 0 && (
          <div className="md:col-span-2">
            <p className="text-[12px] uppercase tracking-wider text-[var(--muted)] font-medium mb-3">
              Deciding Factors
            </p>
            <div className="flex flex-wrap gap-2">
              {data.key_arguments_synthesis.deciding_factors.map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-[12px]"
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source Citations */}
        {data.source_citations?.length > 0 && (
          <div className="md:col-span-2 pt-4 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={13} className="text-[var(--muted)]" />
              <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium">
                Source Citations
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              {data.source_citations.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg text-[11px]"
                  style={{ background: "var(--background)" }}
                >
                  <p className="text-[var(--accent)] font-medium mb-0.5">{c.source}</p>
                  <p className="text-[var(--muted)] leading-snug">{c.data_point}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
