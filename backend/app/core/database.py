import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("database")

Base = declarative_base()

def get_engine():
    """Try connecting to PostgreSQL first; fallback to SQLite if Postgres is unavailable."""
    try:
        # Try Postgres first with a short timeout
        pg_engine = create_engine(
            settings.DATABASE_URL, 
            connect_args={"connect_timeout": 3} if "postgresql" in settings.DATABASE_URL else {}
        )
        with pg_engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL Database!")
            return pg_engine
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite database.")
        sqlite_engine = create_engine(
            settings.SQLITE_FALLBACK_URL, 
            connect_args={"check_same_thread": False}
        )
        return sqlite_engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
