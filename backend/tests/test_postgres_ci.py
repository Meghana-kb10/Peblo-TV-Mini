import os

import pytest
from sqlalchemy import create_engine, inspect, text

from backend.app.db.session import run_migrations


@pytest.mark.skipif(
    not os.getenv("DATABASE_URL", "").startswith("postgresql"),
    reason="PostgreSQL service is configured only in CI.",
)
def test_postgres_service_accepts_connections_and_migrations():
    """Exercise the GitHub Actions PostgreSQL service without replacing SQLite unit tests."""
    run_migrations()
    engine = create_engine(os.environ["DATABASE_URL"])
    try:
        with engine.connect() as connection:
            assert connection.execute(text("SELECT 1")).scalar_one() == 1
        tables = set(inspect(engine).get_table_names())
        assert {"alembic_version", "shows", "seasons", "episodes", "artwork", "publish_runs"} <= tables
    finally:
        engine.dispose()
