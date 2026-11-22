"""Generate labelled SYNTHETIC claims, GPS trails and reviews for the fraud engine.

Everything here is simulated. Results measured on this data say how well the layers
find the fraud patterns we invented, not how they would perform on real claims.
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
DEFAULT_DIR = Path(__file__).resolve().parent / "data"

CITY_CENTERS = {
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Bengaluru": (12.9716, 77.5946),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
}
PATH_POINTS = 20            # one GPS point per minute, ending at the claim
HORIZON_HOURS = 720         # 30 days of simulated time
FRAUD_TYPES = ("gps_spoofing", "collusion_ring", "inflated_weather", "burst_claiming")

POS_TEXTS = [
    "Delivered on time and the food was still hot",
    "Very polite delivery partner and quick service",
    "Great experience, order arrived fast and well packed",
    "Friendly rider, food reached fresh",
]
NEG_TEXTS = [
    "Order arrived very late and the food was cold",
    "Delivery partner was rude and took forever",
    "Food spilled and the delivery was delayed",
    "Waited over an hour, terrible service",
]
MIXED_TEXTS = [
    "Okay delivery, nothing special",
    "Average service, a bit slow but fine",
]
AI_TEXTS = [
    "I am extremely pleased with the exceptional service provided. The delivery partner "
    "demonstrated outstanding professionalism and efficiency throughout the entire process.",
    "The overall experience was truly remarkable. I would highly recommend this delivery "
    "service to everyone seeking reliable and professional assistance.",
]


def make_path(rng, end_lat, end_lon, kind="normal"):
    """Return (lat, lon) arrays of PATH_POINTS points ending near (end_lat, end_lon).

    kind: normal | teleport | static | too_fast
    """
    n = PATH_POINTS - 1
    if kind == "too_fast":
        speeds = rng.uniform(100, 250, n)                 # km/h, impossible on a scooter
    else:
        speeds = np.clip(rng.normal(18, 8, n), 0, 45)     # realistic delivery speeds

    if kind == "static":
        step_x = np.zeros(n)
        step_y = np.zeros(n)
    else:
        heading = rng.uniform(0, 2 * np.pi) + np.cumsum(rng.normal(0, 0.4, n))
        dist_km = speeds / 60.0                           # one minute per step
        step_x = dist_km * np.cos(heading)
        step_y = dist_km * np.sin(heading)

    if kind == "teleport":
        k = int(rng.integers(5, 15))
        jump_km = rng.uniform(8, 40)
        angle = rng.uniform(0, 2 * np.pi)
        step_x[k] += jump_km * np.cos(angle)
        step_y[k] += jump_km * np.sin(angle)

    x_km = np.concatenate([[0.0], np.cumsum(step_x)])
    y_km = np.concatenate([[0.0], np.cumsum(step_y)])
    d_lat = y_km / 111.0
    d_lon = x_km / (111.0 * np.cos(np.radians(end_lat)))

    lat = end_lat + (d_lat - d_lat[-1])
    lon = end_lon + (d_lon - d_lon[-1])
    if kind != "static":                                   # real GPS always jitters a little
        lat = lat + rng.normal(0, 0.0001, PATH_POINTS)
        lon = lon + rng.normal(0, 0.0001, PATH_POINTS)
    return lat, lon


def _event_value(rng, disruption_type):
    if disruption_type == "rain":
        return float(rng.uniform(21, 130))     # mm
    if disruption_type == "heat":
        return float(rng.uniform(42.5, 47))    # deg C
    return float(rng.uniform(205, 420))        # AQI


def generate_reviews(rng, worker_ids, n_reviews, fake_rate):
    fake_flags = np.zeros(n_reviews, dtype=bool)
    fake_flags[: int(round(n_reviews * fake_rate))] = True
    rng.shuffle(fake_flags)

    rows = []
    for i, fake in enumerate(fake_flags):
        worker = str(rng.choice(worker_ids))
        if fake:
            if rng.random() < 0.6:
                fake_type = "contradiction"
                if rng.random() < 0.5:
                    rating, text, on_time = int(rng.integers(1, 3)), str(rng.choice(POS_TEXTS)), True
                else:
                    rating, text, on_time = 5, str(rng.choice(NEG_TEXTS)), False
            else:
                fake_type = "generic_ai"
                rating, text, on_time = 5, str(rng.choice(AI_TEXTS)), True
        else:
            fake_type = "none"
            rating = int(rng.choice([1, 2, 3, 4, 5], p=[0.08, 0.07, 0.15, 0.30, 0.40]))
            if rating >= 4:
                pool, p_on = POS_TEXTS, 0.9
            elif rating <= 2:
                pool, p_on = NEG_TEXTS, 0.3
            else:
                pool, p_on = MIXED_TEXTS, 0.6
            if rating != 3 and rng.random() < 0.05:       # honest mis-click: genuine but contradictory
                pool = NEG_TEXTS if rating >= 4 else POS_TEXTS
            text = str(rng.choice(pool))
            on_time = bool(rng.random() < p_on)
        rows.append({
            "review_id": f"V{i:06d}", "worker_id": worker, "rating": rating, "text": text,
            "on_time": on_time, "is_fake": int(fake), "fake_type": fake_type,
        })
    return pd.DataFrame(rows)


def generate_dataset(n_claims=6000, fraud_rate=0.10, seed=SEED, n_reviews=None):
    """Return (claims, gps_points, reviews) DataFrames."""
    if type(n_claims) is not int or n_claims < 100:
        raise ValueError("n_claims must be an integer of at least 100")
    if not 0 <= fraud_rate <= 0.5:
        raise ValueError("fraud_rate must be between 0 and 0.5")

    rng = np.random.default_rng(seed)
    cities = list(CITY_CENTERS)
    hotspots = {c: np.array(CITY_CENTERS[c]) + rng.normal(0, 0.04, (6, 2)) for c in cities}

    n_workers = max(60, n_claims // 4)
    worker_city = [cities[i % len(cities)] for i in range(n_workers)]
    workers_by_city = {c: [f"W{i:05d}" for i, wc in enumerate(worker_city) if wc == c] for c in cities}
    next_fraud_worker = [n_workers]

    def new_worker():
        wid = f"W{next_fraud_worker[0]:05d}"
        next_fraud_worker[0] += 1
        return wid

    events = []
    for i in range(max(20, n_claims // 8)):
        dtype = str(rng.choice(["rain", "heat", "aqi"], p=[0.5, 0.25, 0.25]))
        events.append({
            "event_id": f"E{i:04d}", "city": str(rng.choice(cities)),
            "hour": float(rng.uniform(0, HORIZON_HOURS - 5)),
            "type": dtype, "value": _event_value(rng, dtype),
        })

    claims, gps_rows = [], []

    def add_claim(worker, event, hour, end, path_kind, api_ratio, this_week, prev_90,
                  fraud_type="none", ring_id=""):
        claim_id = f"C{len(claims):06d}"
        lat, lon = make_path(rng, end[0], end[1], path_kind)
        claims.append({
            "claim_id": claim_id, "worker_id": worker, "city": event["city"],
            "event_id": event["event_id"], "disruption_type": event["type"],
            "event_hour": float(hour), "reported_value": event["value"],
            "api_value": event["value"] * api_ratio,
            "claims_prev_90d": int(prev_90), "claims_this_week": int(this_week),
            "end_lat": float(lat[-1]), "end_lon": float(lon[-1]),
            "ring_id": ring_id, "is_fraud": int(fraud_type != "none"), "fraud_type": fraud_type,
        })
        for step in range(PATH_POINTS):
            gps_rows.append({
                "claim_id": claim_id, "step": step,
                "minute": float(hour) * 60 + step - (PATH_POINTS - 1),
                "lat": float(lat[step]), "lon": float(lon[step]),
            })

    def pick_event():
        return events[int(rng.integers(len(events)))]

    def genuine_ratio():
        sd = 0.3 if rng.random() < 0.05 else 0.1          # some genuine readings are noisy
        return max(0.0, 1 + float(rng.normal(0, sd)))

    def genuine_location(city):
        return hotspots[city][int(rng.integers(6))] + rng.normal(0, 0.006, 2)

    def normal_week():
        return 1 + int(rng.poisson(0.25))

    # How many claims of each fraud type
    n_fraud = int(round(n_claims * fraud_rate))
    n_gps, n_weather, n_burst = (int(round(n_fraud * s)) for s in (0.30, 0.20, 0.20))
    n_ring_target = max(0, n_fraud - n_gps - n_weather - n_burst)
    ring_sizes, remaining = [], n_ring_target
    while remaining >= 5:
        size = int(rng.integers(5, 10))
        if remaining - size < 5:
            size = remaining
        ring_sizes.append(size)
        remaining -= size
    n_fraud_total = n_gps + n_weather + n_burst + sum(ring_sizes)

    # Genuine claims
    for _ in range(max(0, n_claims - n_fraud_total)):
        event = pick_event()
        worker = str(rng.choice(workers_by_city[event["city"]]))
        add_claim(worker, event, event["hour"] + rng.uniform(0, 3), genuine_location(event["city"]),
                  "normal", genuine_ratio(), normal_week(), rng.poisson(1.2))

    # Fraud 1: GPS spoofing
    for _ in range(n_gps):
        event = pick_event()
        kind = str(rng.choice(["teleport", "static", "too_fast"]))
        add_claim(new_worker(), event, event["hour"] + rng.uniform(0, 3),
                  genuine_location(event["city"]), kind, genuine_ratio(), normal_week(),
                  rng.poisson(1.2), "gps_spoofing")

    # Fraud 2: inflated weather (reported value far above the independent reading)
    for _ in range(n_weather):
        event = pick_event()
        add_claim(new_worker(), event, event["hour"] + rng.uniform(0, 3),
                  genuine_location(event["city"]), "normal", float(rng.uniform(0.3, 0.75)),
                  normal_week(), rng.poisson(1.2), "inflated_weather")

    # Fraud 3: burst claiming (almost no history, then many claims in one week)
    for _ in range(n_burst):
        event = pick_event()
        add_claim(new_worker(), event, event["hour"] + rng.uniform(0, 3),
                  genuine_location(event["city"]), "normal", genuine_ratio(),
                  int(rng.integers(3, 9)), rng.poisson(0.3), "burst_claiming")

    # Fraud 4: collusion rings (5+ claims, same spot, within one hour)
    for idx, size in enumerate(ring_sizes):
        event = pick_event()
        center = np.array(CITY_CENTERS[event["city"]]) + rng.normal(0, 0.03, 2)
        base_hour = event["hour"] + rng.uniform(0, 2)
        for _ in range(size):
            add_claim(new_worker(), event, base_hour + rng.uniform(0, 1.0),
                      center + rng.normal(0, 0.0003, 2), "normal", genuine_ratio(),
                      normal_week(), rng.poisson(1.2), "collusion_ring", ring_id=f"R{idx:03d}")

    claims_df = pd.DataFrame(claims).sample(frac=1, random_state=seed).reset_index(drop=True)
    gps_df = pd.DataFrame(gps_rows)

    # Group split: a whole ring (or a whole worker) goes to train OR test, never both
    claims_df["group_id"] = np.where(claims_df["ring_id"] != "", claims_df["ring_id"], claims_df["worker_id"])
    groups = np.array(sorted(claims_df["group_id"].unique()))
    split_rng = np.random.default_rng(seed + 1)
    test_groups = set(groups[split_rng.random(len(groups)) < 0.2])
    claims_df["split"] = np.where(claims_df["group_id"].isin(test_groups), "test", "train")

    all_workers = [f"W{i:05d}" for i in range(next_fraud_worker[0])]
    reviews_df = generate_reviews(rng, all_workers, n_reviews or max(200, n_claims // 2), fraud_rate)
    return claims_df, gps_df, reviews_df


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--claims", type=int, default=6000)
    parser.add_argument("--fraud-rate", type=float, default=0.10)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_DIR)
    args = parser.parse_args()

    claims, gps, reviews = generate_dataset(args.claims, args.fraud_rate, args.seed)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    claims.to_csv(args.output_dir / "claims.csv", index=False)
    gps.to_csv(args.output_dir / "gps_points.csv", index=False)
    reviews.to_csv(args.output_dir / "reviews.csv", index=False)
    print(f"Saved {len(claims)} claims, {len(gps)} GPS points, {len(reviews)} reviews to {args.output_dir}")
    print(claims["fraud_type"].value_counts().to_string())


if __name__ == "__main__":
    main()