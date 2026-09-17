"""
core/celery_app.py
Celery application configuration for async task processing.
"""

from celery import Celery
from core.config import settings

celery_app = Celery(
    "stock_debate",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["services.recommendation"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        # Run daily picks generation every day at 6:00 AM UTC
        "generate-daily-picks": {
            "task": "services.recommendation.generate_daily_picks",
            "schedule": 21600.0,  # every 6 hours
        },
    },
)
