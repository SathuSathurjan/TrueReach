"""
api_client.py — everything that talks to the TrueReach backend:
logging in as a city manager, and POSTing aggregated impression readings.
"""

import sys
from datetime import datetime, timezone
import requests


class ApiClient:
    def __init__(self, settings):
        self.base_url = settings.API_BASE_URL
        self.email = settings.MANAGER_EMAIL
        self.password = settings.MANAGER_PASSWORD
        self.board_id = settings.BOARD_ID
        self.timeslot_id = settings.TIMESLOT_ID
        self.reservation_id = settings.RESERVATION_ID
        self.token = None

    def login(self):
        """Authenticate as the city manager and store the JWT token."""
        resp = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": self.email, "password": self.password},
            timeout=10,
        )
        if resp.status_code != 200:
            sys.exit(f"Login failed ({resp.status_code}): {resp.text}")

        data = resp.json()
        self.token = data["token"]
        print(f"Logged in as {data['name']} ({data['role']})")

    def send_impression(self, people_count: int, vehicle_count: int):
        """POST an aggregated impression reading to the backend."""
        if not self.token:
            raise RuntimeError("Not logged in — call login() first")

        payload = {
            "board_id": self.board_id,
            "timeslot_id": self.timeslot_id,
            "reservation_id": self.reservation_id,
            "people_count": people_count,
            "vehicle_count": vehicle_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        headers = {"Authorization": f"Bearer {self.token}"}

        try:
            resp = requests.post(f"{self.base_url}/impressions", json=payload, headers=headers, timeout=10)
            if resp.status_code == 201:
                print(f"[{payload['timestamp']}] Reported people={people_count} vehicles={vehicle_count} -> OK")
            else:
                print(f"[{payload['timestamp']}] Report failed ({resp.status_code}): {resp.text}")
        except requests.RequestException as e:
            print(f"Network error while reporting impression: {e}")
