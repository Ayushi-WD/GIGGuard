import numpy as np
import pandas as pd
import pytest

from fraud_engine.generate_data import generate_dataset
from fraud_engine.layers.collusion import cluster_sizes, flag_claims, score_claims


def make(lats, lons, hours):
    return pd.DataFrame({"end_lat": lats, "end_lon": lons, "event_hour": hours})


def ring(n, lat=19.07, lon=72.87, hour=10.0):
    """n claims within about 10 m of each other, spread over 0.1 h steps."""
    return make([lat + 0.0001 * i for i in range(n)], [lon] * n, [hour + 0.1 * i for i in range(n)])


@pytest.fixture(scope="module")
def claims():
    return generate_dataset(n_claims=3000, fraud_rate=0.10, seed=7)[0]


def test_five_claims_close_in_space_and_time_are_a_ring():
    df = ring(5)
    assert flag_claims(df).all()
    assert (score_claims(df) == 100).all()


def test_four_claims_are_not_enough():
    df = ring(4)
    assert not flag_claims(df).any()
    assert score_claims(df).iloc[0] == pytest.approx(200 / 3)


def test_same_place_spread_over_many_hours_is_not_a_ring():
    df = make([19.07] * 5, [72.87] * 5, [0.0, 3.0, 6.0, 9.0, 12.0])
    assert not flag_claims(df).any()
    assert (score_claims(df) == 0).all()


def test_same_time_but_far_apart_is_not_a_ring():
    df = make([19.07 + 0.05 * i for i in range(5)], [72.87] * 5, [10.0] * 5)
    assert not flag_claims(df).any()


def test_two_rings_in_different_cities_stay_separate():
    df = pd.concat([ring(5, 19.07, 72.87), ring(5, 28.61, 77.20)], ignore_index=True)
    assert flag_claims(df).all()
    assert (cluster_sizes(df) == 5).all()


def test_isolated_claims_score_zero_next_to_a_ring():
    far = make([12.97, 13.08, 22.57], [77.59, 80.27, 88.36], [10.0, 40.0, 90.0])
    df = pd.concat([ring(5), far], ignore_index=True)
    scores = score_claims(df)
    assert (scores.iloc[:5] == 100).all()
    assert (scores.iloc[5:] == 0).all()


def test_unusable_rows_give_nan_and_do_not_break_the_rest():
    bad = make([np.nan, 95.0, 19.07], [72.87, 72.87, 72.87], [10.0, 10.0, np.inf])
    df = pd.concat([ring(5), bad], ignore_index=True)
    scores = score_claims(df)
    assert (scores.iloc[:5] == 100).all()
    assert scores.iloc[5:].isna().all()


def test_index_is_preserved():
    df = ring(5)
    df.index = [10, 20, 30, 40, 50]
    assert list(score_claims(df).index) == [10, 20, 30, 40, 50]


def test_empty_input_gives_empty_output():
    empty = pd.DataFrame({"end_lat": [], "end_lon": [], "event_hour": []})
    assert len(score_claims(empty)) == 0
    assert len(flag_claims(empty)) == 0


def test_result_is_deterministic():
    df = pd.concat([ring(6), ring(5, 28.61, 77.20)], ignore_index=True)
    assert score_claims(df).equals(score_claims(df))


def test_generated_rings_are_found(claims):
    flagged = flag_claims(claims)
    rings = claims["fraud_type"] == "collusion_ring"
    assert flagged[rings].mean() >= 0.9


def test_genuine_claims_are_rarely_flagged(claims):
    flagged = flag_claims(claims)
    genuine = claims["fraud_type"] == "none"
    assert flagged[genuine].mean() < 0.02


def test_other_fraud_types_are_not_flagged_as_rings(claims):
    flagged = flag_claims(claims)
    other = claims["fraud_type"].isin(["gps_spoofing", "inflated_weather", "burst_claiming"])
    assert flagged[other].mean() < 0.05