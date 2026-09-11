import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.db.session import init_db
from backend.app.db.seed import seed_database
from backend.app.api.admin import router as admin_router
from backend.app.api.catalog import router as catalog_router
from backend.app.api.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and seed initial shows
    print(f"[{settings.PROJECT_NAME}] Starting up. Initializing database schema...")
    init_db()
    try:
        seed_database(force=False)
    except Exception as e:
        print(f"[{settings.PROJECT_NAME}] Seed notice: {e}")
    yield
    print(f"[{settings.PROJECT_NAME}] Shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend platform for Peblo TV Mini (CMS, Atomic Publisher, and Netflix Viewer)",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local storage directory for static asset previewing
storage_path = Path(settings.STORAGE_DIR)
storage_path.mkdir(parents=True, exist_ok=True)
(storage_path / "artwork").mkdir(exist_ok=True)
(storage_path / "catalog").mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(storage_path)), name="static")

# Mount API Routers
app.include_router(health_router)
app.include_router(catalog_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "catalog": "/catalog",
        "health": "/health"
    }
