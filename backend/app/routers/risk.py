"""Experimental prediction and premium endpoints; synthetic-trained model only."""

from dataclasses import asdict
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Worker
from app.risk_schemas import MLPricingRequest, MLPricingResponse, RiskRequest, RiskResponse
from app.services.pricing import calculate_premium
from app.services.risk import predict_score
from ml_models.features import FEATURES

router = APIRouter(tags=["Experimental ML"])


@router.post("/risk/predict", response_model=RiskResponse,
             description="Predict a risk index using a model trained on synthetic data, not real claims.")
def predict_worker_risk(payload: RiskRequest):
    return RiskResponse(predicted_risk_score=predict_score(payload.model_dump()))


@router.post("/pricing/estimate-ml", response_model=MLPricingResponse,
             description="Use saved worker data and a synthetic-trained risk model to estimate a premium.")
def estimate_ml_premium(payload: MLPricingRequest, db: Annotated[Session, Depends(get_db)]):
    worker = db.get(Worker, payload.worker_id)
    if worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    features = payload.model_dump(include=set(FEATURES))
    features.update(average_daily_income=float(worker.average_daily_income),
                    experience_days=worker.experience_days)
    score = predict_score(features)
    breakdown = asdict(calculate_premium(
        average_daily_income=worker.average_daily_income,
        experience_days=worker.experience_days, risk_score=Decimal(str(score)),
        location_risk=payload.location_risk, work_days_per_week=payload.work_days_per_week,
    ))
    # The ML response names this predicted_risk_score; the original service's
    # risk_score field remains unchanged for the existing manual endpoint.
    breakdown.pop("risk_score")
    return MLPricingResponse(worker_id=worker.id, predicted_risk_score=score, **breakdown)
