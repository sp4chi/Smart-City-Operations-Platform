import sys
import os
import logging
import asyncio
from contextlib import asynccontextmanager

# Automatically insert backend root directory into sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Response, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import Base, engine
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
    # 1. Ensure Database schema exists immediately
    try:
        logger.info("Verifying database schema...")
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        logger.error(f"Error ensuring database tables: {exc}")

    # 2. Asynchronous Database Seeding in background
    logger.info("Initializing CityPulse Database seed in background task...")
    asyncio.create_task(asyncio.to_thread(seed_database))
    
    # 3. Start Background Simulation Engine
    logger.info("Starting background synthetic IoT simulation engine...")
    await simulation_engine.start()
    
    yield
    
    # 4. Shutdown Simulation Engine
    logger.info("Stopping background simulation engine...")
    await simulation_engine.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    origin = request.headers.get("origin", "*")
    response = JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "error": str(exc),
            "path": request.url.path
        }
    )
    # Ensure CORS headers are explicitly set so browser never flags false CORS error on 500
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
    return response

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    origin = request.headers.get("origin")
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None) or {}
    )
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Enable CORS for all HTTP/HTTPS Origins with credentials support
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
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

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)
