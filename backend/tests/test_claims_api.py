"""End-to-end tests: policy -> simulated disruption -> claim -> payout, via real endpoints."""

from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Payout, Platform, Worker


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
    # No "with": the app's startup (real DB, admin seeding) is skipped on purpose.
    client = TestClient(app)
    yield client, engine
    app.dependency_overrides.clear()
    engine.dispose()


def make_worker(engine, city="Mumbai", income="500.00"):
    with Session(engine) as session:
        worker = Worker(
            full_name="Test Worker",
            city=city,
            platform=Platform.ZOMATO,
            average_daily_income=Decimal(income),
            experience_days=200,
        )
        session.add(worker)
        session.commit()
        return str(worker.id)


def activate(client, worker_id):
    return client.post(
        "/policies",
        json={"worker_id": worker_id, "premium": "70.00", "risk_score": 55},
    )


RAIN = {"city": "Mumbai", "disruption_type": "rain", "value": 60, "duration_hours": 8}


def test_activate_policy(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    response = activate(client, worker_id)
    assert response.status_code == 201
    body = response.json()
    assert body["worker_id"] == worker_id
    assert body["status"] == "active"
    assert body["week_start"] == date.today().isoformat()


def test_unknown_worker_gets_404(ctx):
    client, _ = ctx
    assert activate(client, str(uuid4())).status_code == 404


def test_second_policy_same_week_gets_409(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    assert activate(client, worker_id).status_code == 201
    assert activate(client, worker_id).status_code == 409


def test_premium_outside_49_99_is_rejected(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    for bad in ("10.00", "150.00"):
        response = client.post(
            "/policies",
            json={"worker_id": worker_id, "premium": bad, "risk_score": 55},
        )
        assert response.status_code == 422


def test_below_threshold_triggers_nothing(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    activate(client, worker_id)
    response = client.post("/simulate/disruption", json={**RAIN, "value": 10})
    assert response.status_code == 200
    assert response.json()["triggered"] is False
    assert client.get(f"/claims/worker/{worker_id}").json() == []


def test_full_flow_creates_pending_claim(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    activate(client, worker_id)

    response = client.post("/simulate/disruption", json=RAIN)
    assert response.status_code == 200
    body = response.json()
    assert body["triggered"] is True
    assert body["severity_pct"] == 70
    assert body["claims_created"] == 1
    assert Decimal(body["total_payout"]) == Decimal("262.50")

    claims = client.get(f"/claims/worker/{worker_id}").json()
    assert len(claims) == 1
    assert claims[0]["status"] == "pending"
    assert claims[0]["fraud_score"] is None
    assert Decimal(claims[0]["payout_amount"]) == Decimal("262.50")

    with Session(engine) as session:
        assert session.scalars(select(Payout)).all() == []  # nothing paid before fraud check


def test_auto_approve_releases_payout(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)
    activate(client, worker_id)

    client.post("/simulate/disruption?auto_approve=true", json=RAIN)

    claims = client.get(f"/claims/worker/{worker_id}").json()
    assert claims[0]["status"] == "approved"
    with Session(engine) as session:
        payouts = session.scalars(select(Payout)).all()
        assert len(payouts) == 1
        assert payouts[0].amount == Decimal("262.50")


def test_worker_without_policy_gets_no_claim(ctx):
    client, engine = ctx
    worker_id = make_worker(engine)  # no policy activated
    body = client.post("/simulate/disruption", json=RAIN).json()
    assert body["triggered"] is True       # the event is real...
    assert body["claims_created"] == 0     # ...but nobody is insured
    assert client.get(f"/claims/worker/{worker_id}").json() == []