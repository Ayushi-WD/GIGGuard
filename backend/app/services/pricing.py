"""Deterministic prototype pricing; no trained ML model is used."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP, localcontext
from enum import Enum


class LocationRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True)
class PremiumBreakdown:
    weekly_income: Decimal
    risk_score: Decimal
    base_premium: Decimal
    risk_loading: Decimal
    subtotal: Decimal
    location_adjustment: Decimal
    experience_adjustment: Decimal
    raw_premium: Decimal
    final_weekly_premium: Decimal


def calculate_premium(
    *, average_daily_income: Decimal, experience_days: int,
    risk_score: Decimal, location_risk: LocationRisk, work_days_per_week: int = 6,
) -> PremiumBreakdown:
    """Compute at full precision, clamp raw premium, then round outputs.

    Both adjustments use the same subtotal; they are not compounded.
    This function neither reads nor writes a database.
    """
    if not isinstance(average_daily_income, Decimal) or not isinstance(risk_score, Decimal):
        raise ValueError("Income and risk score must be Decimal values")
    if not average_daily_income.is_finite() or average_daily_income <= 0:
        raise ValueError("Income must be positive and finite")
    if not risk_score.is_finite() or not Decimal("0") <= risk_score <= Decimal("100"):
        raise ValueError("Risk score must be between 0 and 100")
    if type(work_days_per_week) is not int or not 1 <= work_days_per_week <= 7:
        raise ValueError("Working days must be an integer between 1 and 7")
    if type(experience_days) is not int or experience_days < 0:
        raise ValueError("Experience must be a non-negative integer")

    with localcontext() as context:
        context.prec = 40
        weekly_income = average_daily_income * work_days_per_week
        base = weekly_income * Decimal("0.02")
        loading = weekly_income * (risk_score / Decimal("100")) * Decimal("0.03")
        subtotal = base + loading
        location_rate = {
            LocationRisk.LOW: Decimal("-0.10"),
            LocationRisk.MEDIUM: Decimal("0"),
            LocationRisk.HIGH: Decimal("0.10"),
        }[location_risk]
        experience_rate = (
            Decimal("-0.08") if experience_days >= 180
            else Decimal("0.05") if experience_days < 30 else Decimal("0")
        )
        location = subtotal * location_rate
        experience = subtotal * experience_rate
        raw = subtotal + location + experience
        final = min(Decimal("99"), max(Decimal("49"), raw))

        def money(amount: Decimal) -> Decimal:
            return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return PremiumBreakdown(
            weekly_income=money(weekly_income), risk_score=risk_score,
            base_premium=money(base), risk_loading=money(loading),
            subtotal=money(subtotal), location_adjustment=money(location),
            experience_adjustment=money(experience), raw_premium=money(raw),
            final_weekly_premium=money(final),
        )
