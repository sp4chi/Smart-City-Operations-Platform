import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file automatically
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "CityPulse — AI-Native Smart City Platform"
    API_V1_STR: str = "/api"
    
    # SQLite default, PostgreSQL for Supabase Cloud
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./citypulse.db")
    
    # JWT Authentication Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "citypulse_super_secret_jwt_key_2026_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 Hours
    
    # Optional: Google Gemini API Key for NL Assistant
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    
    # Simulation Interval (Seconds)
    SIMULATION_INTERVAL_SECONDS: float = float(os.getenv("SIMULATION_INTERVAL_SECONDS", "3.0"))

    class Config:
        case_sensitive = True

settings = Settings()
