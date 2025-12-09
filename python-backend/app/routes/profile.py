from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserUpdate, AuthResponse
from ..utils.auth import get_current_user
from typing import Optional

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])

@router.post("/save", response_model=AuthResponse)
async def save_user_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save or update user profile"""
    try:
        # Update user fields
        for key, value in profile_data.dict(exclude_unset=True).items():
            setattr(current_user, key, value)
        
        # Check if profile is completed (simple logic: if full_name is present)
        if current_user.full_name:
            current_user.profile_completed = True
            
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "message": "Profile saved successfully",
            "data": {
                "user": {
                    "id": str(current_user.id),
                    "email": current_user.email,
                    "firstName": current_user.first_name,
                    "lastName": current_user.last_name,
                    "fullName": current_user.full_name,
                    "phoneNumber": current_user.phone_number,
                    "age": current_user.age,
                    "city": current_user.city,
                    "gender": current_user.gender,
                    "skillLevel": current_user.skill_level,
                    "playingStyle": current_user.playing_style,
                    "handedness": current_user.handedness,
                    "favoriteSports": current_user.favorite_sports,
                    "profileCompleted": current_user.profile_completed
                }
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving profile: {str(e)}"
        )

@router.get("/{phone_number}", response_model=AuthResponse)
async def get_user_profile_by_phone(phone_number: str, db: Session = Depends(get_db)):
    """Get user profile by phone number"""
    try:
        user = db.query(User).filter(User.phone_number == phone_number).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "message": "User found",
            "data": {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "fullName": user.full_name,
                    "phoneNumber": user.phone_number,
                    "age": user.age,
                    "city": user.city,
                    "gender": user.gender,
                    "skillLevel": user.skill_level,
                    "playingStyle": user.playing_style,
                    "handedness": user.handedness,
                    "favoriteSports": user.favorite_sports,
                    "profileCompleted": user.profile_completed
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching profile: {str(e)}"
        )
