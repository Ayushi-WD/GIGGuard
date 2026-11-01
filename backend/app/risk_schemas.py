"""API schemas share the ML feature ranges and reject worker-field overrides."""

from typing import Literal
from uuid import UUID
from decimal import Decimal
from math import isfinite

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ml_models.features import NUMERIC_RANGES, SEASONS
from app.services.pricing import LocationRisk
from app.services.risk import validate_risk_features


def feature_field(name):
    low, high = NUMERIC_RANGES[name]
    return Field(ge=low, le=high)


class EnvironmentalFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    historical_rain_risk: float = feature_field("historical_rain_risk")
    historical_heat_risk: float = feature_field("historical_heat_risk")
    historical_flood_risk: float = feature_field("historical_flood_risk")
    weather_forecast_risk: float = feature_field("weather_forecast_risk")
    season_factor: Literal[*SEASONS]
    location_density: float = feature_field("location_density")
    platform_volatility: float = feature_field("platform_volatility")
    historical_claim_rate: float = feature_field("historical_claim_rate")
    current_aqi: float = feature_field("current_aqi")
    festival_season: int = Field(ge=0, le=1, strict=True)

    @field_validator("*", mode="before")
    @classmethod
    def reject_non_numeric_and_nonfinite(cls, value, info):
        if info.field_name not in NUMERIC_RANGES and info.field_name != "work_days_per_week":
            return value
        if isinstance(value, float) and not isfinite(value):
            raise HTTPException(status_code=422, detail=f"{info.field_name} must be finite")
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{info.field_name} must be a JSON number")
        return value


class RiskRequest(EnvironmentalFeatures):
    average_daily_income: float = feature_field("average_daily_income")
    experience_days: int = Field(ge=0, le=3650, strict=True)

    @model_validator(mode="after")
    def shared_feature_validation(self):
        validate_risk_features(self.model_dump())
        return self


class MLPricingRequest(EnvironmentalFeatures):
    worker_id: UUID
    location_risk: LocationRisk
    work_days_per_week: int = Field(default=6, ge=1, le=7, strict=True)


class RiskResponse(BaseModel):
    predicted_risk_score: float = Field(ge=0, le=100, allow_inf_nan=False)
    model_name: Literal["RandomForestRegressor"] = "RandomForestRegressor"
    model_version: Literal["experimental_v1"] = "experimental_v1"
    prediction_source: Literal["synthetic_trained_model"] = "synthetic_trained_model"


class MLPricingResponse(RiskResponse):
    worker_id: UUID
    weekly_income: Decimal
    base_premium: Decimal
    risk_loading: Decimal
    subtotal: Decimal
    location_adjustment: Decimal
    experience_adjustment: Decimal
    raw_premium: Decimal
    final_weekly_premium: Decimal
    calculation_method: Literal["random_forest_synthetic_v1"] = "random_forest_synthetic_v1"
