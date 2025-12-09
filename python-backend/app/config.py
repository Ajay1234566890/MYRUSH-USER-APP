from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    # Server Configuration
    PORT: int = 5000
    HOST: str = "0.0.0.0"
    
    # Database Configuration
    DATABASE_URL: str
    
    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # CORS Configuration
    CORS_ORIGINS: str = '["*"]'
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string to list"""
        try:
            return json.loads(self.CORS_ORIGINS)
        except:
            return ["http://localhost:19006", "http://localhost:8081"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
