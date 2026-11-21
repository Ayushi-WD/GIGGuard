"""Tests for signed tokens, admin lock and own-data-only access."""

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

RAIN = {"city": "Mumbai", "disruption_type": "rain", "value": 60, "duration_hours": 8}


@pytest.fixture
def ctx(monkeypatch):
    monkeypatch.setenv("AUTH_ENFORCED", "true")
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


def make_worker_user(engine, name="w"):
    """Create a worker and its login. Returns (worker_id, auth_header)."""
    with Session(engine) as s:
        worker = Worker(full_name=name, city="Mumbai", platform=Platform.ZOMATO,
                        average_daily_income=Decimal("500.00"), experience_days=100)
        s.add(worker)
        s.flush()
        user = User(username=f"{name}-{uuid4().hex[:6]}", password_hash=hash_password("pw"),
                    role=UserRole.WORKER, worker_id=worker.id)
        s.add(user)
        s.commit()
        return str(worker.id), {"Authorization": f"Bearer {create_token(user.id)}"}


def make_admin(engine):
    with Session(engine) as s:
        user = User(username=f"admin-{uuid4().hex[:6]}", password_hash=hash_password("pw"),
                    role=UserRole.ADMIN)
        s.add(user)
        s.commit()
        return {"Authorization": f"Bearer {create_token(user.id)}"}


def test_simulate_without_token_is_401(ctx):
    client, _ = ctx
    assert client.post("/simulate/disruption", json=RAIN).status_code == 401


def test_simulate_as_worker_is_403(ctx):
    client, engine = ctx
    _, headers = make_worker_user(engine)
    assert client.post("/simulate/disruption", json=RAIN, headers=headers).status_code == 403


def test_simulate_as_admin_works(ctx):
    client, engine = ctx
    headers = make_admin(engine)
    assert client.post("/simulate/disruption", json=RAIN, headers=headers).status_code == 200


def test_worker_reads_own_claims(ctx):
    client, engine = ctx
    worker_id, headers = make_worker_user(engine)
    assert client.get(f"/claims/worker/{worker_id}", headers=headers).status_code == 200


def test_worker_cannot_read_someone_elses_claims(ctx):
    client, engine = ctx
    _, headers = make_worker_user(engine, "a")
    other_id, _ = make_worker_user(engine, "b")
    assert client.get(f"/claims/worker/{other_id}", headers=headers).status_code == 403
    assert client.get(f"/payouts/worker/{other_id}", headers=headers).status_code == 403
    assert client.get(f"/policies/worker/{other_id}", headers=headers).status_code == 403


def test_admin_reads_any_worker(ctx):
    client, engine = ctx
    worker_id, _ = make_worker_user(engine)
    admin = make_admin(engine)
    assert client.get(f"/claims/worker/{worker_id}", headers=admin).status_code == 200


def test_old_fake_token_is_rejected(ctx):
    client, engine = ctx
    worker_id, _ = make_worker_user(engine)
    fake = {"Authorization": f"Bearer token_{uuid4()}"}
    assert client.get(f"/claims/worker/{worker_id}", headers=fake).status_code == 401


def test_worker_cannot_activate_policy_for_another_worker(ctx):
    client, engine = ctx
    _, headers = make_worker_user(engine, "a")
    other_id, _ = make_worker_user(engine, "b")
    body = {"worker_id": other_id, "premium": "70.00", "risk_score": 55}
    assert client.post("/policies", json=body, headers=headers).status_code == 403


def test_auth_users_list_is_admin_only(ctx):
    client, engine = ctx
    _, worker_headers = make_worker_user(engine)
    assert client.get("/auth/users").status_code == 401
    assert client.get("/auth/users", headers=worker_headers).status_code == 403
    assert client.get("/auth/users", headers=make_admin(engine)).status_code == 200


def test_enforcement_off_blocks_nothing(ctx, monkeypatch):
    client, engine = ctx
    monkeypatch.setenv("AUTH_ENFORCED", "false")
    worker_id, _ = make_worker_user(engine)
    assert client.post("/simulate/disruption", json=RAIN).status_code == 200
    assert client.get(f"/claims/worker/{worker_id}").status_code == 200