"""Validate registration requests and describe public worker responses."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import Platform


class WorkerCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    full_name: str = Field(min_length=1, max_length=150)
    city: str = Field(min_length=1, max_length=100)
    platform: Platform
    average_daily_income: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    experience_days: int = Field(ge=0, strict=True)


class WorkerResponse(WorkerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def timestamp_in_utc(cls, value: datetime) -> datetime:
        # SQLite drops timezone metadata; all stored timestamps originate in UTC.
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
