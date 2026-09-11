from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings

# Support sqlite thread checking configuration
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

MIGRATED_TABLES = {"shows", "seasons", "episodes", "artwork", "publish_runs"}


def run_migrations() -> None:
    """Bring the configured database to Alembic head before serving requests.

    Earlier local databases were created through SQLAlchemy metadata rather
    than Alembic. If one has the complete pre-Alembic schema, stamp it at the
    initial revision once; new and partially-created databases always use the
    migration chain and fail safely rather than guessing their schema.
    """
    project_root = Path(__file__).resolve().parents[3]
    alembic_config = Config(str(project_root / "alembic.ini"))
    alembic_config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

    existing_tables = set(inspect(engine).get_table_names())
    has_version_table = "alembic_version" in existing_tables
    existing_app_tables = existing_tables & MIGRATED_TABLES
    current_revision = None
    if has_version_table:
        with engine.connect() as connection:
            current_revision = connection.execute(
                text("SELECT version_num FROM alembic_version LIMIT 1")
            ).scalar_one_or_none()

    if not current_revision and existing_app_tables:
        if existing_app_tables != MIGRATED_TABLES:
            raise RuntimeError(
                "Database has a partial pre-Alembic schema. Restore it or "
                "migrate it manually before starting the application."
            )
        command.stamp(alembic_config, "head", purge=True)

    command.upgrade(alembic_config, "head")


def init_db() -> None:
    """Backward-compatible alias for callers that need initialized schema."""
    run_migrations()
