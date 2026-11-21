"""Auth dependencies: who is calling, and are they allowed?

Controlled by the AUTH_ENFORCED environment variable (default: off).
Off  -> nothing is blocked (current frontend keeps working).
On   -> missing/invalid tokens get 401, wrong role or wrong worker gets 403.
"""

import os
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.auth_utils import decode_token
from app.database import get_db
from app.models import User, UserRole


def auth_enforced() -> bool:
    return os.getenv("AUTH_ENFORCED", "false").strip().lower() in ("1", "true", "yes")


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    user = None
    if authorization and authorization.lower().startswith("bearer "):
        user_id = decode_token(authorization[7:].strip())
        if user_id:
            try:
                user = db.get(User, UUID(user_id))
            except ValueError:
                user = None
    if user is None and auth_enforced():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: User | None = Depends(get_current_user)) -> User | None:
    if not auth_enforced():
        return user
    if user is None or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def ensure_self_or_admin(user: User | None, worker_id: UUID) -> None:
    """Raise 403 unless the caller is an admin or owns this worker profile."""
    if not auth_enforced():
        return
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token")
    if user.role == UserRole.ADMIN or user.worker_id == worker_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own data")


def require_self_or_admin(worker_id: UUID, user: User | None = Depends(get_current_user)) -> User | None:
    """For routes with a {worker_id} path parameter."""
    ensure_self_or_admin(user, worker_id)
    return user