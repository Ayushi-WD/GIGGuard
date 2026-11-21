from decimal import Decimal

import pytest

from app.models import DisruptionType as D
from app.services.trigger import calculate_payout, severity_pct


def test_thresholds_are_strictly_greater_than():
    assert severity_pct(D.RAIN, 20) == 0
    assert severity_pct(D.RAIN, 20.1) == 40
    assert severity_pct(D.RAIN, 55) == 70
    assert severity_pct(D.RAIN, 120) == 100
    assert severity_pct(D.HEAT, 43) == 50
    assert severity_pct(D.HEAT, 46) == 70
    assert severity_pct(D.AQI, 250) == 60
    assert severity_pct(D.AQI, 350) == 80


def test_flood_and_curfew_flags():
    assert severity_pct(D.FLOOD, 1) == 100
    assert severity_pct(D.FLOOD, 0) == 0
    assert severity_pct(D.CURFEW, 1) == 80


def test_payout_formula():
    assert calculate_payout(Decimal("500"), 70, 8) == Decimal("262.50")   # 500*0.7*0.75
    assert calculate_payout(Decimal("500"), 70, 10) == Decimal("350.00")
    assert calculate_payout(Decimal("500"), 70, 10, concurrent_types=2) == Decimal("385.00")


def test_payout_never_exceeds_daily_income():
    assert calculate_payout(Decimal("500"), 100, 12, concurrent_types=2) == Decimal("500.00")


def test_no_trigger_no_payout():
    assert calculate_payout(Decimal("500"), 0, 8) == Decimal("0.00")


def test_invalid_duration():
    with pytest.raises(ValueError):
        calculate_payout(Decimal("500"), 70, 0)