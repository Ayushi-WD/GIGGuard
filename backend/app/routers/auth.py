"""Authentication router for login, registration, and session info."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth_utils import hash_password, verify_password
from app.database import get_db
from app.models import User, UserRole, Worker
from app.schemas import AuthResponse, UserLogin, UserPublic, UserSignUp, WorkerResponse

router = APIRouter(prefix="/auth", tags=["Auth"])
DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: DatabaseSession):
    username = payload.username.strip()
    # Case-insensitive username lookup
    user = db.scalar(select(User).where(func.lower(User.username) == username.lower()))

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    worker = None
    if user.worker_id:
        worker = db.get(Worker, user.worker_id)

    return AuthResponse(
        user=user,
        worker=worker,
        token=f"token_{user.id}",
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignUp, db: DatabaseSession):
    username = payload.username.strip()
    existing = db.scalar(select(User).where(func.lower(User.username) == username.lower()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another username.",
        )

    # 1. Create worker profile
    worker = Worker(
        full_name=payload.full_name,
        city=payload.city,
        platform=payload.platform,
        average_daily_income=payload.average_daily_income,
        experience_days=payload.experience_days,
    )
    db.add(worker)
    db.flush()

    # 2. Create user account linked to worker
    user = User(
        username=username,
        password_hash=hash_password(payload.password),
        role=UserRole.WORKER,
        worker_id=worker.id,
    )
    db.add(user)
    db.commit()
    db.refresh(worker)
    db.refresh(user)

    return AuthResponse(
        user=user,
        worker=worker,
        token=f"token_{user.id}",
    )


@router.get("/users", response_model=list[UserPublic])
def list_users(db: DatabaseSession):
    return db.scalars(select(User).order_by(User.created_at)).all()
