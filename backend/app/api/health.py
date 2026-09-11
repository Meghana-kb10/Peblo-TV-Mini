import os
import time
from pathlib import Path
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.db.session import get_db
from backend.app.storage import get_storage
from backend.app.core.config import settings

router = APIRouter(tags=["Health & Operability"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check for API, Database pool, and Storage availability.
    Used by container orchestration (Docker/K8s/ECS) and synthetic uptime monitoring.
    """
    checks = {
        "api": "healthy",
        "database": "unknown",
        "storage": "unknown",
        "catalog_published": False,
        "timestamp": time.time()
    }
    healthy = True

    # 1. Database Check
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
        healthy = False

    # 2. Storage Check
    try:
        storage = get_storage()
        test_path = "catalog/.healthcheck"
        storage.save_file(b"ok", test_path)
        checks["storage"] = "healthy"
    except Exception as e:
        checks["storage"] = f"unhealthy: {str(e)}"
        healthy = False

    # 3. Published Catalog Status
    try:
        storage = get_storage()
        cat = storage.read_json("catalog/catalogue.json")
        if cat:
            checks["catalog_published"] = True
            checks["catalog_published_at"] = cat.get("published_at")
            checks["catalog_shows"] = cat.get("counts", {}).get("shows", 0)
    except Exception:
        pass

    status_code = status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=checks)
