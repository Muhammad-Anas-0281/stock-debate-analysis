"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrendingUp, BarChart3, Star, LogOut, User, Menu, X } from "lucide-react";
import { authApi } from "@/lib/api";

const NAV_LINKS = [
  { href: "/debate", label: "Debate", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { href: "/picks", label: "Daily Picks", icon: Star },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    authApi.getMe().then((res) => setUsername(res.data.username)).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/debate" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-display font-700 text-[15px] text-[var(--foreground)] hidden sm:block">
              StockDebate<span className="text-[var(--accent)]">.ai</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${pathname.startsWith(href)
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                  }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {username && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                <User size={14} className="text-[var(--muted)]" />
                <span className="text-sm text-[var(--muted)] font-mono">{username}</span>
              </div>
            )}
            <button onClick={logout} className="btn-ghost flex items-center gap-2 text-sm py-1.5 px-3">
              <LogOut size={14} />
              <span className="hidden sm:block">Logout</span>
            </button>
            <button className="md:hidden p-2 rounded-lg hover:bg-[var(--card)]" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--card-border)] bg-[var(--background)] px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${pathname.startsWith(href)
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
