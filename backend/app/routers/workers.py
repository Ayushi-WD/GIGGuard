"""Register workers and read their saved profiles."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Worker
from app.schemas import WorkerCreate, WorkerResponse

router = APIRouter(prefix="/workers", tags=["Workers"])
DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
def register_worker(payload: WorkerCreate, db: DatabaseSession):
    worker = Worker(**payload.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


@router.get("", response_model=list[WorkerResponse])
def list_workers(db: DatabaseSession):
    return db.scalars(select(Worker).order_by(Worker.created_at, Worker.id)).all()


@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: UUID, db: DatabaseSession):
    worker = db.get(Worker, worker_id)
    if worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker
