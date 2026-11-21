from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import (
    Claim,
    ClaimStatus,
    DisruptionType as D,
    Payout,
    Platform,
    Policy,
    PolicyStatus,
    Worker,
)
from app.services.claims import trigger_event


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def make_worker(db, city="Mumbai", income="500.00"):
    worker = Worker(
        full_name="Test Worker",
        city=city,
        platform=Platform.ZOMATO,
        average_daily_income=Decimal(income),
        experience_days=200,
    )
    db.add(worker)
    db.flush()
    return worker


def make_policy(db, worker, start=None, status=PolicyStatus.ACTIVE):
    start = start or date.today()
    policy = Policy(
        worker_id=worker.id,
        week_start=start,
        week_end=start + timedelta(days=6),
        premium=Decimal("70.00"),
        risk_score=55.0,
        status=status,
    )
    db.add(policy)
    db.flush()
    return policy


def test_below_threshold_creates_nothing(db):
    worker = make_worker(db)
    make_policy(db, worker)
    event, claims = trigger_event(
        db, city="Mumbai", disruption_type=D.RAIN, value=10,
        duration_hours=8, source="simulated",
    )
    assert event is None
    assert claims == []


def test_claim_created_for_covered_worker(db):
    worker = make_worker(db)
    make_policy(db, worker)
    event, claims = trigger_event(
        db, city="Mumbai", disruption_type=D.RAIN, value=60,
        duration_hours=8, source="simulated",
    )
    assert event.severity_pct == 70
    assert len(claims) == 1
    assert claims[0].payout_amount == Decimal("262.50")  # 500 * 0.70 * 0.75
    assert claims[0].status == ClaimStatus.PENDING


def test_city_match_is_case_insensitive(db):
    worker = make_worker(db, city="Mumbai")
    make_policy(db, worker)
    _, claims = trigger_event(
        db, city="  mumbai ", disruption_type=D.RAIN, value=60,
        duration_hours=8, source="simulated",
    )
    assert len(claims) == 1


def test_other_city_not_affected(db):
    worker = make_worker(db, city="Delhi")
    make_policy(db, worker)
    _, claims = trigger_event(
        db, city="Mumbai", disruption_type=D.RAIN, value=60,
        duration_hours=8, source="simulated",
    )
    assert claims == []


def test_expired_or_cancelled_policy_gets_no_claim(db):
    w1, w2 = make_worker(db), make_worker(db)
    make_policy(db, w1, status=PolicyStatus.CANCELLED)
    make_policy(db, w2, start=date.today() - timedelta(days=30))  # week is over
    _, claims = trigger_event(
        db, city="Mumbai", disruption_type=D.RAIN, value=60,
        duration_hours=8, source="simulated",
    )
    assert claims == []


def test_two_disruptions_same_day_apply_weather_multiplier(db):
    worker = make_worker(db)
    make_policy(db, worker)
    now = datetime.now(timezone.utc)
    trigger_event(db, city="Mumbai", disruption_type=D.RAIN, value=60,
                  duration_hours=8, source="simulated", now=now)
    _, claims = trigger_event(db, city="Mumbai", disruption_type=D.AQI, value=250,
                              duration_hours=8, source="simulated", now=now)
    # 500 * 0.60 * 1.10 * 0.75 = 247.50
    assert claims[0].payout_amount == Decimal("247.50")


def test_auto_approve_creates_one_payout(db):
    worker = make_worker(db)
    make_policy(db, worker)
    _, claims = trigger_event(
        db, city="Mumbai", disruption_type=D.RAIN, value=60,
        duration_hours=8, source="simulated", auto_approve=True,
    )
    payouts = db.scalars(select(Payout)).all()
    assert len(payouts) == 1
    assert payouts[0].amount == Decimal("262.50")
    assert claims[0].status == ClaimStatus.APPROVED


def test_same_event_cannot_double_claim(db):
    worker = make_worker(db)
    make_policy(db, worker)
    trigger_event(db, city="Mumbai", disruption_type=D.RAIN, value=60,
                  duration_hours=8, source="simulated")
    db.commit()
    assert len(db.scalars(select(Claim)).all()) == 1