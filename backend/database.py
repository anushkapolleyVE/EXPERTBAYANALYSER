import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Automatically load .env file if present
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expertbay_eval.db")

# Normalize postgres:// and postgresql:// to postgresql+psycopg2:// for psycopg2 compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)


# Configure connection arguments and engine parameters based on DB dialect
connect_args = {}
engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL / Neon Serverless configuration:
    # pool_pre_ping checks if connection is alive before using (essential for serverless sleep/wake)
    # pool_recycle reopens idle connections every 300 seconds to prevent dropped connections
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    # Ensure sslmode=require for Neon if not explicitly included in URL
    if "neon.tech" in DATABASE_URL and "sslmode=" not in DATABASE_URL:
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

