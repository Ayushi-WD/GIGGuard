"""Tests for GET /policies/worker/{id} and GET /payouts/worker/{id}."""

from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Platform, Worker


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
    client = TestClient(app)
    yield client, engine
    app.dependency_overrides.clear()
    engine.dispose()


def make_worker(engine):
    with Session(engine) as session:
        worker = Worker(
            full_name="Test Worker",
            city="Mumbai",
            platform=Platform.ZOMATO,
            average_daily_income=Decimal("500.00"),
            experience_days=200,
        )
        session.add(worker)
        session.commit()
        return str(worker.id)


RAIN = {"city": "Mumbai", "disruption_type": "rain", "value": 60, "duration_hours": 8}


def test_unknown_worker_returns_empty_lists(ctx):
    client, _ = ctx
    missing = str(uuid4())
    assert client.get(f"/policies/worker/{missing}").json() == []
    assert client.get(f"/payouts/worker/{missing}").json() == []


def test_policy_listed_after_activation(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    client.post("/policies", json={"worker_id": worker_id, "premium": "70.00", "risk_score": 55})

    policies = client.get(f"/policies/worker/{worker_id}").json()
    assert len(policies) == 1
    assert policies[0]["status"] == "active"
    assert Decimal("49") <= Decimal(policies[0]["premium"]) <= Decimal("99")

def test_payout_listed_only_after_approval(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    client.post("/policies", json={"worker_id": worker_id, "premium": "70.00", "risk_score": 55})

    client.post("/simulate/disruption", json=RAIN)  # pending, no payout yet
    assert client.get(f"/payouts/worker/{worker_id}").json() == []

    client.post("/simulate/disruption?auto_approve=true", json={**RAIN, "value": 120})
    payouts = client.get(f"/payouts/worker/{worker_id}").json()
    assert len(payouts) == 1
    assert Decimal(payouts[0]["amount"]) == Decimal("375.00")  # 500 * 1.00 * 0.75