"""
config.py — loads and validates all settings from .env in one place,
so the rest of the codebase just does `from config import settings`.
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Backend
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000/api")
    MANAGER_EMAIL = os.getenv("MANAGER_EMAIL")
    MANAGER_PASSWORD = os.getenv("MANAGER_PASSWORD")
    BOARD_ID = os.getenv("BOARD_ID")
    TIMESLOT_ID = os.getenv("TIMESLOT_ID")
    RESERVATION_ID = os.getenv("RESERVATION_ID")

    # Video source
    SOURCE_TYPE = os.getenv("SOURCE_TYPE", "video_file").lower()
    CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
    VIDEO_FILE_PATH = os.getenv("VIDEO_FILE_PATH", "")
    YOUTUBE_URL = os.getenv("YOUTUBE_URL", "")

    # Detection / reporting
    REPORT_INTERVAL_SECONDS = int(os.getenv("REPORT_INTERVAL_SECONDS", "30"))
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.4"))


def validate(settings: Settings):
    """Fail fast with a clear message instead of a confusing crash mid-run."""
    errors = []

    if not settings.MANAGER_EMAIL or not settings.MANAGER_PASSWORD:
        errors.append("MANAGER_EMAIL / MANAGER_PASSWORD not set")

    for field in ("BOARD_ID", "TIMESLOT_ID", "RESERVATION_ID"):
        value = getattr(settings, field)
        if not value or "REPLACE_WITH" in value:
            errors.append(f"{field} not set correctly")

    if settings.SOURCE_TYPE not in ("webcam", "video_file", "youtube_live"):
        errors.append(f"SOURCE_TYPE must be webcam, video_file, or youtube_live (got '{settings.SOURCE_TYPE}')")

    if settings.SOURCE_TYPE == "video_file" and not settings.VIDEO_FILE_PATH:
        errors.append("VIDEO_FILE_PATH not set (required when SOURCE_TYPE=video_file)")

    if settings.SOURCE_TYPE == "youtube_live" and (not settings.YOUTUBE_URL or "REPLACE_WITH" in settings.YOUTUBE_URL):
        errors.append("YOUTUBE_URL not set correctly (required when SOURCE_TYPE=youtube_live)")

    if errors:
        print("Configuration errors in .env:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)


settings = Settings()
