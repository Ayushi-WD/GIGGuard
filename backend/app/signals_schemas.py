"""Request and response shapes for location pings and reviews."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PingCreate(BaseModel):
    worker_id: UUID
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_m: float | None = Field(default=None, ge=0)
    recorded_at: datetime | None = None  # defaults to server time
    source: Literal["device", "simulated"] = "device"


class PingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    worker_id: UUID
    latitude: float
    longitude: float
    accuracy_m: float | None
    source: str
    recorded_at: datetime


class ReviewCreate(BaseModel):
    worker_id: UUID
    rating: int = Field(ge=1, le=5, strict=True)
    text: str = Field(min_length=1, max_length=1000)
    on_time: bool | None = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    worker_id: UUID
    rating: int
    text: str
    on_time: bool | None
    created_at: datetime