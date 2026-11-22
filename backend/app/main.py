"""FastAPI entry point for backend."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app.auth_utils import hash_password
from app.database import Base, make_engine, make_session_factory
from app.models import User, UserRole
from app.routers.auth import router as auth_router
from app.routers.claims import router as claims_router
from app.routers.pricing import router as pricing_router
from app.routers.risk import router as risk_router
from app.routers.signals import router as signals_router
from app.routers.workers import router as workers_router

logger = logging.getLogger("gig_guard")

DEV_ADMIN_PASSWORD = "admin123"


def seed_default_admin(session_factory):
    """Create the admin account if it does not exist. Never overwrites an existing password.

    The password comes from the ADMIN_PASSWORD environment variable.
    Without it, a development default is used and a warning is logged.
    """
    with session_factory() as session:
        admin_user = session.scalar(select(User).where(func.lower(User.username) == "admin"))
        if admin_user:
            return

        password = os.getenv("ADMIN_PASSWORD")
        if not password:
            logger.warning(
                "ADMIN_PASSWORD is not set: creating admin with the development default. "
                "Set ADMIN_PASSWORD before any real deployment."
            )
            password = DEV_ADMIN_PASSWORD

        session.add(
            User(
                username="admin",
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
            )
        )
        session.commit()


@asynccontextmanager
async def lifespan(application: FastAPI):
    Base.metadata.create_all(application.state.engine)
    seed_default_admin(application.state.session_factory)
    try:
        yield
    finally:
        application.state.engine.dispose()


app = FastAPI(title="GIG-Guard API", version="0.1.0", lifespan=lifespan)
app.state.engine = make_engine()
app.state.session_factory = make_session_factory(app.state.engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(workers_router)
app.include_router(pricing_router)
app.include_router(risk_router)
app.include_router(claims_router)
app.include_router(signals_router)


@app.get("/")
def root() -> dict[str, str]:
    """Return a welcome message for the API."""
    return {"message": "Welcome to GIG-Guard API"}


@app.get("/health")
def health() -> dict[str, str]:
    """Confirm the API can respond to requests."""
    return {"status": "ok"}