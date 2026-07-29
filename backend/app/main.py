import sys
import os
import logging
from contextlib import asynccontextmanager

# Automatically insert backend root directory into sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.seed_data import seed_database
from app.simulation.engine import simulation_engine
from app.api import auth, dashboard, utilities, transportation, public_services, infrastructure, ai_assistant, websocket

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("citypulse")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Database Schema & Seed Data
    logger.info("Initializing CityPulse Database and Historical Seeding...")
    seed_database()
    
    # 2. Start Background Simulation Engine
    logger.info("Starting background synthetic IoT simulation engine...")
    await simulation_engine.start()
    
    yield
    
    # 3. Shutdown Simulation Engine
    logger.info("Stopping background simulation engine...")
    await simulation_engine.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Enable CORS for local dev frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(utilities.router, prefix=settings.API_V1_STR)
app.include_router(transportation.router, prefix=settings.API_V1_STR)
app.include_router(public_services.router, prefix=settings.API_V1_STR)
app.include_router(infrastructure.router, prefix=settings.API_V1_STR)
app.include_router(ai_assistant.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
