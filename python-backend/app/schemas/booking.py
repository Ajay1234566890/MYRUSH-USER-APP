from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from decimal import Decimal
import uuid

class BookingBase(BaseModel):
    venue_id: uuid.UUID
    booking_date: date
    start_time: time
    duration_minutes: int
    number_of_players: Optional[int] = 2
    team_name: Optional[str] = None
    special_requests: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: uuid.UUID
    user_id: uuid.UUID
    end_time: time
    price_per_hour: Decimal
    total_amount: Decimal
    status: str
    payment_status: str
    payment_id: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
