"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

const RAW_ITEMS = [
  // Stock charts & trading screens
  { type: "image", src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=970&h=700&fit=crop" },
  { type: "text", title: "AI War Room", subtitle: "4 Agents. 1 Verdict.", color: "from-blue-600 to-cyan-500" },
  { type: "image", src: "https://images.unsplash.com/photo-1642790551116-18e150f248e5?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=970&h=700&fit=crop" },
  // Bull & bear market
  { type: "image", src: "https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=970&h=700&fit=crop" },
  { type: "text", title: "Bull vs Bear", subtitle: "Radical Transparency", color: "from-emerald-600 to-teal-500" },
  // Data dashboards & analytics
  { type: "image", src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=970&h=700&fit=crop" },
  // AI & technology
  { type: "image", src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=970&h=700&fit=crop" },
  { type: "text", title: "Data Driven", subtitle: "Zero Emotion", color: "from-violet-600 to-purple-500" },
  { type: "image", src: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=970&h=700&fit=crop" },
  // Financial news & Bloomberg terminal
  { type: "image", src: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=970&h=700&fit=crop" },
  { type: "image", src: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=970&h=700&fit=crop" },
  { type: "text", title: "Live Insights", subtitle: "Instant Execution", color: "from-rose-600 to-orange-500" },
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
  { type: "text", title: "Scale Up", subtitle: "Next Gen Portfolio", color: "from-blue-600 to-teal-400" },
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Fill in all fields"); return; }
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      toast.success("Welcome back!");
      router.push("/debate");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    /* Root: fills exactly 100vw × 100vh */
    <div className="relative w-screen h-screen overflow-hidden">


      {/* 3D Marquee — full-screen background */}
      <ThreeDMarquee
        className="absolute inset-0 w-full h-full"
        items={MARQUEE_ITEMS}
      />


      {/* Form — transparent container centred over the marquee */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white drop-shadow mb-1">Welcome back</h1>
            <p className="text-white/70 text-sm drop-shadow">Sign in to your account to continue</p>
          </div>

          {/* Themed glass card (Sky/Cyan tint to match tech/finance feel) */}
          <div className="rounded-2xl border border-sky-500/20 bg-black/40 backdrop-blur-2xl p-8 space-y-5 shadow-[0_0_40px_rgba(14,165,233,0.15)] relative overflow-hidden">
            {/* Subtle inner top highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            
            <form onSubmit={handleLogin} className="space-y-5 relative z-10">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    className="w-full bg-white/10 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    className="w-full bg-white/10 border border-white/15 rounded-xl pl-11 pr-12 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
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
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-xs text-white/40">or</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            <p className="text-center text-sm text-white/50">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-white font-semibold hover:text-white/80 transition">
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
