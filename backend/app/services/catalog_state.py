from typing import Optional, Tuple

from sqlalchemy.orm import Session

from backend.app.models.publish_run import PublishRun
from backend.app.storage.base import StorageBackend


CATALOGUE_PATH = "catalog/catalogue.json"


def load_current_catalogue(
    db: Session, storage: StorageBackend
) -> Tuple[Optional[dict], Optional[str]]:
    """Return only a catalogue created by a successful run in this database.

    This prevents a persisted storage volume (or an old R2 object) from being
    served after its database has been reset or replaced.
    """
    catalogue = storage.read_json(CATALOGUE_PATH)
    if not catalogue:
        return None, "No catalogue has been published yet."

    run_id = catalogue.get("publish_run_id")
    if not run_id:
        return None, "Catalogue has no publish-run provenance and will not be served."

    run = (
        db.query(PublishRun)
        .filter(PublishRun.id == run_id, PublishRun.status == "success")
        .first()
    )
    if not run or run.catalogue_path != CATALOGUE_PATH:
        return None, "Catalogue is not backed by a successful publish run in this database."

    return catalogue, None
