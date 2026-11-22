"""Database configuration and one SQLAlchemy session per request."""

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None
from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]

# Load backend/.env for the running app. Never under pytest, so tests
# always stay on SQLite and cannot reach the hosted database.
if "pytest" not in sys.modules and load_dotenv is not None:
    load_dotenv(BACKEND_DIR / ".env", override=False)


class Base(DeclarativeBase):
    pass


DEFAULT_DATABASE_URL = "sqlite:///" + (BACKEND_DIR / "gig_guard.db").as_posix()


def make_engine(database_url: str | None = None):
    url = make_url(database_url or os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))

    # Accept the string exactly as Supabase shows it.
    if url.drivername in ("postgres", "postgresql"):
        url = url.set(drivername="postgresql+psycopg")

    if url.get_backend_name() == "sqlite":
        return create_engine(url, connect_args={"check_same_thread": False})

    return create_engine(
        url,
        pool_pre_ping=True,   # drop dead connections instead of erroring
        pool_recycle=300,     # refresh connections every 5 minutes
        pool_size=5,
        max_overflow=5,
    )


def make_session_factory(engine):
    return sessionmaker(bind=engine, expire_on_commit=False)


def get_db(request: Request):
    with request.app.state.session_factory() as session:
        yield session