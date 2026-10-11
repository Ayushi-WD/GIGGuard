"""Premium arithmetic and API integration against isolated SQLite data."""

from decimal import Decimal
from uuid import uuid4

import pytest

from app.services.pricing import LocationRisk, calculate_premium


def calculate(income="600", experience=180, risk="10", location="high", days=6):
    return calculate_premium(
        average_daily_income=Decimal(income), experience_days=experience,
        risk_score=Decimal(risk), location_risk=LocationRisk(location),
        work_days_per_week=days,
    )


def test_expected_rahul_calculation():
    result = calculate()
    assert result.weekly_income == Decimal("3600.00")
    assert result.base_premium == Decimal("72.00")
    assert result.risk_loading == Decimal("10.80")
    assert result.subtotal == Decimal("82.80")
    assert result.location_adjustment == Decimal("8.28")
    assert result.experience_adjustment == Decimal("-6.62")
    assert result.raw_premium == Decimal("84.46")
    assert result.final_weekly_premium == Decimal("84.46")


@pytest.mark.parametrize("risk,loading,final", [
    ("0", "0.00", "72.00"), ("100", "108.00", "99.00"),
])
def test_risk_boundaries(risk, loading, final):
    result = calculate(experience=60, location="medium", risk=risk)
    assert result.risk_loading == Decimal(loading)
    assert result.final_weekly_premium == Decimal(final)


@pytest.mark.parametrize("location,adjustment,final", [
    ("low", "-8.28", "74.52"), ("medium", "0.00", "82.80"),
    ("high", "8.28", "91.08"),
])
def test_location_adjustments(location, adjustment, final):
    result = calculate(experience=60, location=location)
    assert result.location_adjustment == Decimal(adjustment)
    assert result.final_weekly_premium == Decimal(final)


@pytest.mark.parametrize("experience,adjustment", [
    (0, "4.14"), (29, "4.14"), (30, "0.00"), (179, "0.00"),
    (180, "-6.62"), (500, "-6.62"),
])
def test_experience_boundaries(experience, adjustment):
    assert calculate(experience=experience).experience_adjustment == Decimal(adjustment)


@pytest.mark.parametrize("income,final", [("1", "49.00"), ("10000", "99.00")])
def test_clamping(income, final):
    assert calculate(income=income).final_weekly_premium == Decimal(final)


def test_half_up_rounding_without_intermediate_rounding():
    result = calculate(income="550.05", experience=60, risk="0", location="high", days=5)
    assert result.base_premium == Decimal("55.01")  # Exact base is 55.005.
    assert result.location_adjustment == Decimal("5.50")
    assert result.raw_premium == Decimal("60.51")
    assert result.final_weekly_premium == Decimal("60.51")
    assert calculate(income="550.05", experience=180, risk="0",
                     location="medium", days=5).experience_adjustment == Decimal("-4.40")


@pytest.fixture
def registered_worker(client, worker_payload):
    worker_payload.update(full_name="Rahul Sharma", average_daily_income="600.00",
                          experience_days=180)
    response = client.post("/workers", json=worker_payload)
    assert response.status_code == 201
    return response.json()


def request_for(worker, **overrides):
    return {"worker_id": worker["id"], "risk_score": 10,
            "location_risk": "high", **overrides}


def test_sqlite_worker_pricing_integration(client, registered_worker):
    response = client.post("/pricing/estimate", json=request_for(registered_worker))
    assert response.status_code == 200
    assert response.json() == {
        "worker_id": registered_worker["id"], "weekly_income": "3600.00",
        "risk_score": "10", "base_premium": "72.00", "risk_loading": "10.80",
        "subtotal": "82.80", "location_adjustment": "8.28",
        "experience_adjustment": "-6.62", "raw_premium": "84.46",
        "final_weekly_premium": "84.46", "calculation_method": "simulated_risk_score",
    }
    assert client.get("/workers/" + registered_worker["id"]).json() == registered_worker
    assert len(client.get("/workers").json()) == 1


@pytest.mark.parametrize("days", [1, 7])
def test_allowed_work_days(client, registered_worker, days):
    response = client.post("/pricing/estimate", json=request_for(
        registered_worker, work_days_per_week=days))
    assert response.status_code == 200
    assert Decimal(response.json()["weekly_income"]) == Decimal("600") * days


def test_unknown_worker(client):
    response = client.post("/pricing/estimate", json=request_for({"id": str(uuid4())}))
    assert response.status_code == 404
    assert response.json() == {"detail": "Worker not found"}


@pytest.mark.parametrize("field,value", [
    ("risk_score", -1), ("risk_score", 101), ("risk_score", True),
    ("risk_score", "10"), ("risk_score", None), ("risk_score", []),
    ("risk_score", 0.1234567890123),
    ("location_risk", "extreme"), ("location_risk", 1),
    ("work_days_per_week", 0), ("work_days_per_week", 8),
    ("work_days_per_week", 6.5), ("work_days_per_week", "6"),
    ("work_days_per_week", True), ("worker_id", "invalid"),
    ("average_daily_income", "900"), ("experience_days", 180),
])
def test_invalid_inputs(client, registered_worker, field, value):
    response = client.post("/pricing/estimate", json=request_for(
        registered_worker, **{field: value}))
    assert response.status_code == 422


@pytest.mark.parametrize("field", ["worker_id", "risk_score", "location_risk"])
def test_required_inputs(client, registered_worker, field):
    payload = request_for(registered_worker)
    del payload[field]
    assert client.post("/pricing/estimate", json=payload).status_code == 422


@pytest.mark.parametrize("risk", ["NaN", "Infinity", "-Infinity"])
def test_nonfinite_risk(client, registered_worker, risk):
    # Raw JSON also checks Python's permissive parser for non-standard constants.
    body = ('{"worker_id":"' + registered_worker["id"]
            + '","location_risk":"high","risk_score":' + risk + '}')
    assert client.post("/pricing/estimate", content=body,
                       headers={"Content-Type": "application/json"}).status_code == 422


def test_pricing_in_openapi(client):
    schema = client.get("/openapi.json").json()
    assert "post" in schema["paths"]["/pricing/estimate"]
    assert client.get("/docs").status_code == 200
