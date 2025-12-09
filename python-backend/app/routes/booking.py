from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, time, timedelta
from ..database import get_db
from ..models.booking import Booking
from ..models.venue import Venue
from ..models.user import User
from ..schemas.booking import BookingCreate, BookingResponse
from ..utils.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/v1/bookings", tags=["Bookings"])

@router.post("/", response_model=dict)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new booking"""
    try:
        # Check if venue exists
        venue = db.query(Venue).filter(Venue.id == booking_data.venue_id).first()
        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found"
            )
        
        # Calculate end time
        start_datetime = datetime.combine(booking_data.booking_date, booking_data.start_time)
        end_datetime = start_datetime + timedelta(minutes=booking_data.duration_minutes)
        end_time = end_datetime.time()
        
        # Check for conflicts
        # This is a simplified check. In production, you'd want more robust overlap checking
        # considering date and time ranges.
        existing_booking = db.query(Booking).filter(
            Booking.venue_id == booking_data.venue_id,
            Booking.booking_date == booking_data.booking_date,
            Booking.status != 'cancelled',
            Booking.status != 'refunded',
            Booking.start_time < end_time,
            Booking.end_time > booking_data.start_time
        ).first()
        
        if existing_booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This time slot is already booked"
            )
        
        # Calculate price (simplified logic, assuming price is in venue.prices as string or default)
        try:
            price_per_hour = float(venue.prices) if venue.prices and venue.prices.replace('.', '', 1).isdigit() else 800.00
        except:
            price_per_hour = 800.00
            
        total_amount = price_per_hour * (booking_data.duration_minutes / 60.0)
        
        # Create booking
        new_booking = Booking(
            id=uuid.uuid4(),
            user_id=current_user.id,
            venue_id=booking_data.venue_id,
            booking_date=booking_data.booking_date,
            start_time=booking_data.start_time,
            end_time=end_time,
            duration_minutes=booking_data.duration_minutes,
            number_of_players=booking_data.number_of_players,
            team_name=booking_data.team_name,
            special_requests=booking_data.special_requests,
            price_per_hour=price_per_hour,
            total_amount=total_amount,
            status='pending',
            payment_status='pending'
        )
        
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        
        return {
            "success": True,
            "message": "Booking created successfully",
            "data": new_booking
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating booking: {str(e)}"
        )

@router.get("/my-bookings", response_model=dict)
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get bookings for current user"""
    try:
        bookings = db.query(Booking).filter(
            Booking.user_id == current_user.id
        ).order_by(Booking.booking_date.desc(), Booking.start_time.desc()).all()
        
        return {
            "success": True,
            "data": bookings
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bookings: {str(e)}"
        )
