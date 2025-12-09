from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import test_connection
from .routes import auth_router, profile_router, venue_router, booking_router, otp_router, common_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="MyRush API",
    description="MyRush Backend API Server",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(venue_router)
app.include_router(booking_router)
app.include_router(otp_router)
app.include_router(common_router)

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("=" * 60)
    logger.info("🚀 MyRush API Server Starting...")
    logger.info("=" * 60)
    
    # Test database connection
    if test_connection():
        logger.info("✅ Database connection successful")
    else:
        logger.error("❌ Database connection failed")
        raise Exception("Failed to connect to database")
    
    logger.info(f"📝 Environment: development")
    logger.info(f"🌐 Port: {settings.PORT}")
    logger.info(f"📚 API Docs: http://localhost:{settings.PORT}/api/docs")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("👋 Shutting down MyRush API Server...")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "MyRush API Server",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }
