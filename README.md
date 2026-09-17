# 🧠 Multi-Agent Stock Debate System

**AI-Powered Investment Analysis Platform with Collaborative Agent Intelligence**

> B.Tech Computer Science Mini Project | RGUKT NUZVID | Under Guidance of M.J.Blessy, Assistant Professor | Academic Year 2025–2026

---

## 📌 Overview

The Multi-Agent Stock Debate System is a full-stack AI platform that analyzes stock tickers using four specialized AI agents — **Bull**, **Bear**, **Neutral**, and **Judge** — in a structured sequential debate. Each agent builds on the previous one's reasoning, producing a final explainable **BUY / SELL / HOLD** verdict with a confidence score and source citations.

---

## 🏗️ System Architecture

```
Frontend (Next.js)
    ↓
Backend (FastAPI + WebSockets)
    ↓
Agent Layer (LangGraph State Machine)
    ↓ ↓ ↓
  Bull → Bear → Neutral → Judge
    ↓
Final Verdict (BUY/SELL/HOLD + Confidence Score)

Data Sources: Yahoo Finance | Alpha Vantage | NewsAPI
Databases:    PostgreSQL | Redis | Pinecone Vector DB
```

---

## 🤖 Agent Roles

| Agent | Role | Responsibility |
|---|---|---|
| 🟢 Bull Agent | Optimistic Investor | Growth drivers, positive trends, upside potential |
| 🔴 Bear Agent | Risk-Focused Analyst | Macroeconomic risks, valuation concerns, red flags |
| 🟣 Neutral Agent | Balanced Analyst | Risk vs reward, historical context, realistic projections |
| 🔵 Judge Agent | Debate Synthesizer | Cross-validates all arguments → BUY/SELL/HOLD verdict |

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** + **shadcn/ui**
- **TradingView Lightweight Charts**
- **Socket.IO** (real-time debate streaming)

### Backend
- **FastAPI** (REST APIs + WebSocket support)
- **Celery + Redis** (async task queue)
- **Pydantic v2** (data validation)
- **JWT Authentication**

### AI & Agent Layer
- **LangGraph** (stateful multi-agent orchestration)
- **Groq API** 
- **LangChain Tools** (custom financial tools)
- **Pinecone** (vector embeddings for recommendations)

### Data Sources
- **yfinance** — Real-time price quotes, OHLCV, historical data
- **Alpha Vantage API** — Technical indicators, financial statements
- **NewsAPI** — Market news, macroeconomic sentiment

### Infrastructure
- **PostgreSQL** — User data, portfolio, debate history
- **Redis** — Caching, Celery broker, session store
- **Pinecone** — Vector DB for personalized recommendations
- **Docker + Docker Compose** — Containerized deployment
- **Vercel** — Frontend deployment

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### 1. Clone & Setup Environment

```bash
git clone https://github.com/your-username/stock-debate-system.git
cd stock-debate-system

# Copy environment file
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start with Docker (Recommended)

```bash
docker-compose up --build
```

This starts:
- FastAPI backend on `http://localhost:8000`
- Next.js frontend on `http://localhost:3000`
- PostgreSQL on port `5432`
- Redis on port `6379`

### 3. Manual Setup (Development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI
uvicorn main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A core.celery_app worker --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
stock-debate-system/
├── backend/
│   ├── main.py                    # FastAPI application entry point
│   ├── requirements.txt
│   ├── agents/
│   │   ├── bull_agent.py          # Bull (optimistic) agent
│   │   ├── bear_agent.py          # Bear (risk-focused) agent
│   │   ├── neutral_agent.py       # Neutral (balanced) agent
│   │   ├── judge_agent.py         # Judge (synthesizer) agent
│   │   └── debate_graph.py        # LangGraph state machine
│   ├── api/
│   │   ├── auth.py                # JWT authentication routes
│   │   ├── debate.py              # Debate trigger & streaming
│   │   ├── portfolio.py           # Portfolio & watchlist routes
│   │   └── recommendations.py    # Daily AI picks routes
│   ├── core/
│   │   ├── config.py              # App configuration (env vars)
│   │   ├── security.py            # Password hashing, JWT utils
│   │   ├── database.py            # SQLAlchemy setup
│   │   └── celery_app.py          # Celery configuration
│   ├── data/
│   │   ├── yahoo_finance.py       # yfinance data fetcher
│   │   ├── alpha_vantage.py       # Alpha Vantage API client
│   │   ├── news_api.py            # NewsAPI client
│   │   └── pipeline.py            # ETL pipeline (fetch→clean→enrich)
│   ├── models/
│   │   ├── user.py                # User ORM model
│   │   ├── debate.py              # Debate session ORM model
│   │   └── portfolio.py           # Portfolio ORM model
│   └── services/
│       ├── pinecone_service.py    # Vector DB operations
│       └── recommendation.py     # Daily picks engine
├── frontend/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing / home page
│   │   ├── debate/page.tsx        # Debate analysis page
│   │   ├── portfolio/page.tsx     # Portfolio dashboard
│   │   ├── picks/page.tsx         # Daily AI picks
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       └── register/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx      # Individual agent output card
│   │   │   ├── DebateStream.tsx   # Live streaming debate UI
│   │   │   └── VerdictPanel.tsx   # Final BUY/SELL/HOLD verdict
│   │   ├── charts/
│   │   │   └── StockChart.tsx     # TradingView chart component
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                 # Axios API client
│   │   ├── socket.ts              # Socket.IO client
│   │   └── types.ts               # TypeScript interfaces
│   └── package.json
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔑 Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | GPT-4o API key |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage financial data |
| `NEWS_API_KEY` | NewsAPI key |
| `PINECONE_API_KEY` | Pinecone vector DB key |
| `PINECONE_ENVIRONMENT` | Pinecone environment |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT secret key (use strong random string) |

---

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on all API endpoints
- Input validation with Pydantic v2
- CORS configuration
- SQL injection prevention via SQLAlchemy ORM
- Environment-based secret management

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, receive JWT |
| POST | `/api/debate/start` | Start a new debate |
| GET | `/api/debate/{id}` | Get debate result |
| WS | `/ws/debate/{id}` | WebSocket stream |
| GET | `/api/portfolio` | Get user portfolio |
| POST | `/api/portfolio/watchlist` | Add to watchlist |
| GET | `/api/picks/daily` | Get daily AI picks |

---

## 🤝 Team

- **Department:** Computer Science & Engineering, RGUKT NUZVID
- **Guide:** M.J.Blessy, Assistant Professor
- **Academic Year:** 2025–2026
