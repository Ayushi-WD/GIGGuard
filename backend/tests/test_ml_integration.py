"""No training: controlled pipelines, cached loading, and isolated worker data."""

import json
from pathlib import Path
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import risk


@pytest.fixture
def sample_features():
    return json.loads((Path(__file__).resolve().parents[2]
                       / "ml_models" / "sample_worker.json").read_text(encoding="utf-8"))


@pytest.fixture(autouse=True)
def controlled_model(monkeypatch):
    risk.get_model_artifact.cache_clear()
    pipeline = Mock()
    pipeline.predict.return_value = [10.0]
    loader = Mock(return_value={"pipeline": pipeline})
    monkeypatch.setattr(risk, "load_model", loader)
    yield pipeline, loader
    risk.get_model_artifact.cache_clear()


@pytest.fixture
def saved_worker(client, worker_payload):
    worker_payload.update(full_name="Rahul Sharma", average_daily_income="600.00",
                          experience_days=180)
    response = client.post("/workers", json=worker_payload)
    assert response.status_code == 201
    return response.json()


def pricing_input(sample, worker):
    return {key: value for key, value in sample.items()
            if key not in ("average_daily_income", "experience_days")} | {
                "worker_id": worker["id"], "location_risk": "high"}


def test_risk_prediction_and_cache(client, sample_features, controlled_model):
    for _ in range(2):
        response = client.post("/risk/predict", json=sample_features)
        assert response.status_code == 200
        assert response.json() == {
            "predicted_risk_score": 10.0, "model_name": "RandomForestRegressor",
            "model_version": "experimental_v1", "prediction_source": "synthetic_trained_model",
        }
    pipeline, loader = controlled_model
    assert loader.call_count == 1
    assert pipeline.predict.call_count == 2


def test_ml_premium_uses_database_values(client, saved_worker, sample_features, controlled_model):
    sample_features.update(average_daily_income=1500, experience_days=0)
    response = client.post("/pricing/estimate-ml", json=pricing_input(sample_features, saved_worker))
    assert response.status_code == 200
    assert response.json() == {
        "worker_id": saved_worker["id"], "predicted_risk_score": 10.0,
        "model_name": "RandomForestRegressor", "model_version": "experimental_v1",
        "prediction_source": "synthetic_trained_model", "weekly_income": "3600.00",
        "base_premium": "72.00", "risk_loading": "10.80", "subtotal": "82.80",
        "location_adjustment": "8.28", "experience_adjustment": "-6.62",
        "raw_premium": "84.46", "final_weekly_premium": "84.46",
        "calculation_method": "random_forest_synthetic_v1",
    }
    frame = controlled_model[0].predict.call_args.args[0]
    assert frame.iloc[0]["average_daily_income"] == 600
    assert frame.iloc[0]["experience_days"] == 180
    assert frame.shape == (1, 12)
    assert client.get("/workers/" + saved_worker["id"]).json() == saved_worker


@pytest.mark.parametrize("income,score,expected", [("200.00", 0, "49.00"),
                                                 ("2000.00", 100, "99.00")])
def test_score_and_premium_bounds(client, worker_payload, sample_features, controlled_model,
                                  income, score, expected):
    worker_payload["average_daily_income"] = income
    worker = client.post("/workers", json=worker_payload).json()
    controlled_model[0].predict.return_value = [score]
    result = client.post("/pricing/estimate-ml", json=pricing_input(sample_features, worker))
    assert result.status_code == 200
    assert result.json()["predicted_risk_score"] == score
    assert result.json()["final_weekly_premium"] == expected


def test_unknown_worker_before_model_load(client, sample_features, controlled_model):
    response = client.post("/pricing/estimate-ml", json=pricing_input(
        sample_features, {"id": str(uuid4())}))
    assert response.status_code == 404
    controlled_model[1].assert_not_called()


@pytest.mark.parametrize("field,value", [
    ("historical_rain_risk", -1), ("historical_heat_risk", 101),
    ("current_aqi", 501), ("current_aqi", None), ("current_aqi", "110"),
    ("platform_volatility", 2), ("historical_claim_rate", 0.6),
    ("location_density", 1), ("season_factor", "unknown"),
    ("festival_season", True), ("festival_season", 0.5),
])
@pytest.mark.parametrize("endpoint", ["/risk/predict", "/pricing/estimate-ml"])
def test_invalid_features(client, saved_worker, sample_features, field, value, endpoint):
    sample_features[field] = value
    payload = (sample_features if endpoint == "/risk/predict"
               else pricing_input(sample_features, saved_worker))
    assert client.post(endpoint, json=payload).status_code == 422


@pytest.mark.parametrize("field", ["historical_rain_risk", "historical_heat_risk",
    "historical_flood_risk", "weather_forecast_risk", "season_factor", "location_density",
    "platform_volatility", "historical_claim_rate", "current_aqi", "festival_season",
    "experience_days", "average_daily_income"])
def test_missing_features(client, sample_features, field):
    del sample_features[field]
    assert client.post("/risk/predict", json=sample_features).status_code == 422


@pytest.mark.parametrize("field", ["historical_rain_risk", "historical_heat_risk",
    "historical_flood_risk", "weather_forecast_risk", "season_factor", "location_density",
    "platform_volatility", "historical_claim_rate", "current_aqi", "festival_season"])
def test_missing_environmental_features(client, saved_worker, sample_features, field):
    payload = pricing_input(sample_features, saved_worker)
    del payload[field]
    assert client.post("/pricing/estimate-ml", json=payload).status_code == 422


@pytest.mark.parametrize("field,value", [
    ("average_daily_income", 1000), ("experience_days", 10),
    ("location_risk", "extreme"), ("work_days_per_week", 0),
    ("work_days_per_week", 8), ("work_days_per_week", "6"),
    ("work_days_per_week", 6.5), ("work_days_per_week", True),
    ("worker_id", "invalid"), ("risk_score", 10),
])
def test_ml_request_controls(client, saved_worker, sample_features, field, value):
    payload = pricing_input(sample_features, saved_worker)
    payload[field] = value
    assert client.post("/pricing/estimate-ml", json=payload).status_code == 422


@pytest.mark.parametrize("field,value", [("average_daily_income", "100.00"), ("experience_days", 5000)])
def test_saved_worker_outside_model_domain(client, worker_payload, sample_features,
                                          controlled_model, field, value):
    worker_payload[field] = value
    worker = client.post("/workers", json=worker_payload)
    assert worker.status_code == 201
    result = client.post("/pricing/estimate-ml", json=pricing_input(sample_features, worker.json()))
    assert result.status_code == 422
    controlled_model[1].assert_not_called()


@pytest.mark.parametrize("failure", [FileNotFoundError("C:/private/model.joblib"),
                                    ValueError("private version mismatch"), RuntimeError("private failure")])
@pytest.mark.parametrize("endpoint", ["/risk/predict", "/pricing/estimate-ml"])
def test_model_unavailable_is_safe(client, saved_worker, sample_features, controlled_model,
                                  failure, endpoint):
    controlled_model[1].side_effect = failure
    payload = (sample_features if endpoint == "/risk/predict"
               else pricing_input(sample_features, saved_worker))
    response = client.post(endpoint, json=payload)
    assert response.status_code == 503
    assert "train_model" in response.json()["detail"]
    assert "private" not in response.text


@pytest.mark.parametrize("prediction", [float("nan"), float("inf"), -1, 101, "invalid"])
def test_invalid_model_output(client, sample_features, controlled_model, prediction):
    controlled_model[0].predict.return_value = [prediction]
    assert client.post("/risk/predict", json=sample_features).status_code == 503


def test_manual_pricing_does_not_load_model(client, saved_worker, controlled_model):
    controlled_model[1].side_effect = FileNotFoundError("not installed")
    result = client.post("/pricing/estimate", json={"worker_id": saved_worker["id"],
                         "risk_score": 10, "location_risk": "high"})
    assert result.status_code == 200
    assert result.json()["final_weekly_premium"] == "84.46"
    assert result.json()["calculation_method"] == "simulated_risk_score"
    controlled_model[1].assert_not_called()


def test_restart_reloads_model_from_disk(isolated_database, sample_features, controlled_model):
    with TestClient(app) as first:
        assert first.post("/risk/predict", json=sample_features).status_code == 200
    # A new process starts with an empty cache; simulate that without training.
    risk.get_model_artifact.cache_clear()
    with TestClient(app) as restarted:
        assert restarted.post("/risk/predict", json=sample_features).status_code == 200
    assert controlled_model[1].call_count == 2


@pytest.mark.parametrize("constant", ["NaN", "Infinity", "-Infinity"])
def test_nonfinite_json_returns_422(client, sample_features, constant):
    body = json.dumps(sample_features).replace('"current_aqi": 110', '"current_aqi": ' + constant)
    assert client.post("/risk/predict", content=body,
                       headers={"Content-Type": "application/json"}).status_code == 422


def test_new_swagger_routes(client):
    schema = client.get("/openapi.json").json()
    for endpoint in ("/risk/predict", "/pricing/estimate-ml", "/pricing/estimate"):
        assert "post" in schema["paths"][endpoint]
    assert client.get("/docs").status_code == 200
