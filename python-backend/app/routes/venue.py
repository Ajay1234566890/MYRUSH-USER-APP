from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.venue import Venue
from ..schemas.venue import VenueResponse

router = APIRouter(prefix="/api/v1/venues", tags=["Venues"])

@router.get("/", response_model=dict)
async def get_venues(db: Session = Depends(get_db)):
    """Get all venues"""
    try:
        venues = db.query(Venue).all()
        return {
            "success": True,
            "data": venues
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching venues: {str(e)}"
        )

@router.get("/{venue_id}", response_model=dict)
async def get_venue(venue_id: str, db: Session = Depends(get_db)):
    """Get venue by ID"""
    try:
        venue = db.query(Venue).filter(Venue.id == venue_id).first()
        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found"
            )
        return {
            "success": True,
            "data": venue
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching venue: {str(e)}"
        )
