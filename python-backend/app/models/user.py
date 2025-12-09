from sqlalchemy import Column, String, Integer, DateTime, Boolean, ARRAY, Text, Numeric, Date, Time
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from ..database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, nullable=True)
    country_code = Column(String(10), default='+91')
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    
    # Profile fields
    avatar_url = Column(Text, nullable=True)
    gender = Column(String(50), nullable=True)
    age = Column(Integer, nullable=True)
    city = Column(String(255), nullable=True)
    skill_level = Column(String(50), nullable=True)
    playing_style = Column(String(50), nullable=True)
    handedness = Column(String(50), nullable=True)
    favorite_sports = Column(ARRAY(String), nullable=True)
    profile_completed = Column(Boolean, default=False)
    
    # Status fields
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    phone_number = Column(String(20), nullable=True)
    full_name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    city = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=True)
    handedness = Column(String(20), nullable=True)
    skill_level = Column(String(50), nullable=True)
    sports = Column(JSONB, nullable=True)
    playing_style = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
