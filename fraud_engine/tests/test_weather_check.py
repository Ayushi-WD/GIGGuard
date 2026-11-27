import numpy as np
import pandas as pd
import pytest

from fraud_engine.generate_data import generate_dataset
from fraud_engine.layers.weather_check import flag_claims, score_claims, score_values


@pytest.fixture(scope="module")
def claims():
    return generate_dataset(n_claims=3000, fraud_rate=0.10, seed=7)[0]


def test_matching_readings_are_not_suspicious():
    assert score_values([100.0], [100.0])[0] == 0.0
    assert score_values([100.0], [90.0])[0] == 0.0


def test_a_big_gap_gets_the_maximum_score():
    assert score_values([100.0], [40.0])[0] == 100.0
    assert score_values([100.0], [0.0])[0] == 100.0   # rain claimed, none measured


def test_midpoint_is_half_scored():
    assert score_values([100.0], [67.5])[0] == pytest.approx(50.0)


def test_under_reporting_is_not_suspicious():
    assert score_values([50.0], [120.0])[0] == 0.0


@pytest.mark.parametrize("reported, independent", [
    (100.0, np.nan), (0.0, 50.0), (100.0, -5.0), (100.0, np.inf), (np.nan, 50.0), (-10.0, 50.0),
])
def test_unusable_inputs_give_nan_not_zero(reported, independent):
    assert np.isnan(score_values([reported], [independent])[0])


def test_lower_independent_reading_never_lowers_the_score():
    scores = score_values([100.0] * 11, [float(v) for v in range(100, -1, -10)])
    assert (np.diff(scores) >= 0).all()


def test_scores_stay_between_0_and_100():
    rng = np.random.default_rng(0)
    scores = score_values(rng.uniform(1, 500, 1000), rng.uniform(0, 600, 1000))
    assert scores.min() >= 0 and scores.max() <= 100


def test_score_claims_keeps_the_index_and_marks_missing_rows():
    df = pd.DataFrame({"reported_value": [100, 100, 100], "api_value": [100, 40, np.nan]},
                      index=[10, 20, 30])
    scores = score_claims(df)
    assert list(scores.index) == [10, 20, 30]
    assert scores.loc[10] == 0 and scores.loc[20] == 100 and np.isnan(scores.loc[30])


def test_flag_catches_every_inflated_claim_and_few_genuine_ones(claims):
    flagged = flag_claims(claims)
    inflated = claims["fraud_type"] == "inflated_weather"
    genuine = claims["fraud_type"] == "none"
    assert flagged[inflated].all()
    assert flagged[genuine].mean() < 0.07


def test_inflated_claims_score_much_higher_than_genuine_ones(claims):
    scores = score_claims(claims)
    inflated = claims["fraud_type"] == "inflated_weather"
    genuine = claims["fraud_type"] == "none"
    assert scores[inflated].mean() > scores[genuine].mean() + 30


def test_empty_input_gives_empty_output():
    empty = pd.DataFrame({"reported_value": [], "api_value": []})
    assert len(score_claims(empty)) == 0
    assert len(flag_claims(empty)) == 0