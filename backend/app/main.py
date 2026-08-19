# AgriMart Backend - Main Application
from contextlib import asynccontextmanager
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
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Supabase JWT and return user info"""
    settings = get_settings()
    token = credentials.credentials
    try:
        # Verify with Supabase
        user_response = supabase.auth.get_user(token)
        if user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "phone": user_response.user.phone,
            "role": user_response.user.user_metadata.get("role", "buyer")
        }
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


def get_supabase() -> Client:
    return supabase


# Include routers
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(vision.router, prefix="/vision", tags=["Vision"])
app.include_router(fraud.router, prefix="/fraud", tags=["Fraud"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(market.router, prefix="/market", tags=["Market"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agrimart-api"}


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user