"""
core/config.py
Application configuration using Pydantic Settings.
All values are read from environment variables / .env file.
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_ENV: str = "development"
    APP_NAME: str = "Stock Debate System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # --- Security ---
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # --- Database ---
    DATABASE_URL: str
    POSTGRES_USER: str = "stockdebate"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "stockdebate_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # --- Groq (LLM) ---
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama3-70b-8192"
    LLM_MAX_TOKENS: int = 2048

    # --- Alpha Vantage ---
    ALPHA_VANTAGE_API_KEY: str
    ALPHA_VANTAGE_BASE_URL: str = "https://www.alphavantage.co/query"

    # --- NewsAPI ---
    NEWS_API_KEY: str
    NEWS_API_BASE_URL: str = "https://newsapi.org/v2"

    # --- Pinecone ---
    PINECONE_API_KEY: str
    PINECONE_ENVIRONMENT: str = "us-east-1-aws"
    PINECONE_INDEX_NAME: str = "stock-debate-embeddings"
    PINECONE_DIMENSION: int = 1536

    # --- CORS ---
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # --- Rate Limiting ---
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # --- Logging ---
    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — call this everywhere."""
    return Settings()


settings = get_settings()
