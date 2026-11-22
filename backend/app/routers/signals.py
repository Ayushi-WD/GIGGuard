"""Location pings (from workers' devices) and customer reviews."""

from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import LocationPing, Review, User, Worker
from app.security import ensure_self_or_admin, get_current_user, require_admin, require_self_or_admin
from app.signals_schemas import PingCreate, PingOut, ReviewCreate, ReviewOut

router = APIRouter(tags=["signals"])

MAX_CLOCK_SKEW = timedelta(minutes=5)


@router.post("/pings", response_model=PingOut, status_code=201)
def record_ping(
    body: PingCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_current_user)],
):
    """Store one GPS position for a worker."""
    ensure_self_or_admin(user, body.worker_id)
    if db.get(Worker, body.worker_id) is None:
        raise HTTPException(status_code=404, detail="Worker not found")

    now = datetime.now(timezone.utc)
    when = body.recorded_at or now
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    if when > now + MAX_CLOCK_SKEW:
        raise HTTPException(status_code=422, detail="recorded_at cannot be in the future")

    ping = LocationPing(
        worker_id=body.worker_id,
        latitude=body.latitude,
        longitude=body.longitude,
        accuracy_m=body.accuracy_m,
        source=body.source,
        recorded_at=when,
    )
    db.add(ping)
    db.commit()
    db.refresh(ping)
    return ping


@router.get(
    "/pings/worker/{worker_id}",
    response_model=list[PingOut],
    dependencies=[Depends(require_self_or_admin)],
)
def worker_pings(
    worker_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(default=100, ge=1, le=1000),
):
    """A worker's most recent positions, newest first."""
    return db.scalars(
        select(LocationPing)
        .where(LocationPing.worker_id == worker_id)
        .order_by(LocationPing.recorded_at.desc())
        .limit(limit)
    ).all()


@router.post(
    "/reviews",
    response_model=ReviewOut,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
def add_review(body: ReviewCreate, db: Annotated[Session, Depends(get_db)]):
    """Record a customer review. Admin-only: stands in for a platform review feed."""
    if db.get(Worker, body.worker_id) is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    review = Review(
        worker_id=body.worker_id,
        rating=body.rating,
        text=body.text,
        on_time=body.on_time,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get(
    "/reviews/worker/{worker_id}",
    response_model=list[ReviewOut],
    dependencies=[Depends(require_self_or_admin)],
)
def worker_reviews(worker_id: UUID, db: Annotated[Session, Depends(get_db)]):
    return db.scalars(
        select(Review)
        .where(Review.worker_id == worker_id)
        .order_by(Review.created_at.desc())
    ).all()