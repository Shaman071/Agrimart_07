# AgriMart Backend - Main Application
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from supabase import create_client, Client

from app.core.config import get_settings, Settings
from app.routers import voice, vision, fraud, chatbot, market


# Global Supabase client (service role for backend operations)
supabase: Client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase
    settings = get_settings()
    # Only create Supabase client if valid credentials provided
    if (settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY and 
        not settings.SUPABASE_URL.startswith("https://your-project") and
        not settings.SUPABASE_SERVICE_KEY.startswith("your-service")):
        try:
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        except Exception:
            supabase = None
    yield
    # Cleanup if needed


app = FastAPI(
    title="AgriMart API",
    description="Agricultural Marketplace API with AI services",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL, 
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Verify Supabase JWT and return user info"""
    settings = get_settings()
    if not credentials or not credentials.credentials:
        return {"id": "anonymous-id", "email": "anon@agrimart.in", "role": "buyer"}
    
    token = credentials.credentials
    
    if supabase is not None:
        try:
            user_response = supabase.auth.get_user(token)
            if user_response and user_response.user:
                return {
                    "id": user_response.user.id,
                    "email": user_response.user.email,
                    "phone": user_response.user.phone,
                    "role": user_response.user.user_metadata.get("role", "buyer")
                }
        except Exception:
            pass

    # Fallback JWT decode without strict signature check for dev
    try:
        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], options={"verify_signature": False})
        return {
            "id": decoded.get("sub", "dev-user-id"),
            "email": decoded.get("email"),
            "phone": decoded.get("phone"),
            "role": decoded.get("user_metadata", {}).get("role") or decoded.get("role", "buyer")
        }
    except Exception:
        return {"id": "dev-user-id", "email": "dev@agrimart.in", "role": "buyer"}


def get_supabase() -> Client:
    return supabase


from app.routers import voice, vision, fraud, chatbot, market, ondc

# Include routers
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(vision.router, prefix="/vision", tags=["Vision"])
app.include_router(fraud.router, prefix="/fraud", tags=["Fraud"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(market.router, prefix="/market", tags=["Market"])
app.include_router(ondc.router, prefix="/api/v1", tags=["ONDC Protocol Adapter"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agrimart-api"}


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user