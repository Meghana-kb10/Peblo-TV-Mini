from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class Episode(Base):
    __tablename__ = "episodes"

    id = Column(String(50), primary_key=True)  # e.g., 'ep_0001'
    season_id = Column(String(36), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False, index=True)
    episode_number = Column(Integer, nullable=False)
    episode_title = Column(String(255), nullable=False)
    duration_seconds = Column(Integer, nullable=True)  # must be >0 to be published
    language = Column(String(10), nullable=False)  # 'en', 'hi'
    content_group = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="published")  # 'published', 'draft'
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    season = relationship("Season", back_populates="episodes")
    artwork = relationship("Artwork", back_populates="episode", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_episodes_cg_lang", "content_group", "language"),
        Index("ix_episodes_status", "status"),
    )
