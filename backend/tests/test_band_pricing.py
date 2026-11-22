from decimal import Decimal

import pytest

from app.services.band_pricing import band_premium


def test_band_ends_and_middle():
    assert band_premium(Decimal("0")) == Decimal("49.00")
    assert band_premium(Decimal("50")) == Decimal("74.00")
    assert band_premium(Decimal("100")) == Decimal("99.00")


def test_typical_scores():
    assert band_premium(Decimal("30")) == Decimal("64.00")
    assert band_premium(Decimal("62.5")) == Decimal("80.25")


def test_higher_risk_never_pays_less():
    scores = [Decimal(str(s)) for s in range(0, 101, 5)]
    premiums = [band_premium(s) for s in scores]
    assert premiums == sorted(premiums)


def test_always_inside_the_band():
    for s in ("0", "0.01", "33.333", "99.99", "100"):
        assert Decimal("49") <= band_premium(Decimal(s)) <= Decimal("99")


@pytest.mark.parametrize("bad", [Decimal("-1"), Decimal("100.01"), Decimal("NaN"), Decimal("Infinity")])
def test_out_of_range_is_rejected(bad):
    with pytest.raises(ValueError):
        band_premium(bad)


def test_floats_are_rejected():
    with pytest.raises(ValueError):
        band_premium(55.0)