"""Risk-band premium: the Random Forest score maps linearly onto the 49-99 band.

Income is deliberately not used here. It already drives the payout, and the model
already sees experience and city risk, so adjusting for them again would count them twice.
"""

from decimal import Decimal, ROUND_HALF_UP

MIN_PREMIUM = Decimal("49")
MAX_PREMIUM = Decimal("99")


def band_premium(risk_score: Decimal) -> Decimal:
    """49 + 50 x (risk_score / 100), rounded to paise."""
    if not isinstance(risk_score, Decimal) or not risk_score.is_finite():
        raise ValueError("risk_score must be a finite Decimal")
    if not Decimal("0") <= risk_score <= Decimal("100"):
        raise ValueError("risk_score must be between 0 and 100")
    premium = MIN_PREMIUM + (MAX_PREMIUM - MIN_PREMIUM) * risk_score / Decimal("100")
    return premium.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)