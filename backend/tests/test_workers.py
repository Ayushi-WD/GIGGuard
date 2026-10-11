"""Exercise validation, persistence, and worker responses through HTTP."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text

from app.database import make_engine, make_session_factory
from app.main import app
from app.models import Worker


@pytest.mark.parametrize("platform", ["Swiggy", "Zomato", "Zepto"])
def test_valid_registration(client, worker_payload, platform):
    worker_payload["platform"] = platform
    response = client.post("/workers", json=worker_payload)
    assert response.status_code == 201
    data = response.json()
    assert UUID(data["id"]).version == 4
    assert datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")).tzinfo
    for key, value in worker_payload.items():
        assert data[key] == value


def test_listing(client, worker_payload):
    assert client.get("/workers").json() == []
    first = client.post("/workers", json=worker_payload).json()
    second = client.post("/workers", json=worker_payload).json()
    response = client.get("/workers")
    assert response.status_code == 200
    assert {item["id"] for item in response.json()} == {first["id"], second["id"]}


def test_retrieval(client, worker_payload):
    registered = client.post("/workers", json=worker_payload).json()
    response = client.get("/workers/" + registered["id"])
    assert response.status_code == 200
    assert response.json() == registered


@pytest.mark.parametrize("field,value", [
    ("platform", "Uber"), ("average_daily_income", "0"),
    ("average_daily_income", "-10.00"), ("average_daily_income", "not-money"),
    ("average_daily_income", "850.501"), ("average_daily_income", "NaN"),
    ("average_daily_income", "10000000000.00"),
    ("experience_days", -1), ("experience_days", 1.5),
    ("experience_days", True), ("full_name", "   "), ("city", ""),
])
def test_invalid_registration(client, worker_payload, field, value):
    worker_payload[field] = value
    response = client.post("/workers", json=worker_payload)
    assert response.status_code == 422
    assert client.get("/workers").json() == []


@pytest.mark.parametrize("field", ["full_name", "city", "platform",
                                        "average_daily_income", "experience_days"])
def test_missing_required_field(client, worker_payload, field):
    del worker_payload[field]
    assert client.post("/workers", json=worker_payload).status_code == 422


def test_unknown_worker(client):
    response = client.get(f"/workers/{uuid4()}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Worker not found"}


def test_malformed_id(client):
    assert client.get("/workers/not-a-uuid").status_code == 422


def test_cors_allows_registration(client):
    response = client.options("/workers", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_persists_after_engine_restart(isolated_database, worker_payload, monkeypatch):
    with TestClient(app) as first_client:
        response = first_client.post("/workers", json=worker_payload)
        assert response.status_code == 201
        registered = response.json()

    replacement = make_engine(str(isolated_database.url))
    monkeypatch.setattr(app.state, "engine", replacement)
    monkeypatch.setattr(app.state, "session_factory", make_session_factory(replacement))
    try:
        with TestClient(app) as second_client:
            assert second_client.get("/workers/" + registered["id"]).json() == registered
            with app.state.session_factory() as session:
                worker = session.scalar(select(Worker))
                assert worker.average_daily_income == Decimal("850.50")
                assert isinstance(worker.average_daily_income, Decimal)
                raw = session.execute(text(
                    "SELECT average_daily_income, typeof(average_daily_income) FROM workers"
                )).one()
                assert tuple(raw) == (85050, "integer")
    finally:
        replacement.dispose()
