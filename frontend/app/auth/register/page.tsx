"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

const RAW_ITEMS = [
  // Stock charts & trading screens
  { type: "image", src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=970&h=700&fit=crop" },
  { type: "text", title: "AI War Room", subtitle: "4 Agents. 1 Verdict.", color: "from-emerald-600 to-cyan-500" },
  { type: "image", src: "https://images.unsplash.com/photo-1642790551116-18e150f248e5?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=970&h=700&fit=crop" },
  // Bull & bear market
  { type: "image", src: "https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=970&h=700&fit=crop" },
  { type: "text", title: "Unbiased", subtitle: "Zero Emotion", color: "from-blue-600 to-indigo-500" },
  // Data dashboards & analytics
  { type: "image", src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=970&h=700&fit=crop" },
  // AI & technology
  { type: "image", src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=970&h=700&fit=crop" },
  { type: "text", title: "Bull vs Bear", subtitle: "Extreme Scrutiny", color: "from-red-600 to-rose-500" },
  { type: "image", src: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=970&h=700&fit=crop" },
  // Financial news & Bloomberg terminal
  { type: "image", src: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=970&h=700&fit=crop" },
  { type: "text", title: "Live Insights", subtitle: "Instant Execution", color: "from-orange-500 to-yellow-500" },
  // Candlestick charts
  { type: "image", src: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=970&h=700&fit=crop" },
  // Wall street & finance
  { type: "image", src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1618044733300-9472054094ee?w=970&h=700&fit=crop" },
  // Investment & portfolio
  { type: "image", src: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=970&h=700&fit=crop" },
  // Growth charts
  { type: "image", src: "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=970&h=700&fit=crop" },
  { type: "text", title: "The Judge", subtitle: "Final Verdict", color: "from-indigo-600 to-violet-500" },
  // Data science & ML
  { type: "image", src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=970&h=700&fit=crop" },
];

const MARQUEE_ITEMS = RAW_ITEMS.map((item, i) => {
  if (item.type === "image") {
    return <img key={i} src={item.src} className="w-full h-full object-cover" alt="trading" />;
  }
  return (
    <div key={i} className={`w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br ${item.color}`}>
      <h3 className="text-4xl lg:text-7xl font-black text-white text-center mb-4 tracking-tight leading-tight mix-blend-overlay">
        {item.title}
      </h3>
      <p className="text-xl lg:text-3xl text-white/90 font-medium text-center">
        {item.subtitle}
      </p>
    </div>
  );
});

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "Low risk, stable returns" },
  { value: "moderate", label: "Moderate", desc: "Balanced risk & reward" },
  { value: "aggressive", label: "Aggressive", desc: "High risk, high potential" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "", username: "", password: "", full_name: "", risk_tolerance: "moderate",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.username || !form.password) { toast.error("Fill in all required fields"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      toast.success("Account created! Welcome.");
      router.push("/debate");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    /* Root: fills exactly 100vw × 100vh */
    <div className="relative w-screen h-screen overflow-hidden">

      {/* 3D Marquee — full-screen background */}
      <ThreeDMarquee
        className="absolute inset-0 w-full h-full pointer-events-none"
        items={MARQUEE_ITEMS}
      />

      {/* Form — transparent container centred over the marquee, scrollable */}
      <div className="absolute inset-0 overflow-y-auto flex items-center justify-center p-4">
        <div className="w-full max-w-lg my-auto">

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              <span className="text-white font-bold text-xl drop-shadow">StockDebate</span>
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow mb-1">Create your account</h1>
            <p className="text-white/70 text-sm drop-shadow">Start debating stocks with AI in seconds</p>
          </div>

          {/* Themed glass card (Emerald/Cyan tint to match tech/finance feel) */}
          <div className="rounded-2xl border border-emerald-500/20 bg-black/40 backdrop-blur-2xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
            {/* Subtle inner top highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
            
            <form onSubmit={handleRegister} className="space-y-4 relative z-10">

              {/* Full name + Username row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                      placeholder="John Doe"
                      value={form.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm">@</span>
                    <input
                      className="w-full bg-white/10 border border-white/15 rounded-xl pl-9 pr-4 py-3 text-white text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                      placeholder="johndoe"
                      value={form.username}
                      onChange={(e) => update("username", e.target.value.toLowerCase())}
                      maxLength={30}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    className="w-full bg-white/10 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    className="w-full bg-white/10 border border-white/15 rounded-xl pl-11 pr-12 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Risk Tolerance */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  Risk Tolerance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RISK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update("risk_tolerance", opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.risk_tolerance === opt.value
                          ? "border-white/40 bg-white/15"
                          : "border-white/15 hover:border-white/30 bg-white/5"
                      }`}
                    >
                      <p className="text-xs font-semibold text-white mb-0.5">{opt.label}</p>
                      <p className="text-[10px] text-white/50 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Your password is hashed with bcrypt. We never store plain-text credentials.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl py-3.5 text-sm hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>Create Account <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-xs text-white/40">or</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            <p className="text-center text-sm text-white/50 mt-4">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-white font-semibold hover:text-white/80 transition">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
