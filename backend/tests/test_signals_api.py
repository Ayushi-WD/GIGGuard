"""Tests for location pings and reviews."""

from datetime import datetime, timedelta, timezone
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


def make_worker(engine, name="w"):
    with Session(engine) as session:
        worker = Worker(full_name=name, city="Mumbai", platform=Platform.ZOMATO,
                        average_daily_income=Decimal("500.00"), experience_days=100)
        session.add(worker)
        session.flush()
        user = User(username=f"{name}-{uuid4().hex[:6]}", password_hash=hash_password("pw"),
                    role=UserRole.WORKER, worker_id=worker.id)
        session.add(user)
        session.commit()
        return str(worker.id), {"Authorization": f"Bearer {create_token(user.id)}"}


def make_admin(engine):
    with Session(engine) as session:
        user = User(username=f"admin-{uuid4().hex[:6]}", password_hash=hash_password("pw"),
                    role=UserRole.ADMIN)
        session.add(user)
        session.commit()
        return {"Authorization": f"Bearer {create_token(user.id)}"}


def ping(worker_id, **extra):
    return {"worker_id": worker_id, "latitude": 19.07, "longitude": 72.87, **extra}


def test_ping_is_saved_and_listed_newest_first(ctx):
    client, engine = ctx
    worker_id, _ = make_worker(engine)
    older = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    newer = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    assert client.post("/pings", json=ping(worker_id, recorded_at=older)).status_code == 201
    assert client.post("/pings", json=ping(worker_id, recorded_at=newer, latitude=19.08)).status_code == 201

    pings = client.get(f"/pings/worker/{worker_id}").json()
    assert len(pings) == 2
    assert pings[0]["latitude"] == 19.08  # newest first


def test_ping_unknown_worker_404(ctx):
    client, _ = ctx
    assert client.post("/pings", json=ping(str(uuid4()))).status_code == 404


def test_ping_out_of_range_coordinates_422(ctx):
    client, engine = ctx
    worker_id, _ = make_worker(engine)
    assert client.post("/pings", json=ping(worker_id, latitude=95)).status_code == 422
    assert client.post("/pings", json=ping(worker_id, longitude=-181)).status_code == 422


def test_ping_in_the_future_422(ctx):
    client, engine = ctx
    worker_id, _ = make_worker(engine)
    future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    assert client.post("/pings", json=ping(worker_id, recorded_at=future)).status_code == 422


def test_review_is_saved_and_listed(ctx):
    client, engine = ctx
    worker_id, _ = make_worker(engine)
    body = {"worker_id": worker_id, "rating": 1, "text": "Food arrived late", "on_time": True}
    assert client.post("/reviews", json=body).status_code == 201
    reviews = client.get(f"/reviews/worker/{worker_id}").json()
    assert len(reviews) == 1
    assert reviews[0]["rating"] == 1
    assert reviews[0]["on_time"] is True


def test_review_rating_must_be_1_to_5(ctx):
    client, engine = ctx
    worker_id, _ = make_worker(engine)
    for bad in (0, 6):
        body = {"worker_id": worker_id, "rating": bad, "text": "x"}
        assert client.post("/reviews", json=body).status_code == 422


def test_review_unknown_worker_404(ctx):
    client, _ = ctx
    body = {"worker_id": str(uuid4()), "rating": 4, "text": "ok"}
    assert client.post("/reviews", json=body).status_code == 404


def test_enforced_access_rules(ctx, monkeypatch):
    client, engine = ctx
    monkeypatch.setenv("AUTH_ENFORCED", "true")
    a_id, a_headers = make_worker(engine, "a")
    b_id, _ = make_worker(engine, "b")
    admin = make_admin(engine)

    assert client.post("/pings", json=ping(a_id), headers=a_headers).status_code == 201
    assert client.post("/pings", json=ping(b_id), headers=a_headers).status_code == 403
    assert client.get(f"/pings/worker/{b_id}", headers=a_headers).status_code == 403
    assert client.get(f"/pings/worker/{b_id}", headers=admin).status_code == 200

    review = {"worker_id": a_id, "rating": 5, "text": "great"}
    assert client.post("/reviews", json=review, headers=a_headers).status_code == 403
    assert client.post("/reviews", json=review, headers=admin).status_code == 201