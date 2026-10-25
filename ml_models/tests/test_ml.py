"""Check data contracts, train-only preprocessing, persistence and inference."""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest
from pandas.testing import assert_frame_equal
from sklearn.model_selection import train_test_split

from ml_models.features import FEATURES, NUMERIC_RANGES, SEASONS, SEED, TARGET
from ml_models.generate_data import generate_dataset
from ml_models.predict import load_model, predict_risk
from ml_models.train_model import save_model, train_and_evaluate


@pytest.fixture(scope="module")
def trained(tmp_path_factory):
    data = generate_dataset(200, seed=SEED)
    pipeline, report = train_and_evaluate(data, n_estimators=12)
    path = tmp_path_factory.mktemp("model") / "risk.joblib"
    save_model(pipeline, report, path)
    return data, pipeline, report, path


@pytest.fixture
def sample():
    path = Path(__file__).resolve().parents[1] / "sample_worker.json"
    return json.loads(path.read_text(encoding="utf-8"))


def test_default_dataset_contract():
    data = generate_dataset()
    assert data.shape == (20000, 13)
    assert list(data.columns) == FEATURES + [TARGET]
    assert len(FEATURES) == 12
    assert TARGET not in FEATURES
    assert data[TARGET].between(0, 100).all()
    assert not data[TARGET].isna().any()
    for name, (low, high) in NUMERIC_RANGES.items():
        assert data[name].dropna().between(low, high).all()
    assert set(data.season_factor.dropna()) == set(SEASONS)
    assert data.isna().any().any()
    assert not data[["experience_days", "average_daily_income", "festival_season"]].isna().any().any()


def test_generation_reproducible_and_labels_related():
    first = generate_dataset(1000, seed=42)
    assert_frame_equal(first, generate_dataset(1000, seed=42))
    assert not first.equals(generate_dataset(1000, seed=43))
    assert first["weather_forecast_risk"].corr(first[TARGET]) > 0.5
    assert not any(first[column].equals(first[TARGET]) for column in FEATURES)


@pytest.mark.parametrize("kwargs", [{"n_samples": 1}, {"n_samples": True},
                                   {"missing_rate": -0.1}, {"missing_rate": 0.9}])
def test_invalid_generation(kwargs):
    with pytest.raises(ValueError):
        generate_dataset(**kwargs)


def test_training_cv_baseline_and_no_target_leakage(trained):
    data, pipeline, report, _ = trained
    assert report["training_rows"] == 160
    assert report["test_rows"] == 40
    assert list(pipeline.feature_names_in_) == FEATURES
    for model in ("random_forest", "dummy"):
        assert set(report["held_out_test"][model]) == {"r2", "mae", "rmse"}
        assert all(np.isfinite(value) for value in report["held_out_test"][model].values())
        assert len(report["cross_validation"][model]["r2"]["folds"]) == 5
    train, _ = train_test_split(data[FEATURES], test_size=0.2, random_state=SEED)
    actual = pipeline.named_steps["preprocess"].named_transformers_["numeric"].named_steps["impute"].statistics_
    np.testing.assert_allclose(actual, train[list(NUMERIC_RANGES)].median().to_numpy())
    assert len(report["training_permutation_importance"]) == 12
    assert sum(report["impurity_importance_encoded"].values()) == pytest.approx(1.0)


def test_training_reproducible(trained):
    data, first, report, _ = trained
    second, second_report = train_and_evaluate(data, n_estimators=12)
    np.testing.assert_allclose(first.predict(data[FEATURES]), second.predict(data[FEATURES]), atol=1e-12)
    assert second_report["held_out_test"]["random_forest"]["r2"] == pytest.approx(
        report["held_out_test"]["random_forest"]["r2"], abs=1e-12)


def test_prediction_and_loading(trained, sample):
    _, pipeline, _, path = trained
    artifact = load_model(path)
    result = predict_risk(sample, path)
    assert isinstance(result, float) and 0 <= result <= 100
    expected = pipeline.predict(pd.DataFrame([sample], columns=FEATURES))[0]
    assert result == pytest.approx(expected)
    assert artifact["metadata"]["features"] == FEATURES


@pytest.mark.parametrize("field,value", [
    ("current_aqi", None), ("current_aqi", float("nan")),
    ("current_aqi", float("inf")), ("current_aqi", 501),
    ("current_aqi", "110"), ("historical_rain_risk", -1),
    ("platform_volatility", 1.1), ("historical_claim_rate", 0.6),
    ("experience_days", 2.5), ("festival_season", 2),
    ("festival_season", True), ("average_daily_income", 0),
    ("season_factor", "unknown"), ("season_factor", None),
])
def test_invalid_prediction(trained, sample, field, value):
    sample[field] = value
    with pytest.raises(ValueError, match=field):
        predict_risk(sample, trained[3])


@pytest.mark.parametrize("name", FEATURES)
def test_all_features_required(trained, sample, name):
    del sample[name]
    with pytest.raises(ValueError, match="missing"):
        predict_risk(sample, trained[3])


def test_extra_feature_and_wrong_container(trained, sample):
    with pytest.raises(ValueError, match="extra"):
        predict_risk({**sample, "risk_score": 50}, trained[3])
    with pytest.raises(ValueError, match="dictionary"):
        predict_risk([], trained[3])


def test_missing_and_invalid_artifact(tmp_path, trained, sample):
    with pytest.raises(FileNotFoundError, match="train_model"):
        predict_risk(sample, tmp_path / "absent.joblib")
    invalid = tmp_path / "invalid.joblib"
    joblib.dump({"pipeline": None}, invalid)
    with pytest.raises(ValueError, match="artifact"):
        load_model(invalid)
    artifact = load_model(trained[3])
    artifact["metadata"]["features"] = ["risk_score"]
    joblib.dump(artifact, invalid)
    with pytest.raises(ValueError, match="contract"):
        load_model(invalid)


def test_bad_training_data():
    data = generate_dataset(100)
    with pytest.raises(ValueError, match="12 features"):
        train_and_evaluate(data.drop(columns=[FEATURES[0]]), n_estimators=2)
    data.loc[0, TARGET] = 101
    with pytest.raises(ValueError, match="Targets"):
        train_and_evaluate(data, n_estimators=2)
