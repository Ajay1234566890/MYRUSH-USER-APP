from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
import uuid

# User Schemas
class UserBase(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    # Profile fields
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    skill_level: Optional[str] = None
    playing_style: Optional[str] = None
    handedness: Optional[str] = None
    favorite_sports: Optional[List[str]] = None

class UserCreate(UserBase):
    pass

class UserUpdate(UserBase):
    profile_completed: Optional[bool] = None

class UserResponse(UserBase):
    id: uuid.UUID
    country_code: Optional[str] = None
    is_verified: bool
    is_active: bool
    profile_completed: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

# Profile Schemas
class ProfileBase(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    gender: Optional[str] = None
    handedness: Optional[str] = None
    skill_level: Optional[str] = None
    sports: Optional[Any] = None
    playing_style: Optional[str] = None

class ProfileCreate(ProfileBase):
    id: uuid.UUID

class ProfileResponse(ProfileBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
