#!/usr/bin/env python3
"""
CityPulse Supabase Migration Launcher
Root shortcut script to execute supabase/migrate.py
"""
import sys
from pathlib import Path

# Add supabase directory to path and execute
supabase_dir = Path(__file__).resolve().parent / "supabase"
sys.path.insert(0, str(supabase_dir))

from migrate import run_migration

if __name__ == "__main__":
    run_migration()
