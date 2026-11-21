"""Policy activation, disruption simulation and claim listing endpoints."""

from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.claims_schemas import (
    ClaimOut,
    PolicyCreate,
    PolicyOut,
    SimulateRequest,
    SimulateResponse,
)
from app.database import get_db  # confirm this name with the check command below
from app.models import Claim, Policy, PolicyStatus, Worker
from app.services.claims import trigger_event

router = APIRouter(tags=["claims"])


@router.post("/policies", response_model=PolicyOut, status_code=201)
def activate_policy(body: PolicyCreate, db: Session = Depends(get_db)):
    if db.get(Worker, body.worker_id) is None:
        raise HTTPException(status_code=404, detail="Worker not found")

    start = body.week_start or date.today()
    end = start + timedelta(days=6)

    overlap = db.scalar(
        select(Policy).where(
            Policy.worker_id == body.worker_id,
            Policy.status == PolicyStatus.ACTIVE,
            Policy.week_start <= end,
            Policy.week_end >= start,
        )
    )
    if overlap:
        raise HTTPException(
            status_code=409, detail="Worker already has an active policy for this week"
        )

    policy = Policy(
        worker_id=body.worker_id,
        week_start=start,
        week_end=end,
        premium=body.premium,
        risk_score=body.risk_score,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.post("/simulate/disruption", response_model=SimulateResponse)
def simulate_disruption(
    body: SimulateRequest,
    auto_approve: bool = False,
    db: Session = Depends(get_db),
):
    # TODO: restrict to admin users once auth is wired in
    event, claims = trigger_event(
        db,
        city=body.city,
        disruption_type=body.disruption_type,
        value=body.value,
        duration_hours=body.duration_hours,
        source="simulated",
        auto_approve=auto_approve,
    )
    db.commit()

    if event is None:
        return SimulateResponse(
            triggered=False,
            severity_pct=0,
            event_id=None,
            claims_created=0,
            total_payout=Decimal("0.00"),
        )
    return SimulateResponse(
        triggered=True,
        severity_pct=event.severity_pct,
        event_id=event.id,
        claims_created=len(claims),
        total_payout=sum((c.payout_amount for c in claims), Decimal("0.00")),
    )


@router.get("/claims/worker/{worker_id}", response_model=list[ClaimOut])
def worker_claims(worker_id: UUID, db: Session = Depends(get_db)):
    return db.scalars(
        select(Claim)
        .where(Claim.worker_id == worker_id)
        .order_by(Claim.created_at.desc())
    ).all()