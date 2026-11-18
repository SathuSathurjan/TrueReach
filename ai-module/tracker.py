"""
tracker.py — TrueReach Real-Time Audience Tracking Module (main entry point)

Reads frames from a video file, or YouTube live stream, runs YOLOv8
detection on each frame, and POSTs aggregated people/vehicle counts to the
TrueReach backend every REPORT_INTERVAL_SECONDS.

No video is stored or transmitted anywhere — only numeric counts leave this
machine, going to the TrueReach API.

Usage:
    python tracker.py
Press 'q' in the video window to stop.
"""

import os
import time
import cv2

from config import settings, validate
from video_source import open_video_source
from detector import AudienceDetector
from api_client import ApiClient


def main():
    validate(settings)

    api = ApiClient(settings)
    api.login()

    detector = AudienceDetector(confidence_threshold=settings.CONFIDENCE_THRESHOLD)
    cap = open_video_source(settings)

    show_window = bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))
    if show_window:
        print(f"\nTracker running (source: {settings.SOURCE_TYPE}). Press 'q' in the video window to stop.\n")
    else:
        print(f"\nTracker running in headless mode (source: {settings.SOURCE_TYPE}). Display not available; skipping visual window.\n")

    window_people_readings = []
    window_vehicle_readings = []
    last_report_time = time.time()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Stream ended or frame could not be read.")
                break

            people_count, vehicle_count, annotated = detector.detect(frame)

            window_people_readings.append(people_count)
            window_vehicle_readings.append(vehicle_count)

            if show_window:
                cv2.putText(
                    annotated,
                    f"People: {people_count}  Vehicles: {vehicle_count}",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2,
                )
                cv2.imshow("TrueReach Audience Tracker", annotated)

            if time.time() - last_report_time >= settings.REPORT_INTERVAL_SECONDS:
                avg_people = round(sum(window_people_readings) / len(window_people_readings))
                avg_vehicles = round(sum(window_vehicle_readings) / len(window_vehicle_readings))

                api.send_impression(avg_people, avg_vehicles)

                window_people_readings = []
                window_vehicle_readings = []
                last_report_time = time.time()

            if show_window and cv2.waitKey(1) & 0xFF == ord("q"):
                print("Stopped by user.")
                break
            elif not show_window:
                time.sleep(0.01)
    finally:
        cap.release()
        if show_window:
            cv2.destroyAllWindows()
        print("Tracker stopped.")


if __name__ == "__main__":
    main()
