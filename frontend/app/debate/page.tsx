"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Search, Clock, TrendingUp, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AgentCard from "@/components/agents/AgentCard";
import VerdictPanel from "@/components/agents/VerdictPanel";
import DebateStream from "@/components/agents/DebateStream";
import { debateApi } from "@/lib/api";
import { DebateSocket } from "@/lib/socket";
import { BullOutput, BearOutput, NeutralOutput, JudgeOutput, DebateSession } from "@/lib/types";

const POPULAR_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL", "AMZN", "META", "AMD"];

export default function DebatePage() {
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [stepUpdates, setStepUpdates] = useState<Record<string, { status: string; message?: string }>>({});
  const [debateData, setDebateData] = useState<DebateSession | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [history, setHistory] = useState<DebateSession[]>([]);
  const socketRef = useRef<DebateSocket | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.push("/auth/login");
  }, [router]);

  // Load history
  useEffect(() => {
    debateApi.history().then((r) => setHistory(r.data.slice(0, 5))).catch(() => { });
  }, []);

  const startDebate = useCallback(async (sym?: string) => {
    const symbol = (sym || ticker).toUpperCase().trim();
    if (!symbol) { toast.error("Enter a ticker symbol"); return; }
    if (!/^[A-Z]{1,10}$/.test(symbol)) { toast.error("Invalid ticker symbol"); return; }

    setLoading(true);
    setDebateId(null);
    setStepUpdates({});
    setDebateData(null);
    setIsComplete(false);

    try {
      const { data } = await debateApi.start(symbol);
      const id: string = data.debate_id;
      setDebateId(id);

      // Connect WebSocket for streaming
      const socket = new DebateSocket(
        id,
        (msg) => {
          const m = msg as { type: string; step?: string; status?: string; message?: string; data?: BullOutput | BearOutput | NeutralOutput | JudgeOutput };
          if (m.type === "step_update" && m.step) {
            setStepUpdates((prev) => ({
              ...prev,
              [m.step!]: { status: m.status || "running", message: m.message },
            }));

            // Store agent outputs as they arrive
            if (m.status === "done" && m.data) {
              setDebateData((prev) => {
                const updated = { ...(prev || { debate_id: id, ticker: symbol, status: "running" }) } as DebateSession;
                if (m.step === "bull_agent") updated.bull_argument = m.data as BullOutput;
                if (m.step === "bear_agent") updated.bear_argument = m.data as BearOutput;
                if (m.step === "neutral_agent") updated.neutral_argument = m.data as NeutralOutput;
                if (m.step === "judge_agent") {
                  updated.judge_verdict = m.data as JudgeOutput;
                  updated.verdict = (m.data as JudgeOutput).final_verdict;
                  updated.confidence_score = (m.data as JudgeOutput).confidence_score;
                }
                return updated;
              });
            }

            if (m.step === "completed" || (m.step === "judge_agent" && m.status === "done")) {
              setIsComplete(true);
              setLoading(false);
              // Fallback: fetch full result from REST in case any WS messages were missed
              setTimeout(async () => {
                try {
                  const { data: fullResult } = await debateApi.get(id);
                  setDebateData(fullResult);
                } catch { }
                resultsRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 400);
            }
          }
          if (m.type === "error") {
            toast.error("Debate failed — please try again");
            setLoading(false);
          }
        },
        (err) => { toast.error(err); setLoading(false); },
        () => { }
      );
      socket.connect();
      socketRef.current = socket;

    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to start debate");
      setLoading(false);
    }
  }, [ticker]);

  // Cleanup socket on unmount
  useEffect(() => () => socketRef.current?.disconnect(), []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-display font-800 text-3xl sm:text-4xl text-[var(--foreground)] mb-2">
            Stock Debate <span className="text-[var(--accent)]">Analysis</span>
          </h1>
          <p className="text-[var(--muted)] text-[15px]">
            Enter a ticker and watch four AI agents debate — Bull, Bear, Neutral, and Judge — to deliver a transparent verdict.
          </p>
        </div>

        {/* Search */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                className="input pl-10 font-mono uppercase tracking-widest text-[15px]"
                placeholder="AAPL, TSLA, NVDA..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && startDebate()}
                disabled={loading}
                maxLength={10}
              />
            </div>
            <button
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
              onClick={() => startDebate()}
              disabled={loading || !ticker}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
              ) : (
                <><TrendingUp size={15} />Start Debate</>
              )}
            </button>
          </div>

          {/* Popular tickers */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-[12px] text-[var(--muted)] pt-1">Popular:</span>
            {POPULAR_TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => { setTicker(t); startDebate(t); }}
                disabled={loading}
                className="px-3 py-1 text-[12px] font-mono rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column layout: progress + results */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">

          {/* Left: Progress sidebar */}
          <div className="space-y-4">
            {(loading || isComplete) && (
              <DebateStream updates={stepUpdates} isComplete={isComplete} />
            )}

            {/* Recent debates */}
            {history.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-700 text-[13px] text-[var(--muted)] uppercase tracking-wider mb-4">
                  Recent Debates
                </h3>
                <div className="space-y-2">
                  {history.map((h) => (
                    <button
                      key={h.debate_id}
                      onClick={() => { setTicker(h.ticker); startDebate(h.ticker); }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--card-hover)] transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-[var(--muted)]" />
                        <div className="text-left">
                          <p className="text-[13px] font-mono font-medium">{h.ticker}</p>
                          {h.verdict && (
                            <span className={`text-[10px] font-bold ${h.verdict === "BUY" ? "text-[var(--bull)]" : h.verdict === "SELL" ? "text-[var(--bear)]" : "text-[var(--judge)]"}`}>
                              {h.verdict}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[var(--muted)] group-hover:text-[var(--foreground)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Agent outputs */}
          <div ref={resultsRef} className="space-y-6">
            {(loading || debateData) && (
              <>
                {/* Judge verdict at top when complete */}
                {isComplete && debateData?.judge_verdict && (
                  <VerdictPanel data={debateData.judge_verdict} ticker={debateData.ticker} />
                )}

                {/* 2x2 agent grid */}
                <div className="agents-grid">
                  <AgentCard
                    type="bull"
                    data={debateData?.bull_argument as BullOutput}
                    isLoading={loading && !debateData?.bull_argument}
                  />
                  <AgentCard
                    type="bear"
                    data={debateData?.bear_argument as BearOutput}
                    isLoading={loading && !debateData?.bear_argument}
                  />
                  <AgentCard
                    type="neutral"
                    data={debateData?.neutral_argument as NeutralOutput}
                    isLoading={loading && !debateData?.neutral_argument}
                  />
                  {!isComplete && (
                    <AgentCard
                      type="judge"
                      data={debateData?.judge_verdict as JudgeOutput}
                      isLoading={loading && !debateData?.judge_verdict}
                    />
                  )}
                </div>
              </>
            )}

            {/* Empty state */}
            {!loading && !debateData && (
              <div className="card p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={28} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-display font-700 text-lg mb-2">Start Your First Debate</h3>
                <p className="text-[var(--muted)] text-[14px] max-w-sm mx-auto">
                  Enter any stock ticker above and our four AI agents will debate the investment case in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
