# AgriMart Backend - Market Router
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List

from app.services.market_service import MarketService, APMCRate, MarketTrend
from app.core.config import get_settings
from supabase import Client


router = APIRouter()


# Dependency
async def get_market_service(supabase: Client = Depends(lambda: None)) -> MarketService:
    from app.main import supabase as global_supabase
    return MarketService(global_supabase)


@router.get("/apmc-rates", response_model=List[dict])
async def get_apmc_rates(
    district: str = Query(..., description="District name"),
    crop: Optional[str] = Query(None, description="Crop type (optional)"),
    market_service: MarketService = Depends(get_market_service)
):
    """
    Get APMC benchmark rates for a district and optional crop.
    Used by farmers to anchor their pricing.
    """
    try:
        rates = market_service.get_apmc_rates(district, crop)
        return [r.model_dump() for r in rates]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch rates: {str(e)}"
        )


@router.get("/trends/{district}", response_model=List[dict])
async def get_district_trends(
    district: str,
    market_service: MarketService = Depends(get_market_service)
):
    """
    Get price trends for all crops in a district.
    """
    try:
        trends = market_service.get_district_trends(district)
        return [t.model_dump() for t in trends]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trends: {str(e)}"
        )


@router.get("/arrivals/{district}/{crop}", response_model=dict)
async def get_crop_arrivals(
    district: str,
    crop: str,
    market_service: MarketService = Depends(get_market_service)
):
    """
    Get recent arrival volumes for a crop in a district.
    """
    try:
        arrivals = market_service.get_crop_arrivals(district, crop)
        return arrivals
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch arrivals: {str(e)}"
        )


@router.get("/districts")
async def get_districts():
    """Get list of supported districts"""
    from app.services.market_service import MarketService
    # Mock - in production from database
    return {
        "districts": [
            "Bangalore Urban", "Bangalore Rural", "Mysore", "Hubli", "Dharwad",
            "Mangalore", "Belgaum", "Gulbarga", "Bidar", "Raichur", "Koppal",
            "Bellary", "Chitradurga", "Davangere", "Shimoga", "Tumkur", "Kolar"
        ]
    }


@router.get("/crops")
async def get_crops():
    """Get list of supported crops"""
    from app.services.market_service import MarketService
    return {
        "crops": [
            "Tomato", "Onion", "Potato", "Rice", "Wheat", "Maize", "Ragi",
            "Coconut", "Banana", "Mango", "Chilli", "Cabbage", "Cauliflower",
            "Brinjal", "Okra", "Pumpkin", "Carrot", "Beetroot", "Groundnut",
            "Soybean", "Cotton", "Sugarcane", "Chickpea", "Pigeon Pea",
            "Green Gram", "Black Gram", "Lentil", "Mustard", "Sesame"
        ]
    }