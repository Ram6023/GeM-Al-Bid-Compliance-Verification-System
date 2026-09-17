import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "GeM AI Bid Compliance Verification System"
    API_V1_STR: str = "/api"
    
    # Database: Default PostgreSQL with sqlite fallback
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "gem_compliance")
    
    # Custom DATABASE_URL or Postgres constructed URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"postgresql://{os.getenv('POSTGRES_USER', 'postgres')}:{os.getenv('POSTGRES_PASSWORD', 'postgres')}@{os.getenv('POSTGRES_SERVER', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'gem_compliance')}"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./gem_compliance.db"
    
    # Path configs
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    VECTOR_DB_DIR: str = os.path.join(BASE_DIR, "vector_store")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "reports")
    
    # AI Config
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
