// lib/api.ts — Centralized Axios client with JWT auth interceptors

import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, null, {
            params: { refresh_token: refreshToken },
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string; risk_tolerance?: string }) =>
    api.post("/api/auth/register", data),

  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return api.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  getMe: () => api.get("/api/auth/me"),
};

// ─── Debate ────────────────────────────────────────────────────────────────

export const debateApi = {
  start: (ticker: string) => api.post("/api/debate/start", { ticker }),
  get: (debateId: string) => api.get(`/api/debate/${debateId}`),
  history: () => api.get("/api/debate/history/me"),
};

// ─── Portfolio ─────────────────────────────────────────────────────────────

export const portfolioApi = {
  get: () => api.get("/api/portfolio/"),
  add: (data: {
    ticker: string;
    shares?: number;
    avg_buy_price?: number;
    is_watchlist?: boolean;
    is_paper_trade?: boolean;
  }) => api.post("/api/portfolio/add", data),
  remove: (itemId: string) => api.delete(`/api/portfolio/${itemId}`),
  watchlist: () => api.get("/api/portfolio/watchlist"),
};

// ─── Recommendations ───────────────────────────────────────────────────────

export const picksApi = {
  daily: (topN = 5) => api.get("/api/picks/daily", { params: { top_n: topN } }),
  scan: (sector?: string, minScore?: number) =>
    api.get("/api/picks/market-scan", { params: { sector, min_score: minScore } }),
};

export default api;
