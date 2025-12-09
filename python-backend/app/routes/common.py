from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.common import City, GameType

router = APIRouter(prefix="/api/v1/common", tags=["Common"])

@router.get("/cities", response_model=dict)
async def get_cities(db: Session = Depends(get_db)):
    """Get all active cities"""
    try:
        cities = db.query(City).filter(City.is_active == True).order_by(City.name).all()
        return {
            "success": True,
            "data": cities
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching cities: {str(e)}"
        )

@router.get("/game-types", response_model=dict)
async def get_game_types(db: Session = Depends(get_db)):
    """Get all active game types"""
    try:
        game_types = db.query(GameType).filter(GameType.is_active == True).order_by(GameType.name).all()
        return {
            "success": True,
            "data": game_types
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching game types: {str(e)}"
        )
