"""FastAPI entry point for the GIG-Guard backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, make_engine, make_session_factory
from app.routers.workers import router as workers_router


@asynccontextmanager
async def lifespan(application: FastAPI):
    Base.metadata.create_all(application.state.engine)
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

app.include_router(workers_router)


@app.get("/")
def root() -> dict[str, str]:
    """Return a welcome message identifying this API."""
    return {"message": "Welcome to GIG-Guard API"}


@app.get("/health")
def health() -> dict[str, str]:
    """Confirm that the API can respond to requests."""
    return {"status": "ok"}
