import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("citypulse.database")

# Database connection configuration
db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif "postgresql" in db_url or "postgres" in db_url:
    # Target custom citypulse schema for database isolation
    connect_args["options"] = "-c search_path=citypulse,public"
    connect_args["connect_timeout"] = 5
    # Normalize to psycopg2 driver for SQLAlchemy 2.0+ compatibility
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)

def _build_engine(url: str, args: dict):
    return create_engine(
        url,
        connect_args=args,
        pool_pre_ping=True
    )

try:
    engine = _build_engine(db_url, connect_args)
    if "postgresql" in db_url or "postgres" in db_url:
        # Verify reachability of PostgreSQL server
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully established connection to primary PostgreSQL database.")
except Exception as exc:
    if "postgresql" in db_url or "postgres" in db_url:
        logger.warning(
            f"Unable to connect to primary PostgreSQL database ({exc}). "
            "Falling back to local SQLite database (sqlite:///./citypulse.db) to ensure platform availability."
        )
        db_url = "sqlite:///./citypulse.db"
        connect_args = {"check_same_thread": False}
        engine = _build_engine(db_url, connect_args)
    else:
        raise exc

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
