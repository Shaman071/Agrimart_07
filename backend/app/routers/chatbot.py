# AgriMart Backend - Chatbot Router
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from app.services.chatbot_service import ChatbotService, ChatQuery, ChatResponse
from app.services.market_service import MarketService
from app.core.config import get_settings
from supabase import Client


router = APIRouter()


class ChatRequest(BaseModel):
    query: str = Field(..., description="Natural language query")
    user_id: str = Field(..., description="Supabase user ID")
    user_role: str = Field(..., description="User role: farmer, buyer, admin")
    context: dict = Field(default_factory=dict)


class ChatResponseModel(BaseModel):
    answer: str
    data: Optional[dict] = None
    suggestions: list = []


# Dependency
async def get_chatbot_service(supabase: Client = Depends(lambda: None)) -> ChatbotService:
    from app.main import supabase as global_supabase
    market_service = MarketService(global_supabase)
    return ChatbotService(global_supabase, market_service)


@router.post("/demand-forecast", response_model=ChatResponseModel)
async def demand_forecast(
    request: ChatRequest,
    chatbot: ChatbotService = Depends(get_chatbot_service)
):
    """
    Demand forecast chatbot endpoint.
    Answers questions about prices, arrivals, trends, buying/selling.
    """
    try:
        chat_query = ChatQuery(
            query=request.query,
            user_id=request.user_id,
            user_role=request.user_role,
            context=request.context
        )
        result = await chatbot.process_query(chat_query)
        return ChatResponseModel(
            answer=result.answer,
            data=result.data,
            suggestions=result.suggestions
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot error: {str(e)}"
        )


@router.get("/sample-queries")
async def get_sample_queries():
    """Return sample queries for each user role"""
    return {
        "farmer": [
            "Tomato price in Bangalore",
            "Price trend for Ragi in Mysore",
            "How to create a listing?",
            "Best time to sell Onion",
            "Grade my crop using camera"
        ],
        "buyer": [
            "Onion arrivals in Bangalore",
            "Cheapest Tomato near me",
            "Join pool order for Potato",
            "Market forecast for next week",
            "Track my order"
        ],
        "admin": [
            "System metrics",
            "Pending verifications",
            "Fraud alerts today",
            "Dispute resolution queue",
            "Kiosk registrations"
        ]
    }