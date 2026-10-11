"""Every test, including health tests, uses its own temporary SQLite file."""

import pytest
from fastapi.testclient import TestClient

from app.database import make_engine, make_session_factory
from app.main import app


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    engine = make_engine("sqlite:///" + (tmp_path / "test.db").as_posix())
    monkeypatch.setattr(app.state, "engine", engine)
    monkeypatch.setattr(app.state, "session_factory", make_session_factory(engine))
    yield engine
    engine.dispose()


@pytest.fixture
def client(isolated_database):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def worker_payload():
    return {
        "full_name": "Aarav Sharma",
        "city": "Bengaluru",
        "platform": "Swiggy",
        "average_daily_income": "850.50",
        "experience_days": 120,
    }
