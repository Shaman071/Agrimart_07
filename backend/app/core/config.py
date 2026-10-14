# AgriMart Backend - Configuration
import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AgriMart API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    # Razorpay
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str

    # Resend
    RESEND_API_KEY: str

    # Gemini AI
    GEMINI_API_KEY: Optional[str] = "AIzaSyAG0r0aQSeC8sHbxqpKMyvJNIAwCcMf7go"

    # AI Services & Cloudinary
    WHISPER_API_KEY: Optional[str] = "RKJfErHQiME4gxHJTCmVxBxcMYLxbztd0J07aY_8w7I"
    VISION_API_KEY: Optional[str] = "AIzaSyARXb0OMeQgibcs8esjexK029TxsV3GnDg"

    CLOUDINARY_NAME: Optional[str] = "dsvwvuqjk"
    CLOUDINARY_KEY: Optional[str] = "922283499362645"
    CLOUDINARY_SECRET: Optional[str] = "ZCs4n0C8K4nNdaRBi7yUcqUBPH8"

    ROBOFLOW_API_KEY: Optional[str] = "zOzD8lxKH4QIia2yVHGY"
    ROBOFLOW_MODEL_ID: Optional[str] = "plants-diseases-detection-and-classification"
    ROBOFLOW_VERSION: Optional[str] = "12"

    WEATHER_API_KEY: Optional[str] = "403d516f676c5d368b4969dc6ab51c3c"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()