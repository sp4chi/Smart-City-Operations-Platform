from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Database connection configuration
db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif "postgresql" in db_url or "postgres" in db_url:
    # Target custom citypulse schema for database isolation
    connect_args["options"] = "-c search_path=citypulse,public"
    # Normalize to psycopg2 driver for SQLAlchemy 2.0+ compatibility
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
