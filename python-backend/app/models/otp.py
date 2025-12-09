from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from ..database import Base

class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), nullable=False)
    country_code = Column(String(10), default='+91')
    otp_code = Column(String(10), nullable=False)
    is_verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
