from sqlalchemy import Column, String, Integer, DateTime, Boolean, ARRAY, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from ..database import Base

class Venue(Base):
    __tablename__ = "adminvenues"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_type = Column(String(255), nullable=True)
    court_name = Column(String(255), nullable=True)
    location = Column(Text, nullable=True)
    prices = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    photos = Column(ARRAY(String), nullable=True)
    videos = Column(ARRAY(String), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
