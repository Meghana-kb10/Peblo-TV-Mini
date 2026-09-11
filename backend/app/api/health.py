import time
import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.services.catalog_state import load_current_catalogue
from backend.app.storage import get_storage


router = APIRouter(tags=["Health & Operability"])


def probe_storage() -> None:
    """Prove storage can write, read, verify, and remove a temporary object."""
    storage = get_storage()
    probe_path = f"catalog/.healthcheck-{uuid.uuid4().hex}"
    payload = b"peblo-storage-healthcheck"

    try:
        storage.save_file(payload, probe_path)
        if storage.get_file(probe_path) != payload:
            raise RuntimeError("Storage canary read did not match the written value.")
    finally:
        # Cleanup failures are health failures too: silently accumulating probe
        # files hides an incomplete storage permission configuration.
        storage.delete_file(probe_path)


def health_response(db: Session, require_catalogue: bool) -> JSONResponse:
    checks = {
        "api": "healthy",
        "database": "unknown",
        "storage": "unknown",
        "catalogue": "unknown",
        "catalog_published": False,
        "timestamp": time.time(),
    }
    healthy = True

    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as exc:
        checks["database"] = f"unhealthy: {exc}"
        healthy = False

    try:
        probe_storage()
        checks["storage"] = "healthy"
    except Exception as exc:
        checks["storage"] = f"unhealthy: {exc}"
        healthy = False

    if checks["database"] == "healthy" and checks["storage"] == "healthy":
        try:
            catalogue, reason = load_current_catalogue(db, get_storage())
            if catalogue:
                checks["catalogue"] = "published"
                checks["catalog_published"] = True
                checks["catalog_published_at"] = catalogue.get("published_at")
                checks["catalog_shows"] = catalogue.get("counts", {}).get("shows", 0)
            else:
                checks["catalogue"] = reason
                if require_catalogue:
                    healthy = False
        except Exception as exc:
            checks["catalogue"] = f"unavailable: {exc}"
            # A catalogue read error is a storage failure, not an acceptable
            # "not published yet" state. Never mask it behind a healthy 200.
            healthy = False

    status_code = status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=checks)


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Liveness: API, database, and full storage canary must be operational."""
    return health_response(db, require_catalogue=False)


@router.get("/readyz")
def readiness_check(db: Session = Depends(get_db)):
    """Readiness: liveness checks plus a current, successfully-published catalogue."""
    return health_response(db, require_catalogue=True)
