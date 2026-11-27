"""Layer 2: collusion rings (DBSCAN).

A ring is five or more claims from almost the same place within about an hour.
DBSCAN groups claims that are close in space AND time, without needing to know how many
rings exist. Place is converted to kilometres and time to kilometres (KM_PER_HOUR), so one
hour of difference counts like 100 metres of distance.

EPS, MIN_SAMPLES and KM_PER_HOUR are team-chosen design values, tuned only on synthetic data.
"""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN

EPS = 0.25            # neighbourhood radius in the scaled space (km)
MIN_SAMPLES = 3       # DBSCAN density setting; a ring must still reach RING_SIZE to be flagged
KM_PER_HOUR = 0.10    # one hour of time difference counts as 100 m
RING_SIZE = 5         # five or more claims

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _prepare(claims: pd.DataFrame):
    """Return (features, usable): x/y in km, time in scaled km, and which rows can be judged."""
    lat = claims["end_lat"].to_numpy(dtype="float64")
    lon = claims["end_lon"].to_numpy(dtype="float64")
    hour = claims["event_hour"].to_numpy(dtype="float64")
    usable = (
        np.isfinite(lat) & np.isfinite(lon) & np.isfinite(hour)
        & (np.abs(lat) <= 90) & (np.abs(lon) <= 180)
    )
    x = lon * 111.32 * np.cos(np.radians(lat))
    y = lat * 110.57
    t = hour * KM_PER_HOUR
    return np.column_stack([x, y, t]), usable


def cluster_sizes(claims: pd.DataFrame) -> pd.Series:
    """Size of the cluster each claim belongs to: 0 = in no cluster, NaN = could not judge."""
    feats, usable = _prepare(claims)
    size = np.full(len(claims), np.nan)
    if usable.any():
        labels = DBSCAN(eps=EPS, min_samples=MIN_SAMPLES).fit_predict(feats[usable])
        sizes = np.zeros(len(labels))
        member = labels >= 0
        if member.any():
            counts = np.bincount(labels[member])
            sizes[member] = counts[labels[member]]
        size[usable] = sizes
    return pd.Series(size, index=claims.index, name="cluster_size")


def score_claims(claims: pd.DataFrame) -> pd.Series:
    """0 to 100: 0 for no cluster, 100 once the cluster reaches RING_SIZE. NaN stays NaN."""
    size = cluster_sizes(claims)
    floor = MIN_SAMPLES - 1
    score = ((size - floor) / (RING_SIZE - floor)).clip(0, 1) * 100
    return score.rename("collusion_score")


def flag_claims(claims: pd.DataFrame) -> pd.Series:
    """True for claims inside a cluster of RING_SIZE or more."""
    return (cluster_sizes(claims) >= RING_SIZE).rename("collusion_flag")


def main():
    claims = pd.read_csv(DATA_DIR / "claims.csv")
    flagged = flag_claims(claims)          # clustering uses all claims, as a live system would
    test = claims["split"] == "test"
    truth = claims["fraud_type"] == "collusion_ring"

    tp = int((flagged & truth & test).sum())
    fp = int((flagged & ~truth & test).sum())
    fn = int((~flagged & truth & test).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0

    print("Collusion-ring layer (DBSCAN), reported on the held-out test split (SYNTHETIC data)")
    print(f"  test claims: {int(test.sum())}, collusion-ring claims: {int((truth & test).sum())}")
    print(f"  true positives: {tp}, false positives: {fp}, missed: {fn}")
    print(f"  precision: {precision:.3f}, recall: {recall:.3f}")
    print("Share flagged, by true fraud type (test split):")
    print(flagged[test].groupby(claims.loc[test, "fraud_type"]).mean().round(3).to_string())


if __name__ == "__main__":
    main()