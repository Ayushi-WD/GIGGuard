"""Request and response shapes for the policy, simulation, claims and payout endpoints."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models import ClaimStatus, DisruptionType, PolicyStatus


class PolicyCreate(BaseModel):
    worker_id: UUID
    premium: Decimal = Field(ge=49, le=99, decimal_places=2)
    risk_score: float = Field(ge=0, le=100)
    week_start: date | None = None  # defaults to today; coverage lasts 7 days


class PolicyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    worker_id: UUID
    week_start: date
    week_end: date
    premium: Decimal
    risk_score: float
    status: PolicyStatus


class SimulateRequest(BaseModel):
    city: str = Field(min_length=2, max_length=100)
    disruption_type: DisruptionType
    value: float = Field(ge=0, description="mm of rain, deg C, or AQI; use 1 for flood/curfew")
    duration_hours: float = Field(default=8, gt=0, le=24)


class SimulateResponse(BaseModel):
    triggered: bool
    severity_pct: int
    event_id: UUID | None
    claims_created: int
    total_payout: Decimal


class ClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    policy_id: UUID
    event_id: UUID
    payout_amount: Decimal
    status: ClaimStatus
    fraud_score: float | None
    created_at: datetime


class PayoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    claim_id: UUID
    worker_id: UUID
    amount: Decimal
    paid_at: datetime