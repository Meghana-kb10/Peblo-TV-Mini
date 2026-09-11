import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class Artwork(Base):
    __tablename__ = "artwork"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    show_id = Column(String(36), ForeignKey("shows.id", ondelete="CASCADE"), nullable=True, index=True)
    episode_id = Column(String(50), ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True, index=True)
    artwork_type = Column(String(20), nullable=False)  # 'poster', 'banner', 'thumbnail'
    storage_path = Column(String(500), nullable=False)
    url = Column(String(500), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    aspect_ratio = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    show = relationship("Show", back_populates="artwork")
    episode = relationship("Episode", back_populates="artwork")

    __table_args__ = (
        Index("ix_artwork_show_type", "show_id", "artwork_type"),
        Index("ix_artwork_episode_type", "episode_id", "artwork_type"),
    )
