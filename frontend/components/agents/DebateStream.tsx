"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Loader2, Circle, Database, TrendingUp, TrendingDown, Scale, Gavel } from "lucide-react";

export interface DebateStep {
  id: string;
  label: string;
  description: string;
  icon: any;
  status: "pending" | "running" | "done" | "failed";
  message?: string;
}

const INITIAL_STEPS: Omit<DebateStep, "status">[] = [
  { id: "data_pipeline", label: "Data Pipeline", description: "Fetching market data from APIs", icon: Database },
  { id: "bull_agent", label: "Bull Agent", description: "Analyzing growth opportunities", icon: TrendingUp },
  { id: "bear_agent", label: "Bear Agent", description: "Evaluating risks & counter-arguments", icon: TrendingDown },
  { id: "neutral_agent", label: "Neutral Agent", description: "Weighing both perspectives", icon: Scale },
  { id: "judge_agent", label: "Judge Agent", description: "Synthesizing final verdict", icon: Gavel },
];

const STEP_COLORS: Record<string, string> = {
  data_pipeline: "var(--accent)",
  bull_agent: "var(--bull)",
  bear_agent: "var(--bear)",
  neutral_agent: "var(--neutral-agent)",
  judge_agent: "var(--judge)",
};

interface DebateStreamProps {
  updates: Record<string, { status: string; message?: string }>;
  isComplete: boolean;
}

export default function DebateStream({ updates, isComplete }: DebateStreamProps) {
  const steps: DebateStep[] = INITIAL_STEPS.map((s) => {
    const update = updates[s.id];
    return {
      ...s,
      status: update
        ? update.status === "done"
          ? "done"
          : update.status === "failed"
            ? "failed"
            : "running"
        : "pending",
      message: update?.message,
    };
  });

  return (
    <div className="card p-6">
      <h3 className="font-display font-700 text-[15px] mb-6 text-[var(--foreground)]">
        Debate Progress
      </h3>

      <div className="space-y-1">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const color = STEP_COLORS[step.id];
          const isRunning = step.status === "running";
          const isDone = step.status === "done";
          const isPending = step.status === "pending";

          return (
            <div key={step.id}>
              <div className="flex items-start gap-3 py-3">
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle size={18} style={{ color }} />
                  ) : isRunning ? (
                    <Loader2 size={18} className="animate-spin" style={{ color }} />
                  ) : (
                    <Circle size={18} className="text-[var(--muted-foreground)]" style={{ opacity: isPending ? 0.4 : 1 }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon
                      size={13}
                      className={isDone || isRunning ? "" : "text-[var(--muted-foreground)]"}
                      style={isDone || isRunning ? { color } : {}}
                    />
                    <span
                      className="text-[13px] font-medium"
                      style={isDone || isRunning ? { color } : { color: "var(--muted-foreground)" }}
                    >
                      {step.label}
                    </span>
                    {isDone && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${color}20`, color }}>
                        Done
                      </span>
                    )}
                    {isRunning && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium animate-pulse"
                        style={{ background: `${color}20`, color }}>
                        Running
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-[var(--muted)] leading-snug truncate">
                    {step.message || step.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className="ml-[9px] h-4 w-px"
                  style={{
                    background: isDone
                      ? color
                      : "var(--card-border)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
          <p className="text-[12px] text-[var(--bull)] font-medium flex items-center gap-1.5">
            <CheckCircle size={13} />
            Debate complete — scroll down for results
          </p>
        </div>
      )}
    </div>
  );
}
