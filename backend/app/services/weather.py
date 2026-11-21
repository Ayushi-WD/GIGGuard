"""OpenWeatherMap + AQICN fetchers. Any failure falls back to a no-disruption mock."""

import os
from dataclasses import dataclass

import httpx

from app.models import DisruptionType
from app.services.trigger import severity_pct

TIMEOUT = 5.0


@dataclass
class Observation:
    city: str
    rain_mm: float
    temp_c: float
    aqi: int
    source: str  # "api" | "partial" | "mock"


def _fetch_weather(city: str) -> tuple[float, float] | None:
    """Return (rain_mm_last_hour, temp_c) or None on any failure."""
    key = os.getenv("OPENWEATHER_API_KEY")
    if not key:
        return None
    try:
        r = httpx.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": f"{city},IN", "appid": key, "units": "metric"},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        return float(data.get("rain", {}).get("1h", 0.0)), float(data["main"]["temp"])
    except (httpx.HTTPError, KeyError, ValueError):
        return None


def _fetch_aqi(city: str) -> int | None:
    """Return AQI or None on any failure (AQICN returns "-" when it has no data)."""
    key = os.getenv("AQICN_API_KEY")
    if not key:
        return None
    try:
        r = httpx.get(
            f"https://api.waqi.info/feed/{city}/",
            params={"token": key},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        return int(r.json()["data"]["aqi"])
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return None


def fetch_observation(city: str) -> Observation:
    weather = _fetch_weather(city)
    aqi = _fetch_aqi(city)
    if weather is not None and aqi is not None:
        source = "api"
    elif weather is not None or aqi is not None:
        source = "partial"
    else:
        source = "mock"
    rain, temp = weather if weather is not None else (0.0, 25.0)
    return Observation(city, rain, temp, aqi if aqi is not None else 50, source)


def detect_disruptions(obs: Observation) -> list[tuple[DisruptionType, float]]:
    """Return every (type, value) pair that crosses a Table 4.1 threshold."""
    readings = [
        (DisruptionType.RAIN, obs.rain_mm),
        (DisruptionType.HEAT, obs.temp_c),
        (DisruptionType.AQI, float(obs.aqi)),
    ]
    return [(t, v) for t, v in readings if severity_pct(t, v) > 0]