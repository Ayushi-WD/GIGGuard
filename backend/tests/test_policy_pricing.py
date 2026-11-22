"""The server, not the client, decides the premium."""

from decimal import Decimal

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Platform, Worker
from app.services import policy_pricing
from app.services.policy_pricing import fallback_score, quote_policy


@pytest.fixture
def ctx():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app), engine
    app.dependency_overrides.clear()
    engine.dispose()


def make_worker(engine):
    with Session(engine) as session:
        worker = Worker(full_name="T", city="Mumbai", platform=Platform.ZOMATO,
                        average_daily_income=Decimal("500.00"), experience_days=200)
        session.add(worker)
        session.commit()
        return str(worker.id)


def test_model_score_sets_the_premium(ctx, monkeypatch):
    client, engine = ctx
    monkeypatch.setattr(policy_pricing, "predict_score", lambda features: 50.0)
    worker_id = make_worker(engine)
    response = client.post("/policies", json={"worker_id": worker_id})
    assert response.status_code == 201
    body = response.json()
    assert Decimal(body["premium"]) == Decimal("74.00")  # 49 + 50 * 0.5
    assert body["risk_score"] == 50.0
    assert body["pricing_method"] == "random_forest_synthetic_v1"


def test_client_premium_and_risk_score_are_ignored(ctx, monkeypatch):
    client, engine = ctx
    monkeypatch.setattr(policy_pricing, "predict_score", lambda features: 50.0)
    worker_id = make_worker(engine)
    response = client.post(
        "/policies",
        json={"worker_id": worker_id, "premium": "49.00", "risk_score": 1},
    )
    assert response.status_code == 201
    assert Decimal(response.json()["premium"]) == Decimal("74.00")
    assert response.json()["risk_score"] == 50.0


def test_model_failure_falls_back_to_rules(ctx, monkeypatch):
    client, engine = ctx

    def broken(features):
        raise HTTPException(status_code=503, detail="model unavailable")

    monkeypatch.setattr(policy_pricing, "predict_score", broken)
    worker_id = make_worker(engine)
    response = client.post("/policies", json={"worker_id": worker_id})
    assert response.status_code == 201
    body = response.json()
    assert body["pricing_method"] == "rule_based_fallback"
    assert Decimal("49") <= Decimal(body["premium"]) <= Decimal("99")


def test_fallback_score_is_bounded_and_rises_with_risk():
    calm = {"historical_rain_risk": 0, "historical_heat_risk": 0, "historical_flood_risk": 0,
            "weather_forecast_risk": 0, "historical_claim_rate": 0}
    stormy = {"historical_rain_risk": 100, "historical_heat_risk": 100,
              "historical_flood_risk": 100, "weather_forecast_risk": 100,
              "historical_claim_rate": 0.5}
    assert fallback_score(calm) == 0
    assert fallback_score(stormy) == 100
    assert fallback_score(calm) < fallback_score(stormy)


def test_out_of_range_model_score_is_clamped(ctx, monkeypatch):
    _, engine = ctx
    monkeypatch.setattr(policy_pricing, "predict_score", lambda features: 140.0)
    with Session(engine) as session:
        worker = Worker(full_name="T", city="Delhi", platform=Platform.SWIGGY,
                        average_daily_income=Decimal("400.00"), experience_days=10)
        session.add(worker)
        session.flush()
        quote = quote_policy(session, worker)
    assert quote.risk_score == Decimal("100.0")
    assert quote.premium == Decimal("99.00")


def test_client_premium_outside_range_is_still_rejected(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    response = client.post("/policies", json={"worker_id": worker_id, "premium": "10.00"})
    assert response.status_code == 422