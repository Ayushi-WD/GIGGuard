"""Layer 3: weather cross-check.

Compares the value reported for a claim (mm of rain, deg C or AQI) with an independent
reading for the same place and time. A reported value far above the independent one is
suspicious. If either value is missing or unusable, the layer cannot judge and returns NaN.

Thresholds are team-chosen design values, not measured constants.
"""

from pathlib import Path

import numpy as np
import pandas as pd

RATIO_OK = 0.85      # independent / reported at or above this: score 0
RATIO_BAD = 0.50     # at or below this: score 100
FLAG_RATIO = 0.80    # standalone flag: ratio below this

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def weather_ratio(reported, independent):
    """independent / reported, or NaN where either value is missing or unusable."""
    rep = np.atleast_1d(np.asarray(reported, dtype="float64"))
    ind = np.atleast_1d(np.asarray(independent, dtype="float64"))
    usable = np.isfinite(rep) & np.isfinite(ind) & (rep > 0) & (ind >= 0)
    ratio = np.full(rep.shape, np.nan)
    ratio[usable] = ind[usable] / rep[usable]
    return ratio


def score_values(reported, independent):
    """Suspicion scores from 0 to 100. NaN stays NaN (could not judge)."""
    ratio = weather_ratio(reported, independent)
    scale = (RATIO_OK - ratio) / (RATIO_OK - RATIO_BAD)
    return np.clip(scale, 0.0, 1.0) * 100.0


def score_claims(claims: pd.DataFrame) -> pd.Series:
    scores = score_values(claims["reported_value"].to_numpy(), claims["api_value"].to_numpy())
    return pd.Series(scores, index=claims.index, name="weather_score")


def flag_claims(claims: pd.DataFrame, flag_ratio: float = FLAG_RATIO) -> pd.Series:
    """True where the independent reading is clearly below the reported value."""
    ratio = weather_ratio(claims["reported_value"].to_numpy(), claims["api_value"].to_numpy())
    return pd.Series(ratio < flag_ratio, index=claims.index, name="weather_flag")


def main():
    claims = pd.read_csv(DATA_DIR / "claims.csv")
    test = claims[claims["split"] == "test"]
    flagged = flag_claims(test)
    truth = test["fraud_type"] == "inflated_weather"

    tp = int((flagged & truth).sum())
    fp = int((flagged & ~truth).sum())
    fn = int((~flagged & truth).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0

    print("Weather cross-check alone, held-out test split (SYNTHETIC data)")
    print(f"  test claims: {len(test)}, inflated-weather claims: {int(truth.sum())}")
    print(f"  true positives: {tp}, false positives: {fp}, missed: {fn}")
    print(f"  precision: {precision:.3f}, recall: {recall:.3f}")
    print("Share flagged, by true fraud type:")
    print(flagged.groupby(test["fraud_type"]).mean().round(3).to_string())


if __name__ == "__main__":
    main()