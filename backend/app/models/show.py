import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class Show(Base):
    __tablename__ = "shows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    section = Column(String(50), nullable=True, index=True)  # featured, series, minisodes, songs
    categories = Column(JSON, nullable=False, default=list)  # list of strings
    synopsis = Column(Text, nullable=False, default="")
    status = Column(String(50), nullable=False, default="published")  # published, draft
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan", order_by="Season.season_number")
    artwork = relationship("Artwork", back_populates="show", cascade="all, delete-orphan")
