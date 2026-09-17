"""
main.py
FastAPI application entry point for the Multi-Agent Stock Debate System.
"""

# ── Python 3.9 compatibility: polyfill asyncio.to_thread (added in 3.10) ───────
import asyncio
import sys
if sys.version_info < (3, 10) and not hasattr(asyncio, 'to_thread'):
    import contextvars
    import functools
    async def _to_thread(func, /, *args, **kwargs):
        loop = asyncio.get_running_loop()
        ctx = contextvars.copy_context()
        return await loop.run_in_executor(None, functools.partial(ctx.run, func, *args, **kwargs))
    asyncio.to_thread = _to_thread
# ───────────────────────────────────────────────────────────────────────────────

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger

from core.config import settings
from core.database import create_tables
from api.auth import router as auth_router
from api.debate import router as debate_router
from api.portfolio import router as portfolio_router
from api.recommendations import router as recommendations_router


# ─── Rate Limiter ──────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)


# ─── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("🚀 Starting Multi-Agent Stock Debate System...")
    await create_tables()
    logger.info("✅ Database tables ready")
    yield
    logger.info("🛑 Shutting down...")


# ─── App Factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Multi-Agent Stock Debate System",
    description=(
        "AI-Powered Investment Analysis Platform with Collaborative Agent Intelligence. "
        "Bull, Bear, Neutral, and Judge agents debate stock tickers to produce "
        "transparent BUY/SELL/HOLD verdicts."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(debate_router)
app.include_router(portfolio_router)
app.include_router(recommendations_router)


# ─── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Multi-Agent Stock Debate System API",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }
