from .auth import router as auth_router
from .profile import router as profile_router
from .venue import router as venue_router
from .booking import router as booking_router
from .otp import router as otp_router
from .common import router as common_router

__all__ = ["auth_router", "profile_router", "venue_router", "booking_router", "otp_router", "common_router"]
