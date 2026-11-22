"""Server-side premium for a policy: model score -> risk band -> premium.

The client never chooses the premium or the risk score.
If the Random Forest cannot run, a transparent rule-based score is used instead.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Worker
from app.services.band_pricing import band_premium
from app.services.risk import predict_score
from app.services.risk_inputs import build_risk_features

MODEL_METHOD = "random_forest_synthetic_v1"
FALLBACK_METHOD = "rule_based_fallback"


@dataclass(frozen=True)
class PolicyQuote:
    risk_score: Decimal   # 0-100
    premium: Decimal      # 49-99
    method: str


def fallback_score(features: dict) -> float:
    """Plain weighted average of the main hazards, scaled to 0-100.

    Used only when the trained model is unavailable.
    """
    claim_part = min(features["historical_claim_rate"] / 0.5, 1.0) * 100
    score = (
        0.25 * features["historical_rain_risk"]
        + 0.15 * features["historical_heat_risk"]
        + 0.25 * features["historical_flood_risk"]
        + 0.20 * features["weather_forecast_risk"]
        + 0.15 * claim_part
    )
    return min(max(score, 0.0), 100.0)


def quote_policy(db: Session, worker: Worker, today: date | None = None) -> PolicyQuote:
    features = build_risk_features(db, worker, today)
    try:
        score = float(predict_score(features))
        method = MODEL_METHOD
    except Exception:  # missing/corrupt model, version mismatch, bad output
        score = fallback_score(features)
        method = FALLBACK_METHOD

    score = min(max(score, 0.0), 100.0)
    risk = Decimal(str(round(score, 4)))
    return PolicyQuote(risk_score=risk, premium=band_premium(risk), method=method)