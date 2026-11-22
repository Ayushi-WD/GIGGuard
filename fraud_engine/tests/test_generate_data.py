import numpy as np
import pandas as pd
import pytest

from fraud_engine.generate_data import (
    FRAUD_TYPES, NEG_TEXTS, PATH_POINTS, POS_TEXTS, generate_dataset,
)


@pytest.fixture(scope="module")
def data():
    return generate_dataset(n_claims=3000, fraud_rate=0.10, seed=7)


def path_stats(gps):
    g = gps.sort_values(["claim_id", "step"])
    d_lat = g.groupby("claim_id")["lat"].diff() * 111.0
    d_lon = g.groupby("claim_id")["lon"].diff() * 111.0 * np.cos(np.radians(g["lat"]))
    dist = np.sqrt(d_lat**2 + d_lon**2)
    per_claim = dist.groupby(g["claim_id"])
    return pd.DataFrame({"max_speed_kmh": per_claim.max() * 60.0, "length_km": per_claim.sum()})


def test_same_seed_gives_same_data(data):
    again = generate_dataset(n_claims=3000, fraud_rate=0.10, seed=7)
    assert data[0].equals(again[0])
    assert data[1].equals(again[1])
    assert data[2].equals(again[2])


def test_size_and_fraud_rate(data):
    claims = data[0]
    assert len(claims) == 3000
    assert 0.095 <= claims["is_fraud"].mean() <= 0.105


def test_all_fraud_types_present_and_labels_consistent(data):
    claims = data[0]
    assert set(FRAUD_TYPES) <= set(claims["fraud_type"])
    assert ((claims["fraud_type"] == "none") == (claims["is_fraud"] == 0)).all()


def test_every_claim_has_a_full_gps_trail(data):
    claims, gps, _ = data
    counts = gps.groupby("claim_id").size()
    assert set(counts.index) == set(claims["claim_id"])
    assert (counts == PATH_POINTS).all()


def test_rings_are_five_plus_claims_close_in_space_and_time(data):
    claims = data[0]
    rings = claims[claims["ring_id"] != ""]
    assert len(rings) > 0
    for _, ring in rings.groupby("ring_id"):
        assert len(ring) >= 5
        assert ring["event_hour"].max() - ring["event_hour"].min() <= 1.0
        assert ring["end_lat"].max() - ring["end_lat"].min() < 0.003
        assert ring["end_lon"].max() - ring["end_lon"].min() < 0.003


def test_spoofed_trails_are_detectable_and_genuine_trails_are_not_flagged(data):
    claims, gps, _ = data
    stats = path_stats(gps)
    spoofed = claims[claims["fraud_type"] == "gps_spoofing"]["claim_id"]
    s = stats.loc[spoofed]
    assert ((s["max_speed_kmh"] > 60) | (s["length_km"] < 1e-6)).all()

    genuine = claims[claims["fraud_type"] != "gps_spoofing"]["claim_id"]
    assert (stats.loc[genuine, "max_speed_kmh"] < 60).all()


def test_no_group_is_in_both_train_and_test(data):
    claims = data[0]
    assert (claims.groupby("group_id")["split"].nunique() == 1).all()
    assert set(claims["split"]) == {"train", "test"}


def test_inflated_weather_has_a_low_api_ratio(data):
    claims = data[0]
    ratio = claims["api_value"] / claims["reported_value"]
    inflated = ratio[claims["fraud_type"] == "inflated_weather"]
    genuine = ratio[claims["fraud_type"] == "none"]
    assert inflated.max() <= 0.75
    assert genuine.median() > 0.9


def test_reviews_have_the_expected_fake_share(data):
    reviews = data[2]
    assert reviews["rating"].between(1, 5).all()
    assert reviews["is_fake"].sum() == round(len(reviews) * 0.10)
    assert set(reviews[reviews["is_fake"] == 1]["fake_type"]) <= {"contradiction", "generic_ai"}


def test_some_genuine_reviews_also_contradict_so_the_task_is_not_trivial(data):
    reviews = data[2]
    genuine = reviews[reviews["is_fake"] == 0]
    mismatch = genuine[(genuine["rating"] >= 4) & genuine["text"].isin(NEG_TEXTS)]
    mismatch2 = genuine[(genuine["rating"] <= 2) & genuine["text"].isin(POS_TEXTS)]
    assert len(mismatch) + len(mismatch2) > 0


def test_invalid_arguments_are_rejected():
    with pytest.raises(ValueError):
        generate_dataset(n_claims=10)
    with pytest.raises(ValueError):
        generate_dataset(n_claims=1000, fraud_rate=0.9)