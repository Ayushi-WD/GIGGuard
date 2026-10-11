"""Read saved worker details and return a simulated-risk premium estimate."""

from dataclasses import asdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Worker
from app.pricing_schemas import PricingRequest, PricingResponse
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
