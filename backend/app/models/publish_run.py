import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime
from backend.app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class PublishRun(Base):
    __tablename__ = "publish_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    triggered_by = Column(String(100), nullable=False, default="admin")
    status = Column(String(20), nullable=False)  # 'success', 'failed'
    show_count = Column(Integer, nullable=False, default=0)
    episode_count = Column(Integer, nullable=False, default=0)
    duration_ms = Column(Integer, nullable=False, default=0)
    error_details = Column(Text, nullable=True)
    catalogue_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
