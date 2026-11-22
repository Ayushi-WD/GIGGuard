"""Server-side construction of the Random Forest inputs.

Every value comes from the database, today's date or a team-defined lookup table.
The client never supplies any of it, so it cannot lower its own premium.

IMPORTANT: the city and platform numbers below are team-defined placeholder
assumptions, not measured data. The report must say so.
"""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Claim, ClaimStatus, Worker
from ml_models.features import NUMERIC_RANGES

CLAIM_WINDOW_WEEKS = 12


@dataclass(frozen=True)
class CityProfile:
    rain: float      # historical rain risk, 0-100
    heat: float      # historical heat risk, 0-100
    flood: float     # historical flood risk, 0-100
    density: float   # people per km2 (model range 500-40000)
    aqi: float       # typical air quality index (model range 0-500)


CITY_PROFILES = {
    "mumbai": CityProfile(rain=85, heat=40, flood=80, density=20000, aqi=110),
    "delhi": CityProfile(rain=45, heat=85, flood=35, density=11000, aqi=220),
    "bengaluru": CityProfile(rain=55, heat=35, flood=50, density=4400, aqi=90),
    "chennai": CityProfile(rain=70, heat=75, flood=70, density=26000, aqi=100),
    "kolkata": CityProfile(rain=75, heat=60, flood=65, density=24000, aqi=160),
}
CITY_ALIASES = {"bangalore": "bengaluru", "bombay": "mumbai"}
DEFAULT_CITY = CityProfile(rain=50, heat=50, flood=40, density=8000, aqi=120)

PLATFORM_VOLATILITY = {"swiggy": 0.50, "zomato": 0.45, "zepto": 0.65}
DEFAULT_PLATFORM_VOLATILITY = 0.50


def city_profile(city: str) -> CityProfile:
    key = city.strip().lower()
    key = CITY_ALIASES.get(key, key)
    return CITY_PROFILES.get(key, DEFAULT_CITY)


def season_for(day: date) -> str:
    if day.month in (12, 1, 2):
        return "winter"
    if day.month in (3, 4, 5):
        return "summer"
    if day.month in (6, 7, 8, 9):
        return "monsoon"
    return "post_monsoon"


def festival_for(day: date) -> int:
    """1 during the October-November festival season (placeholder assumption)."""
    return 1 if day.month in (10, 11) else 0


def forecast_risk(profile: CityProfile, season: str) -> float:
    """Stand-in for a real forecast: follows the dominant hazard of the season."""
    if season == "monsoon":
        return profile.rain
    if season == "summer":
        return profile.heat
    return (profile.rain + profile.heat) / 4


def claim_rate_prior(profile: CityProfile, volatility: float) -> float:
    """Typical claim rate for this profile.

    Uses the same relationship as ml_models/generate_data.py (without the noise),
    so a worker with no claims looks like a typical worker the model has seen.
    """
    return 0.02 + 0.0012 * profile.rain + 0.001 * profile.flood + 0.08 * volatility


def observed_claims_per_week(db: Session, worker_id, today: date) -> float:
    """Non-rejected claims per week over the last 12 weeks."""
    since = datetime.combine(
        today - timedelta(weeks=CLAIM_WINDOW_WEEKS), time.min, tzinfo=timezone.utc
    )
    count = db.scalar(
        select(func.count(Claim.id)).where(
            Claim.worker_id == worker_id,
            Claim.created_at >= since,
            Claim.status != ClaimStatus.REJECTED,
        )
    ) or 0
    return count / CLAIM_WINDOW_WEEKS


def _clamp(name: str, value):
    low, high = NUMERIC_RANGES[name]
    return min(max(value, low), high)


def build_risk_features(db: Session, worker: Worker, today: date | None = None) -> dict:
    """Return the exact feature dict the Random Forest expects."""
    today = today or date.today()
    profile = city_profile(worker.city)
    season = season_for(today)
    volatility = PLATFORM_VOLATILITY.get(
        worker.platform.value.lower(), DEFAULT_PLATFORM_VOLATILITY
    )

    features = {
        "historical_rain_risk": profile.rain,
        "historical_heat_risk": profile.heat,
        "historical_flood_risk": profile.flood,
        "weather_forecast_risk": forecast_risk(profile, season),
        "location_density": profile.density,
        "platform_volatility": volatility,
        "experience_days": int(worker.experience_days),
        "average_daily_income": float(worker.average_daily_income),
        # typical rate for this profile, raised by the worker's actual claims
        "historical_claim_rate": claim_rate_prior(profile, volatility)
        + observed_claims_per_week(db, worker.id, today),
        "current_aqi": profile.aqi,
        "festival_season": festival_for(today),
    }
    # Real workers can fall outside the range the model was trained on.
    for name in NUMERIC_RANGES:
        features[name] = _clamp(name, features[name])
    features["season_factor"] = season
    return features