from backend.app.core.config import settings
from backend.app.storage.base import StorageBackend
from backend.app.storage.local import LocalStorageBackend
from backend.app.storage.r2 import CloudflareR2StorageBackend

_storage_instance: StorageBackend = None

def get_storage() -> StorageBackend:
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_BACKEND == "r2":
            _storage_instance = CloudflareR2StorageBackend(
                endpoint_url=settings.R2_ENDPOINT_URL,
                bucket_name=settings.R2_BUCKET_NAME,
                access_key_id=settings.R2_ACCESS_KEY_ID,
                secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                public_base_url=settings.R2_PUBLIC_BASE_URL
            )
        else:
            _storage_instance = LocalStorageBackend(settings.STORAGE_DIR)
    return _storage_instance

__all__ = ["StorageBackend", "LocalStorageBackend", "CloudflareR2StorageBackend", "get_storage"]
