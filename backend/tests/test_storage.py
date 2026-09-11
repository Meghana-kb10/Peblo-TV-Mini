import pytest
import os
from pathlib import Path
from backend.app.storage.local import LocalStorageBackend
from backend.app.storage.r2 import CloudflareR2StorageBackend

def test_local_storage_atomic_write_json(test_dir):
    storage = LocalStorageBackend(str(test_dir / "atomic_storage"))
    target_file = "catalog/test_catalog.json"
    data = {"name": "Test Catalogue", "items": [1, 2, 3]}

    # Write atomically
    storage.atomic_write_json(data, target_file)

    # Verify exists and read matches
    assert storage.exists(target_file)
    read_data = storage.read_json(target_file)
    assert read_data == data

    # Verify no temp files left in directory
    catalog_dir = test_dir / "atomic_storage" / "catalog"
    files = list(catalog_dir.iterdir())
    assert len(files) == 1
    assert files[0].name == "test_catalog.json"

def test_local_storage_path_traversal_prevention(test_dir):
    storage = LocalStorageBackend(str(test_dir / "traversal_storage"))
    with pytest.raises(ValueError) as exc:
        storage._resolve_path("../../../outside.txt")
    assert "Illegal path traversal" in str(exc.value)

def test_r2_storage_interface_conformance():
    # Verify R2 backend implements the StorageBackend contract
    r2 = CloudflareR2StorageBackend(
        endpoint_url="https://fake.r2.cloudflarestorage.com",
        bucket_name="test-bucket",
        access_key_id="dummy_key",
        secret_access_key="dummy_secret",
        public_base_url="https://cdn.peblo.tv"
    )
    assert r2.get_public_url("artwork/poster.jpg") == "https://cdn.peblo.tv/artwork/poster.jpg"
