"use client";

import { BullOutput, BearOutput, NeutralOutput, JudgeOutput } from "@/lib/types";
import { TrendingUp, TrendingDown, Scale, Gavel, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type AgentOutput = BullOutput | BearOutput | NeutralOutput | JudgeOutput;
type AgentType = "bull" | "bear" | "neutral" | "judge";

interface AgentCardProps {
  type: AgentType;
  data?: AgentOutput;
  isLoading?: boolean;
}

const AGENT_CONFIG = {
  bull: {
    label: "Bull Agent",
    role: "Optimistic Investor",
    icon: TrendingUp,
    color: "var(--bull)",
    bg: "var(--bull-bg)",
    border: "var(--bull-border)",
    className: "agent-bull",
    iconBg: "rgba(34,197,94,0.15)",
  },
  bear: {
    label: "Bear Agent",
    role: "Risk-Focused Analyst",
    icon: TrendingDown,
    color: "var(--bear)",
    bg: "var(--bear-bg)",
    border: "var(--bear-border)",
    className: "agent-bear",
    iconBg: "rgba(239,68,68,0.15)",
  },
  neutral: {
    label: "Neutral Agent",
    role: "Balanced Analyst",
    icon: Scale,
    color: "var(--neutral-agent)",
    bg: "var(--neutral-bg)",
    border: "var(--neutral-border)",
    className: "agent-neutral",
    iconBg: "rgba(139,92,246,0.15)",
  },
  judge: {
    label: "Judge Agent",
    role: "Debate Synthesizer",
    icon: Gavel,
    color: "var(--judge)",
    bg: "var(--judge-bg)",
    border: "var(--judge-border)",
    className: "agent-judge",
    iconBg: "rgba(245,158,11,0.15)",
  },
};

export default function AgentCard({ type, data, isLoading }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = AGENT_CONFIG[type];
  const Icon = config.icon;

  if (isLoading || !data) return <AgentCardSkeleton type={type} />;

  return (
    <div
      className="card animate-fade-in"
      style={{ borderColor: config.border, background: `linear-gradient(135deg, var(--card) 80%, ${config.bg})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: config.iconBg }}>
            <Icon size={18} style={{ color: config.color }} />
          </div>
          <div>
            <h3 className="font-display font-700 text-[15px]" style={{ color: config.color }}>
              {config.label}
            </h3>
            <p className="text-xs text-[var(--muted)]">{config.role}</p>
          </div>
        </div>
        <ConfidenceBadge confidence={"confidence" in data ? data.confidence : ("confidence_score" in data ? (data as JudgeOutput).confidence_score : 0)} color={config.color} />
      </div>

      {/* Headline */}
      <div className="px-5 pb-3">
        <p className="text-[14px] font-medium leading-snug text-[var(--foreground)]">
          {"headline" in data ? data.headline : ""}
        </p>
      </div>

      {/* Summary */}
      <div className="px-5 pb-3">
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          {"summary" in data ? data.summary : ""}
        </p>
      </div>

      {/* Agent-specific content */}
      <div className="px-5 pb-4">
        {type === "bull" && <BullContent data={data as BullOutput} expanded={expanded} />}
        {type === "bear" && <BearContent data={data as BearOutput} expanded={expanded} />}
        {type === "neutral" && <NeutralContent data={data as NeutralOutput} expanded={expanded} />}
        {type === "judge" && <JudgeContent data={data as JudgeOutput} />}
      </div>

      {/* Expand toggle (not for judge) */}
      {type !== "judge" && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 flex items-center justify-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border-t border-[var(--card-border)]"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Show less" : "Show full analysis"}
        </button>
      )}
    </div>
  );
}

// ─── Bull Content ─────────────────────────────────────────────────────────────

function BullContent({ data, expanded }: { data: BullOutput; expanded: boolean }) {
  const args = expanded ? data.key_arguments : data.key_arguments?.slice(0, 2);
  return (
    <div className="space-y-3">
      {args?.map((arg, i) => (
        <div key={i} className="flex gap-2">
          <CheckCircle size={14} className="mt-0.5 shrink-0 text-[var(--bull)]" />
          <div>
            <span className="text-[13px] font-medium text-[var(--foreground)]">{arg.point}: </span>
            <span className="text-[12px] text-[var(--muted)]">{arg.evidence}</span>
          </div>
        </div>
      ))}
      {expanded && data.growth_catalysts?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-2">Growth Catalysts</p>
          <div className="flex flex-wrap gap-1.5">
            {data.growth_catalysts.map((c, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--bull-bg)] text-[var(--bull)] border border-[var(--bull-border)]">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bear Content ─────────────────────────────────────────────────────────────

function BearContent({ data, expanded }: { data: BearOutput; expanded: boolean }) {
  const rebuttals = expanded ? data.bull_rebuttals : data.bull_rebuttals?.slice(0, 2);
  const risks = expanded ? data.independent_risks : data.independent_risks?.slice(0, 1);
  const hasContent = (rebuttals?.length ?? 0) > 0 || (risks?.length ?? 0) > 0;

  if (!hasContent) {
    return (
      <p className="text-[12px] text-[var(--muted)] italic">
        {data.error ? `Error: ${data.error}` : data.summary || "Bear analysis complete."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bull Rebuttals — primary bear content */}
      {rebuttals?.map((r, i) => (
        <div key={i} className="flex gap-2">
          <XCircle size={14} className="mt-0.5 shrink-0 text-[var(--bear)]" />
          <div>
            <span className="text-[13px] font-medium text-[var(--foreground)]">
              vs &quot;{r.bull_point?.slice(0, 60)}{(r.bull_point?.length ?? 0) > 60 ? "…" : ""}&quot;:{" "}
            </span>
            <span className="text-[12px] text-[var(--muted)]">{r.counter}</span>
          </div>
        </div>
      ))}

      {/* Independent risks */}
      {risks?.map((r, i) => (
        <div key={`risk-${i}`} className="flex gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <div>
            <span className="text-[13px] font-medium text-[var(--foreground)]">{r.risk}: </span>
            <span className="text-[12px] text-[var(--muted)]">{r.evidence}</span>
          </div>
        </div>
      ))}

      {expanded && data.downside_scenarios?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-2">Downside Scenarios</p>
          {data.downside_scenarios.map((s, i) => (
            <p key={i} className="text-[12px] text-[var(--muted)] mb-1">• {s}</p>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Neutral Content ──────────────────────────────────────────────────────────

function NeutralContent({ data, expanded }: { data: NeutralOutput; expanded: boolean }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-[var(--bull-bg)] border border-[var(--bull-border)]">
          <p className="text-[10px] text-[var(--muted)] mb-1">Bull Merit</p>
          <p className="text-lg font-display font-bold text-[var(--bull)]">{data.bull_merit_score}/10</p>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--bear-bg)] border border-[var(--bear-border)]">
          <p className="text-[10px] text-[var(--muted)] mb-1">Bear Merit</p>
          <p className="text-lg font-display font-bold text-[var(--bear)]">{data.bear_merit_score}/10</p>
        </div>
      </div>
      {data.key_risk_reward && (
        <div className="text-[12px] text-[var(--muted)] space-y-1">
          <p>📈 Upside: <span className="text-[var(--bull)]">{data.key_risk_reward.upside_potential_pct}</span></p>
          <p>📉 Downside: <span className="text-[var(--bear)]">{data.key_risk_reward.downside_risk_pct}</span></p>
          <p>⚖️ Risk/Reward: <span className="text-[var(--foreground)]">{data.key_risk_reward.risk_reward_ratio}</span></p>
        </div>
      )}
      {expanded && data.critical_watchpoints?.length > 0 && (
        <div className="pt-2 border-t border-[var(--card-border)]">
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-2">Watch Points</p>
          {data.critical_watchpoints.map((w, i) => (
            <p key={i} className="text-[12px] text-[var(--muted)] mb-1">• {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Judge Content ────────────────────────────────────────────────────────────

function JudgeContent({ data }: { data: JudgeOutput }) {
  return (
    <div className="space-y-4">
      {/* Price targets */}
      {data.price_targets && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Bear", value: data.price_targets.bear_case, color: "var(--bear)" },
            { label: "Base", value: data.price_targets.base_case, color: "var(--foreground)" },
            { label: "Bull", value: data.price_targets.bull_case, color: "var(--bull)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-2 rounded-lg bg-[var(--background)]">
              <p className="text-[10px] text-[var(--muted)] mb-0.5">{label}</p>
              <p className="text-[13px] font-display font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Deciding factors */}
      {data.key_arguments_synthesis?.deciding_factors?.map((f, i) => (
        <div key={i} className="flex gap-2 text-[12px]">
          <span className="text-[var(--judge)]">▸</span>
          <span className="text-[var(--muted)]">{f}</span>
        </div>
      ))}

      {/* Top risks */}
      {data.identified_risks?.slice(0, 2).map((r, i) => (
        <div key={i} className="flex gap-2 items-start">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <span className="text-[12px] text-[var(--muted)]">{r.risk}</span>
        </div>
      ))}

      {/* Source citations */}
      {data.source_citations?.length > 0 && (
        <div className="pt-3 border-t border-[var(--card-border)]">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2">Sources</p>
          <div className="space-y-1">
            {data.source_citations.map((c, i) => (
              <p key={i} className="text-[11px] text-[var(--muted)]">
                <span className="text-[var(--accent)]">{c.source}</span>: {c.data_point}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence, color }: { confidence: number; color: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-[var(--muted)] mb-1">Confidence</p>
      <p className="text-lg font-display font-bold" style={{ color }}>
        {confidence}%
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AgentCardSkeleton({ type }: { type: AgentType }) {
  const config = AGENT_CONFIG[type];
  return (
    <div className="card p-5 space-y-4" style={{ borderColor: config.border }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl shimmer" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 rounded shimmer" />
          <div className="h-2 w-16 rounded shimmer" />
        </div>
        <div className="agent-typing text-[var(--muted)] text-lg">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-3/4 rounded shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded shimmer" />
        <div className="h-2.5 w-5/6 rounded shimmer" />
        <div className="h-2.5 w-4/5 rounded shimmer" />
      </div>
    </div>
  );
}
