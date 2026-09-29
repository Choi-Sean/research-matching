import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (register tables)
from app.config import settings
from app.db import Base, engine
from app.routers import (
    admin,
    applications,
    auth,
    billing,
    community,
    discover,
    health,
    invitations,
    labs,
    match,
    positions,
    tools,
    workspace,
)

logging.basicConfig(level=logging.INFO)
logging.getLogger("pytds").setLevel(logging.WARNING)  # the SQL Server driver logs every RPC at INFO
log = logging.getLogger("labora")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.is_production:
        if settings.secret_key.startswith("dev-only"):
            raise RuntimeError("SECRET_KEY must be set to a long random value in production.")
        if settings.auto_verify_professors:
            log.warning("AUTO_VERIFY_PROFESSORS is on — every professor sign-up is trusted. Turn it off in production.")
    Base.metadata.create_all(engine)  # TODO: replace with Alembic migrations before the first schema change in prod
    yield


app = FastAPI(title="Labora API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (
    health.router,
    auth.router,
    labs.router,
    positions.router,
    applications.router,
    discover.router,
    tools.router,
    match.router,
    invitations.router,
    workspace.router,
    billing.router,
    community.router,
    admin.router,
):
    app.include_router(r)
