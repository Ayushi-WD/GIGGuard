from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import (
    Claim, ClaimStatus, DisruptionEvent, DisruptionType as D, Platform, Policy, Worker,
)
from app.services.risk_inputs import (
    build_risk_features, city_profile, claim_rate_prior, festival_for, season_for,
)
from ml_models.features import FEATURES, validate_features


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def make_worker(db, city="Mumbai", platform=Platform.ZOMATO, income="500.00", experience=200):
    worker = Worker(full_name="T", city=city, platform=platform,
                    average_daily_income=Decimal(income), experience_days=experience)
    db.add(worker)
    db.flush()
    return worker


def add_claim(db, worker, policy, status):
    event = DisruptionEvent(city=worker.city, disruption_type=D.RAIN, measured_value=60.0,
                            severity_pct=70, duration_hours=8.0, source="simulated")
    db.add(event)
    db.flush()
    db.add(Claim(policy_id=policy.id, worker_id=worker.id, event_id=event.id,
                 payout_amount=Decimal("100.00"), status=status))
    db.flush()


def test_features_match_the_model_contract(db):
    features = build_risk_features(db, make_worker(db), today=date(2026, 7, 15))
    assert set(features) == set(FEATURES)
    validate_features(features)  # raises if anything is out of range


def test_income_is_clamped_to_model_range(db):
    rich = build_risk_features(db, make_worker(db, income="2500.00"))
    poor = build_risk_features(db, make_worker(db, income="100.00"))
    assert rich["average_daily_income"] == 2000
    assert poor["average_daily_income"] == 200


def test_experience_is_clamped_and_integer(db):
    features = build_risk_features(db, make_worker(db, experience=9999))
    assert features["experience_days"] == 3650
    assert isinstance(features["experience_days"], int)


def test_unknown_city_uses_default_profile(db):
    features = build_risk_features(db, make_worker(db, city="Springfield"))
    validate_features(features)
    assert features["historical_rain_risk"] == 50


def test_city_is_case_insensitive_and_has_aliases(db):
    a = build_risk_features(db, make_worker(db, city="  MUMBAI "))
    b = build_risk_features(db, make_worker(db, city="mumbai"))
    c = build_risk_features(db, make_worker(db, city="Bangalore"))
    d = build_risk_features(db, make_worker(db, city="Bengaluru"))
    assert a == b
    assert c == d


def test_season_and_festival_follow_the_calendar():
    assert season_for(date(2026, 1, 10)) == "winter"
    assert season_for(date(2026, 4, 10)) == "summer"
    assert season_for(date(2026, 7, 10)) == "monsoon"
    assert season_for(date(2026, 11, 21)) == "post_monsoon"
    assert festival_for(date(2026, 11, 21)) == 1
    assert festival_for(date(2026, 7, 10)) == 0


def test_claim_rate_starts_typical_then_rises_with_claims_and_caps(db):
    worker = make_worker(db)  # Mumbai, Zomato
    prior = claim_rate_prior(city_profile("Mumbai"), 0.45)
    assert build_risk_features(db, worker)["historical_claim_rate"] == pytest.approx(prior)

    policy = Policy(worker_id=worker.id, week_start=date.today(), week_end=date.today(),
                    premium=Decimal("70.00"), risk_score=55.0)
    db.add(policy)
    db.flush()
    for status in (ClaimStatus.PENDING, ClaimStatus.APPROVED, ClaimStatus.REVIEW,
                   ClaimStatus.REJECTED):
        add_claim(db, worker, policy, status)
    # 3 counted claims over 12 weeks = +0.25; the rejected one is ignored
    assert build_risk_features(db, worker)["historical_claim_rate"] == pytest.approx(prior + 0.25)

    for _ in range(4):
        add_claim(db, worker, policy, ClaimStatus.APPROVED)
    assert build_risk_features(db, worker)["historical_claim_rate"] == 0.5  # capped


def test_platform_changes_volatility(db):
    zepto = build_risk_features(db, make_worker(db, platform=Platform.ZEPTO))
    swiggy = build_risk_features(db, make_worker(db, platform=Platform.SWIGGY))
    assert zepto["platform_volatility"] != swiggy["platform_volatility"]