import os
import io
import shutil
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from PIL import Image

from backend.app.core.config import settings
from backend.app.models.base import Base
from backend.app.db.session import get_db
from backend.app.main import app
from backend.app.storage.local import LocalStorageBackend
import backend.app.storage as storage_module

# Test database engine (SQLite file in temp directory or memory)
@pytest.fixture(scope="session")
def test_dir():
    d = tempfile.mkdtemp(prefix="peblo_test_")
    yield Path(d)
    shutil.rmtree(d, ignore_errors=True)

@pytest.fixture(scope="function")
def db_session(test_dir):
    db_file = test_dir / "test.db"
    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def test_storage(test_dir):
    storage_dir = test_dir / "storage"
    storage = LocalStorageBackend(str(storage_dir))
    # Monkeypatch storage instance
    orig = storage_module._storage_instance
    storage_module._storage_instance = storage
    yield storage
    storage_module._storage_instance = orig

@pytest.fixture(scope="function")
def client(db_session, test_storage):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
