from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class VenueBase(BaseModel):
    game_type: Optional[str] = None
    court_name: Optional[str] = None
    location: Optional[str] = None
    prices: Optional[str] = None
    description: Optional[str] = None
    photos: Optional[List[str]] = None
    videos: Optional[List[str]] = None

class VenueCreate(VenueBase):
    pass

class VenueResponse(VenueBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
