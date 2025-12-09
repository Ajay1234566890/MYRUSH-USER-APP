from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
import random
import uuid
from ..database import get_db
from ..models.otp import OTPVerification
from ..models.user import User
from ..schemas.otp import OTPRequest, OTPVerify, OTPResponse
from ..utils.auth import create_access_token

router = APIRouter(prefix="/api/v1/otp", tags=["OTP"])

DUMMY_OTP = "12345"

@router.post("/send", response_model=OTPResponse)
async def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """Send OTP to phone number"""
    try:
        # In a real app, you would integrate with an SMS provider here
        # For now, we'll use a dummy OTP or generate one
        otp_code = DUMMY_OTP # or str(random.randint(10000, 99999))
        
        # Check if there's an existing active OTP
        existing_otp = db.query(OTPVerification).filter(
            OTPVerification.phone_number == request.phone_number,
            OTPVerification.is_verified == False,
            OTPVerification.expires_at > datetime.utcnow()
        ).first()
        
        if existing_otp:
            # Update existing OTP
            existing_otp.otp_code = otp_code
            existing_otp.expires_at = datetime.utcnow() + timedelta(minutes=10)
            existing_otp.attempts = 0
            db.commit()
        else:
            # Create new OTP record
            new_otp = OTPVerification(
                id=uuid.uuid4(),
                phone_number=request.phone_number,
                country_code=request.country_code,
                otp_code=otp_code,
                expires_at=datetime.utcnow() + timedelta(minutes=10),
                created_at=datetime.utcnow()
            )
            db.add(new_otp)
            db.commit()
        
        return {
            "success": True,
            "message": "OTP sent successfully",
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending OTP: {str(e)}"
        )

@router.post("/verify", response_model=dict)
async def verify_otp(request: OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP code"""
    try:
        # Find the OTP record
        otp_record = db.query(OTPVerification).filter(
            OTPVerification.phone_number == request.phone_number,
            OTPVerification.is_verified == False,
            OTPVerification.expires_at > datetime.utcnow()
        ).order_by(OTPVerification.created_at.desc()).first()
        
        if not otp_record:
            return {
                "success": False,
                "message": "Invalid or expired OTP",
                "user_id": None
            }
        
        # Check attempts
        if otp_record.attempts >= otp_record.max_attempts:
            return {
                "success": False,
                "message": "Too many failed attempts",
                "user_id": None
            }
            
        # Verify code
        if otp_record.otp_code != request.otp_code:
            otp_record.attempts += 1
            db.commit()
            return {
                "success": False,
                "message": "Invalid OTP code",
                "user_id": None
            }
            
        # Mark as verified
        otp_record.is_verified = True
        otp_record.verified_at = datetime.utcnow()
        
        # Get or create user
        user = db.query(User).filter(User.phone_number == request.phone_number).first()
        
        if not user:
            # Create new user
            user_id = uuid.uuid4()
            user = User(
                id=user_id,
                phone_number=request.phone_number,
                country_code=otp_record.country_code,
                is_verified=True,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                last_login_at=datetime.utcnow()
            )
            db.add(user)
        else:
            # Update existing user
            user.is_verified = True
            user.last_login_at = datetime.utcnow()
            
        db.commit()
        db.refresh(user)
        
        # Generate token
        access_token = create_access_token(data={"sub": user.email or user.phone_number})
        
        return {
            "success": True,
            "message": "OTP verified successfully",
            "user_id": str(user.id),
            "token": access_token,
            "user": {
                "id": str(user.id),
                "phoneNumber": user.phone_number,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "fullName": user.full_name,
                "email": user.email,
                "profileCompleted": user.profile_completed
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying OTP: {str(e)}"
        )
