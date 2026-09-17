"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Trash2, Star, TrendingUp, Eye, BarChart3 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { portfolioApi, debateApi } from "@/lib/api";
import { PortfolioItem } from "@/lib/types";

export default function PortfolioPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
  const [watchlist, setWatchlist] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<null | "holding" | "watchlist">(null);
  const [form, setForm] = useState({ ticker: "", shares: "", avg_buy_price: "" });
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"holdings" | "watchlist">("holdings");

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { router.push("/auth/login"); return; }
    loadPortfolio();
  }, [router]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const { data } = await portfolioApi.get();
      setHoldings(data.holdings || []);
      setWatchlist(data.watchlist || []);
    } catch { toast.error("Failed to load portfolio"); }
    finally { setLoading(false); }
  };

  const addItem = async () => {
    if (!form.ticker) { toast.error("Enter a ticker"); return; }
    setAdding(true);
    try {
      await portfolioApi.add({
        ticker: form.ticker.toUpperCase(),
        shares: form.shares ? parseFloat(form.shares) : undefined,
        avg_buy_price: form.avg_buy_price ? parseFloat(form.avg_buy_price) : undefined,
        is_watchlist: addMode === "watchlist",
      });
      toast.success(`Added ${form.ticker.toUpperCase()}`);
      setForm({ ticker: "", shares: "", avg_buy_price: "" });
      setAddMode(null);
      loadPortfolio();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || "Failed to add");
    } finally { setAdding(false); }
  };

  const removeItem = async (id: string, ticker: string) => {
    if (!confirm(`Remove ${ticker}?`)) return;
    try {
      await portfolioApi.remove(id);
      toast.success(`Removed ${ticker}`);
      loadPortfolio();
    } catch { toast.error("Failed to remove"); }
  };

  const analyzeStock = (ticker: string) => {
    router.push(`/debate?ticker=${ticker}`);
  };

  const displayItems = activeTab === "holdings" ? holdings : watchlist;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-800 text-3xl text-[var(--foreground)] mb-1">
              My <span className="text-[var(--accent)]">Portfolio</span>
            </h1>
            <p className="text-[var(--muted)] text-[14px]">
              Track your holdings and watchlist with AI-powered monitoring.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex items-center gap-2 text-sm" onClick={() => setAddMode("watchlist")}>
              <Eye size={14} />Watchlist
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setAddMode("holding")}>
              <Plus size={14} />Add Holding
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Holdings", value: holdings.length, icon: TrendingUp, color: "var(--bull)" },
            { label: "Watchlist", value: watchlist.length, icon: Star, color: "var(--judge)" },
            { label: "Sectors", value: new Set([...holdings, ...watchlist].map((i) => i.sector).filter(Boolean)).size, icon: BarChart3, color: "var(--accent)" },
            { label: "AI Analyses", value: holdings.length + watchlist.length, icon: Eye, color: "var(--neutral-agent)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color }} />
                <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider">{label}</span>
              </div>
              <p className="font-display font-bold text-2xl" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 bg-[var(--card)] rounded-xl w-fit">
          {(["holdings", "watchlist"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab} ({tab === "holdings" ? holdings.length : watchlist.length})
            </button>
          ))}
        </div>

        {/* Add form */}
        {addMode && (
          <div className="card p-5 mb-6 animate-fade-in border-[var(--accent)]/30">
            <h3 className="font-display font-700 text-[14px] mb-4">
              Add to {addMode === "holding" ? "Holdings" : "Watchlist"}
            </h3>
            <div className="grid sm:grid-cols-4 gap-3">
              <input
                className="input font-mono uppercase"
                placeholder="Ticker (e.g. AAPL)"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                maxLength={10}
              />
              {addMode === "holding" && (
                <>
                  <input
                    className="input"
                    placeholder="Shares (optional)"
                    type="number"
                    value={form.shares}
                    onChange={(e) => setForm({ ...form, shares: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Avg Buy Price (optional)"
                    type="number"
                    value={form.avg_buy_price}
                    onChange={(e) => setForm({ ...form, avg_buy_price: e.target.value })}
                  />
                </>
              )}
              <div className="flex gap-2">
                <button className="btn-primary flex-1 text-sm" onClick={addItem} disabled={adding}>
                  {adding ? "Adding..." : "Add"}
                </button>
                <button className="btn-ghost text-sm px-3" onClick={() => setAddMode(null)}>✕</button>
              </div>
            </div>
          </div>
        )}

        {/* Items list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 h-20 shimmer" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
              {activeTab === "holdings" ? <TrendingUp size={24} className="text-[var(--accent)]" /> : <Star size={24} className="text-[var(--accent)]" />}
            </div>
            <h3 className="font-display font-700 text-lg mb-2">No {activeTab} yet</h3>
            <p className="text-[var(--muted)] text-[14px]">
              {activeTab === "holdings" ? "Add stocks you own to track performance." : "Add stocks to watch for AI analysis alerts."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div key={item.id} className="card card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                    <span className="text-[var(--accent)] font-mono font-bold text-[11px]">
                      {item.ticker.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-[15px]">{item.ticker}</p>
                      {item.sector && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)]">
                          {item.sector}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--muted)]">{item.company_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.shares && (
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] text-[var(--muted)]">Shares</p>
                      <p className="text-[13px] font-mono font-medium">{item.shares}</p>
                    </div>
                  )}
                  {item.avg_buy_price && (
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] text-[var(--muted)]">Avg Buy</p>
                      <p className="text-[13px] font-mono font-medium">${item.avg_buy_price}</p>
                    </div>
                  )}
                  <button
                    onClick={() => analyzeStock(item.ticker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-all"
                  >
                    <BarChart3 size={13} />Analyze
                  </button>
                  <button
                    onClick={() => removeItem(item.id, item.ticker)}
                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--bear)] hover:bg-[var(--bear-bg)] transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
