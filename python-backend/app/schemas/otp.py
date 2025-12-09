from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class OTPRequest(BaseModel):
    phone_number: str
    country_code: str = "+91"

class OTPVerify(BaseModel):
    phone_number: str
    otp_code: str

class OTPResponse(BaseModel):
    success: bool
    message: str
    expires_at: Optional[datetime] = None
