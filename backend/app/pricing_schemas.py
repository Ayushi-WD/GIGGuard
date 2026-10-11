"""Input validation and public response for premium estimates."""

from decimal import Decimal
from math import isfinite
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from fastapi import HTTPException

from app.services.pricing import LocationRisk


class PricingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    worker_id: UUID
    risk_score: Decimal = Field(ge=0, le=100, max_digits=16, decimal_places=12,
                                allow_inf_nan=False)
    location_risk: LocationRisk
    work_days_per_week: int = Field(default=6, ge=1, le=7, strict=True)

    @field_validator("risk_score", mode="before")
    @classmethod
    def numeric_risk_score(cls, value):
        if isinstance(value, float) and not isfinite(value):
            # FastAPI's default error response cannot serialize NaN/Infinity
            # echoed from Python's permissive JSON parser. Return a safe 422.
            raise HTTPException(status_code=422, detail=[{
                "loc": ["body", "risk_score"], "type": "finite_number",
                "msg": "Risk score must be a finite JSON number",
            }])
        if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
            raise ValueError("Risk score must be a JSON number")
        return value


class PricingResponse(BaseModel):
    worker_id: UUID
    weekly_income: Decimal
    risk_score: Decimal
    base_premium: Decimal
    risk_loading: Decimal
    subtotal: Decimal
    location_adjustment: Decimal
    experience_adjustment: Decimal
    raw_premium: Decimal
    final_weekly_premium: Decimal
    calculation_method: Literal["simulated_risk_score"] = "simulated_risk_score"
