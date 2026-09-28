"""
video_source.py — turns any of the three supported source types into a
working cv2.VideoCapture object.

YouTube (including live streams) can't be opened directly by OpenCV since
YouTube serves HLS/DASH streams, not a raw file URL. yt-dlp resolves the
actual underlying stream URL, which OpenCV (via ffmpeg) can then open
exactly like any other video source.
"""

import sys
import cv2
import yt_dlp


def _resolve_youtube_stream_url(youtube_url: str) -> str:
    """Use yt-dlp to extract the direct, playable stream URL behind a YouTube link."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        # Prefer a reasonably small progressive format so detection stays fast;
        # YOLO doesn't need 4K frames.
        "format": "best[height<=480]/best",
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        if "url" in info:
            return info["url"]
        # Some formats nest the direct URL under 'formats'
        if "formats" in info and info["formats"]:
            return info["formats"][-1]["url"]
        raise RuntimeError("Could not resolve a playable stream URL from this YouTube link")


def open_video_source(settings) -> cv2.VideoCapture:
    """Returns an opened cv2.VideoCapture based on settings.SOURCE_TYPE."""

    if settings.SOURCE_TYPE == "webcam":
        print(f"Opening webcam at index {settings.CAMERA_INDEX}...")
        cap = cv2.VideoCapture(settings.CAMERA_INDEX)

    elif settings.SOURCE_TYPE == "video_file":
        print(f"Opening video file: {settings.VIDEO_FILE_PATH}...")
        cap = cv2.VideoCapture(settings.VIDEO_FILE_PATH)

    elif settings.SOURCE_TYPE == "youtube_live":
        print(f"Resolving YouTube stream URL for: {settings.YOUTUBE_URL}...")
        try:
            stream_url = _resolve_youtube_stream_url(settings.YOUTUBE_URL)
        except Exception as e:
            sys.exit(f"Failed to resolve YouTube stream: {e}")
        print("Stream URL resolved. Opening with OpenCV...")
        cap = cv2.VideoCapture(stream_url)

    else:
        sys.exit(f"Unknown SOURCE_TYPE: {settings.SOURCE_TYPE}")

    if not cap.isOpened():
        sys.exit(
            f"Could not open video source (type={settings.SOURCE_TYPE}). "
            "If this is a YouTube live stream, it may have ended or requires age/region verification."
        )

    return cap
