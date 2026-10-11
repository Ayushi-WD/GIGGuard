"""Database configuration and one SQLAlchemy session per request."""

import os
from pathlib import Path

from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


DEFAULT_DATABASE_URL = "sqlite:///" + (
    Path(__file__).resolve().parents[1] / "gig_guard.db"
).as_posix()


def make_engine(database_url: str | None = None):
    url = make_url(database_url or os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))
    options = {"check_same_thread": False} if url.get_backend_name() == "sqlite" else {}
    return create_engine(url, connect_args=options)


def make_session_factory(engine):
    return sessionmaker(bind=engine, expire_on_commit=False)


def get_db(request: Request):
    with request.app.state.session_factory() as session:
        yield session
