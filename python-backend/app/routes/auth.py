from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserRegister, UserLogin, AuthResponse, UserResponse
from ..utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user_id = uuid.uuid4()
        new_user = User(
            id=user_id,
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            full_name=f"{user_data.first_name} {user_data.last_name}",
            is_active=True,
            is_verified=False, # Set to True if email verification is not required immediately
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create access token
        access_token = create_access_token(data={"sub": new_user.email})
        
        return {
            "success": True,
            "message": "User registered successfully",
            "data": {
                "user": {
                    "id": str(new_user.id),
                    "email": new_user.email,
                    "firstName": new_user.first_name,
                    "lastName": new_user.last_name,
                    "fullName": new_user.full_name
                },
                "token": access_token
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering user: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == credentials.email).first()
        
        if not user or not user.password_hash:
             # Fallback or error if password_hash is missing (e.g. social login users)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "fullName": user.full_name
                },
                "token": access_token
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging in: {str(e)}"
        )

@router.get("/profile", response_model=AuthResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    try:
        return {
            "success": True,
            "message": "Profile fetched successfully",
            "data": {
                "user": {
                    "id": str(current_user.id),
                    "email": current_user.email,
                    "firstName": current_user.first_name,
                    "lastName": current_user.last_name,
                    "fullName": current_user.full_name,
                    "phoneNumber": current_user.phone_number,
                    "avatarUrl": current_user.avatar_url
                }
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching profile: {str(e)}"
        )
