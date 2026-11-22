"""Read saved worker details and return premium estimates and quotes."""

from dataclasses import asdict
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Worker
from app.pricing_schemas import PricingRequest, PricingResponse, QuoteResponse
from app.security import ensure_self_or_admin, get_current_user
from app.services.policy_pricing import quote_policy
from app.services.pricing import calculate_premium

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.post("/estimate", response_model=PricingResponse)
def estimate_premium(payload: PricingRequest, db: Annotated[Session, Depends(get_db)]):
    worker = db.get(Worker, payload.worker_id)
    if worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    breakdown = calculate_premium(
        average_daily_income=worker.average_daily_income,
        experience_days=worker.experience_days,
        risk_score=payload.risk_score, location_risk=payload.location_risk,
        work_days_per_week=payload.work_days_per_week,
    )
    return PricingResponse(worker_id=worker.id, **asdict(breakdown))


@router.get("/quote/{worker_id}", response_model=QuoteResponse)
def quote_for_worker(
    worker_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_current_user)],
):
    """The exact weekly premium POST /policies would charge this worker today.

    Uses the same server-side code as policy activation. Nothing is saved.
    """
    ensure_self_or_admin(user, worker_id)
    worker = db.get(Worker, worker_id)
    if worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    quote = quote_policy(db, worker)
    return QuoteResponse(
        worker_id=worker.id,
        risk_score=quote.risk_score,
        weekly_premium=quote.premium,
        pricing_method=quote.method,
    )