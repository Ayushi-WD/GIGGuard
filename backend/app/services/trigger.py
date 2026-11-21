"""Parametric thresholds and payout formula (synopsis Table 4.1 and section 4.3)."""

from decimal import Decimal, ROUND_HALF_UP

from app.models import DisruptionType

# (threshold, payout %), checked with strict ">" like the synopsis table.
_LADDERS = {
    DisruptionType.RAIN: [(20, 40), (50, 70), (100, 100)],   # mm
    DisruptionType.HEAT: [(42, 50), (45, 70)],               # deg C
    DisruptionType.AQI: [(200, 60), (300, 80)],
}
_FLAGS = {DisruptionType.FLOOD: 100, DisruptionType.CURFEW: 80}  # value >= 1 means active


def severity_pct(disruption_type: DisruptionType, value: float) -> int:
    """Return payout percentage (0 if no threshold is crossed)."""
    if disruption_type in _FLAGS:
        return _FLAGS[disruption_type] if value >= 1 else 0
    pct = 0
    for threshold, payout in _LADDERS[disruption_type]:
        if value > threshold:
            pct = payout
    return pct


def duration_multiplier(duration_hours: float) -> Decimal:
    if duration_hours <= 0:
        raise ValueError("duration_hours must be positive")
    if duration_hours <= 2:
        return Decimal("0.25")
    if duration_hours <= 4:
        return Decimal("0.50")
    if duration_hours <= 8:
        return Decimal("0.75")
    return Decimal("1.00")


def weather_multiplier(concurrent_types: int) -> Decimal:
    """1.10 when two or more disruption types hit the same city on the same day."""
    return Decimal("1.10") if concurrent_types >= 2 else Decimal("1.00")


def calculate_payout(daily_income: Decimal, severity: int, duration_hours: float,
                     concurrent_types: int = 1) -> Decimal:
    """Payout = Daily Income x Severity x Weather mult x Duration mult, capped at one day's income."""
    if severity <= 0:
        return Decimal("0.00")
    raw = (daily_income * Decimal(severity) / 100
           * weather_multiplier(concurrent_types) * duration_multiplier(duration_hours))
    return min(raw, daily_income).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)