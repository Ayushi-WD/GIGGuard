"""One explicit feature contract shared by generation, training and inference."""

from numbers import Real
import math

NUMERIC_RANGES = {
    "historical_rain_risk": (0, 100),
    "historical_heat_risk": (0, 100),
    "historical_flood_risk": (0, 100),
    "weather_forecast_risk": (0, 100),
    "location_density": (500, 40000),
    "platform_volatility": (0, 1),
    "experience_days": (0, 3650),
    "average_daily_income": (200, 2000),
    "historical_claim_rate": (0, 0.5),
    "current_aqi": (0, 500),
    "festival_season": (0, 1),
}
SEASONS = ("winter", "summer", "monsoon", "post_monsoon")
FEATURES = list(NUMERIC_RANGES) + ["season_factor"]
TARGET = "risk_score"
SEED = 42
SCORING_VERSION = "synthetic_v1"


def validate_features(values):
    """Require complete observations; never invent missing live information."""
    if not isinstance(values, dict):
        raise ValueError("worker_features must be a dictionary")
    missing = set(FEATURES) - values.keys()
    extra = values.keys() - set(FEATURES)
    if missing or extra:
        raise ValueError(f"Feature mismatch: missing={sorted(missing)}, extra={sorted(extra)}")
    for name, (low, high) in NUMERIC_RANGES.items():
        value = values[name]
        if isinstance(value, bool) or not isinstance(value, Real):
            raise ValueError(f"{name} must be a supplied number, not null, text or boolean")
        if not math.isfinite(value) or not low <= value <= high:
            raise ValueError(f"{name} must be finite and between {low} and {high}")
        if name in ("experience_days", "festival_season") and value != int(value):
            raise ValueError(f"{name} must be an integer")
    if values["season_factor"] not in SEASONS:
        raise ValueError(f"season_factor must be one of {SEASONS}")
    return {name: values[name] for name in FEATURES}
