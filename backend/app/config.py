from pydantic_settings import BaseSettings
from pydantic import SecretStr, field_validator
from functools import lru_cache
from urllib.parse import quote_plus


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "NexusMG API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database - MariaDB
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "nexusmg"
    
    @property
    def DATABASE_URL(self) -> str:
        password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        return f"mysql+pymysql://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        return f"mysql+asyncmy://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # JWT
    JWT_SECRET_KEY: SecretStr
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # AI Services
    GROQ_API_KEY: SecretStr = SecretStr("")
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    ALLOW_MOCK_AI: bool = False
    
    # External APIs
    GITHUB_TOKEN: SecretStr = SecretStr("")
    PROXYCURL_API_KEY: SecretStr = SecretStr("")
    LinkdAPI_API_KEY: SecretStr = SecretStr("")
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: SecretStr) -> SecretStr:
        secret = v.get_secret_value().strip()
        if not secret or secret == "your-super-secret-key-change-in-production":
            raise ValueError("JWT_SECRET_KEY must be set to a strong value")
        return v

    class Config:
        env_file = ".env"
        extra = "forbid"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
