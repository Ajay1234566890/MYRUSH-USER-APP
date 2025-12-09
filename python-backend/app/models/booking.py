from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, Numeric, Date, Time, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from ..database import Base

class Booking(Base):
    __tablename__ = "booking"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("adminvenues.id"), nullable=False)
    
    booking_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    
    number_of_players = Column(Integer, default=2)
    team_name = Column(String(255), nullable=True)
    special_requests = Column(Text, nullable=True)
    
    price_per_hour = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    
    status = Column(String(50), default='pending')
    payment_status = Column(String(50), default='pending')
    payment_id = Column(String(255), nullable=True)
    
    admin_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
