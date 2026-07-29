import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from app.core.config import settings

def apply_supabase_migration():
    db_url = os.getenv("SUPABASE_DATABASE_URL") or settings.DATABASE_URL

    if not db_url or db_url.startswith("sqlite"):
        print("❌ Error: SUPABASE_DATABASE_URL or PostgreSQL DATABASE_URL is not set.")
        print("Please set SUPABASE_DATABASE_URL in backend/.env or environment variables:")
        print("Example: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres")
        sys.exit(1)

    print("🔄 Connecting to Supabase Cloud PostgreSQL database...")
    
    connect_args = {}
    if "postgresql" in db_url and "sslmode" not in db_url:
        connect_args["sslmode"] = "require"

    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

    sql_file_path = Path(__file__).resolve().parent.parent.parent.parent / "supabase" / "migrations" / "001_initial_schema.sql"
    print(f"📄 Reading migration file: {sql_file_path}")

    if not sql_file_path.exists():
        print(f"❌ Error: Migration file not found at {sql_file_path}")
        sys.exit(1)

    with open(sql_file_path, "r", encoding="utf-8") as f:
        sql_script = f.read()

    print("⚡ Executing 001_initial_schema.sql migration script...")
    
    with engine.begin() as conn:
        conn.execute(text(sql_script))
        
    print("🎉 Migration applied successfully! All tables, RLS policies, and seed data are active in Supabase Cloud PostgreSQL.")

if __name__ == "__main__":
    apply_supabase_migration()
