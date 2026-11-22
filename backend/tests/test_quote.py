"""The quote shown to a worker must equal the premium actually charged."""

from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth_utils import create_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Platform, User, UserRole, Worker
from app.services import policy_pricing


@pytest.fixture
def ctx(monkeypatch):
    monkeypatch.setattr(policy_pricing, "predict_score", lambda features: 50.0)
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


def make_worker(engine, name="w"):
    with Session(engine) as session:
        worker = Worker(full_name=name, city="Mumbai", platform=Platform.ZOMATO,
                        average_daily_income=Decimal("500.00"), experience_days=200)
        session.add(worker)
        session.flush()
        user = User(username=f"{name}-{uuid4().hex[:6]}", password_hash=hash_password("pw"),
                    role=UserRole.WORKER, worker_id=worker.id)
        session.add(user)
        session.commit()
        return str(worker.id), {"Authorization": f"Bearer {create_token(user.id)}"}


def test_quote_equals_the_premium_charged(ctx):
    client, engine = ctx
    worker_id, _ = make_worker(engine)

    quote = client.get(f"/pricing/quote/{worker_id}").json()
    policy = client.post("/policies", json={"worker_id": worker_id}).json()

    assert Decimal(quote["weekly_premium"]) == Decimal(policy["premium"]) == Decimal("74.00")
    assert quote["risk_score"] == "50.0"
    assert quote["pricing_method"] == policy["pricing_method"]


def test_quote_saves_nothing(ctx):
    client, engine = ctx
    worker_id, _ = make_worker(engine)
    client.get(f"/pricing/quote/{worker_id}")
    assert client.get(f"/policies/worker/{worker_id}").json() == []


def test_unknown_worker_gets_404(ctx):
    client, _ = ctx
    assert client.get(f"/pricing/quote/{uuid4()}").status_code == 404


def test_worker_cannot_quote_someone_else_when_enforced(ctx, monkeypatch):
    client, engine = ctx
    monkeypatch.setenv("AUTH_ENFORCED", "true")
    _, headers = make_worker(engine, "a")
    other_id, _ = make_worker(engine, "b")
    assert client.get(f"/pricing/quote/{other_id}", headers=headers).status_code == 403
    assert client.get(f"/pricing/quote/{other_id}").status_code == 401