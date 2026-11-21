"""Creates disruption events and auto-generated claims."""

from datetime import datetime, time, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Claim,
    ClaimStatus,
    DisruptionEvent,
    DisruptionType,
    Payout,
    Policy,
    PolicyStatus,
    Worker,
)
from app.services.trigger import calculate_payout, severity_pct


def settle_claim(db: Session, claim: Claim) -> None:
    """Approve a claim and release the payout. Safe to call twice."""
    if db.scalar(select(Payout).where(Payout.claim_id == claim.id)):
        return
    claim.status = ClaimStatus.APPROVED
    db.add(Payout(claim_id=claim.id, worker_id=claim.worker_id, amount=claim.payout_amount))


def trigger_event(
    db: Session,
    *,
    city: str,
    disruption_type: DisruptionType,
    value: float,
    duration_hours: float,
    source: str,
    auto_approve: bool = False,
    now: datetime | None = None,
) -> tuple[DisruptionEvent | None, list[Claim]]:
    """Record a disruption and create a claim for every covered worker in the city.

    Returns (None, []) if the value does not cross any threshold.
    The caller is responsible for db.commit().
    """
    pct = severity_pct(disruption_type, value)
    if pct == 0:
        return None, []

    now = now or datetime.now(timezone.utc)
    today = now.date()
    city_key = city.strip().lower()

    # Weather multiplier: how many different disruption types hit this city today?
    earlier_types = db.scalars(
        select(DisruptionEvent.disruption_type).where(
            func.lower(DisruptionEvent.city) == city_key,
            DisruptionEvent.detected_at >= datetime.combine(today, time.min, tzinfo=timezone.utc),
        )
    ).all()
    concurrent = len(set(earlier_types) | {disruption_type})

    event = DisruptionEvent(
        city=city.strip(),
        disruption_type=disruption_type,
        measured_value=value,
        severity_pct=pct,
        duration_hours=duration_hours,
        source=source,
        detected_at=now,
    )
    db.add(event)
    db.flush()

    # Every worker in this city with an active policy covering today
    rows = db.execute(
        select(Worker, Policy)
        .join(Policy, Policy.worker_id == Worker.id)
        .where(
            func.lower(Worker.city) == city_key,
            Policy.status == PolicyStatus.ACTIVE,
            Policy.week_start <= today,
            Policy.week_end >= today,
        )
    ).all()

    claims: list[Claim] = []
    for worker, policy in rows:
        claim = Claim(
            policy_id=policy.id,
            worker_id=worker.id,
            event_id=event.id,
            payout_amount=calculate_payout(
                worker.average_daily_income, pct, duration_hours, concurrent
            ),
            status=ClaimStatus.PENDING,
        )
        db.add(claim)
        claims.append(claim)
    db.flush()

    if auto_approve:  # TEMPORARY: replaced by the fraud engine decision in Week 2
        for claim in claims:
            settle_claim(db, claim)
    return event, claims