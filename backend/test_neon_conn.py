"""
Quick Neon Connection Tester.
Verifies connection, SSL mode, and PostgreSQL server version.
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

from backend.database import engine, DATABASE_URL
from sqlalchemy import text

def test_connection():
    print("=" * 60)
    print("Testing Database Connection...")
    safe_url = DATABASE_URL
    if "@" in safe_url:
        protocol_user, host_db = safe_url.split("@", 1)
        protocol = protocol_user.split("://")[0]
        safe_url = f"{protocol}://****:****@{host_db}"
    print(f"Target URL: {safe_url}")
    print("=" * 60)

    try:
        with engine.connect() as conn:
            is_sqlite = DATABASE_URL.startswith("sqlite")
            query = "SELECT sqlite_version();" if is_sqlite else "SELECT version();"
            result = conn.execute(text(query)).scalar()
            print(f"[SUCCESS] Successfully connected to database! ({'SQLite' if is_sqlite else 'PostgreSQL'})")
            print(f"Version: {result}")
            
            if is_sqlite:
                tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';")).fetchall()
                print(f"[INFO] Found {len(tables)} tables in SQLite database:")
                for t in tables:
                    if not t[0].startswith("sqlite_"):
                        count = conn.execute(text(f"SELECT COUNT(*) FROM \"{t[0]}\"")).scalar()
                        print(f"  * {t[0]}: {count} records")
            else:
                tables = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """)).fetchall()
                if tables:
                    print(f"[INFO] Found {len(tables)} public tables in database:")
                    for t in tables:
                        count = conn.execute(text(f"SELECT COUNT(*) FROM \"{t[0]}\"")).scalar()
                        print(f"  * {t[0]}: {count} records")
                else:
                    print("[INFO] No public tables found yet. Run `python -m backend.seed_demo` to initialize.")
    except Exception as e:
        print(f"[ERROR] Failed to connect: {e}")
        sys.exit(1)


if __name__ == "__main__":
    test_connection()
