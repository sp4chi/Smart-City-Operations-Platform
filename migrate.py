#!/usr/bin/env python3
"""
CityPulse Supabase Migration Runner
Executes 001_initial_schema.sql against Supabase Cloud PostgreSQL.
"""

import os
import sys
from pathlib import Path

# Try importing psycopg2 or sqlalchemy
try:
    import psycopg2
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

try:
    from sqlalchemy import create_engine, text
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False


def load_env():
    """Simple parser for .env files without external dependencies."""
    possible_env_paths = [
        Path(__file__).resolve().parent / "backend" / ".env",
        Path(__file__).resolve().parent / ".env",
    ]
    for env_path in possible_env_paths:
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def run_migration():
    load_env()

    db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")

    if not db_url or db_url.startswith("sqlite"):
        print("❌ Error: SUPABASE_DATABASE_URL or PostgreSQL DATABASE_URL is missing.")
        print("\nPlease set SUPABASE_DATABASE_URL in backend/.env or your environment:")
        print("Example:")
        print("SUPABASE_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\n")
        sys.exit(1)

    print("🔄 Connecting to Supabase Cloud PostgreSQL...")

    sql_file = Path(__file__).resolve().parent / "supabase" / "migrations" / "001_initial_schema.sql"

    if not sql_file.exists():
        print(f"❌ Error: Migration file not found at {sql_file}")
        sys.exit(1)

    print(f"📄 Reading migration script: {sql_file.name}")
    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Execute via psycopg2 if available
    if HAS_PSYCOPG2:
        try:
            conn = psycopg2.connect(db_url)
            conn.autocommit = True
            with conn.cursor() as cursor:
                print("⚡ Executing 001_initial_schema.sql via psycopg2...")
                cursor.execute(sql_content)
            conn.close()
            print("🎉 Migration applied successfully! All tables, RLS policies, and seed data are active in Supabase Cloud PostgreSQL.")
            return
        except Exception as e:
            print(f"⚠️ psycopg2 connection error: {e}. Retrying via SQLAlchemy...")

    # Execute via SQLAlchemy fallback
    if HAS_SQLALCHEMY:
        try:
            connect_args = {}
            if "sslmode" not in db_url:
                connect_args["sslmode"] = "require"
            engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
            with engine.begin() as conn:
                print("⚡ Executing 001_initial_schema.sql via SQLAlchemy...")
                conn.execute(text(sql_content))
            print("🎉 Migration applied successfully! All tables, RLS policies, and seed data are active in Supabase Cloud PostgreSQL.")
            return
        except Exception as e:
            print(f"❌ SQLAlchemy migration failed: {e}")
            sys.exit(1)

    print("❌ Error: Neither psycopg2 nor sqlalchemy is installed.")
    print("Please install required packages using: pip install psycopg2-binary sqlalchemy")
    sys.exit(1)


if __name__ == "__main__":
    run_migration()
