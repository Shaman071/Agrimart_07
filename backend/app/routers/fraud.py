# AgriMart Backend - Fraud Router
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.services.fraud_service import FraudService, FraudScore
from app.core.config import get_settings
from supabase import Client


router = APIRouter()


class ListingScoreRequest(BaseModel):
    farmer_id: str
    crop_type: str
    qty_avail: float
    price: float
    district: str
    device_id: Optional[str] = None
    ip_address: Optional[str] = None


class AccountScoreRequest(BaseModel):
    user_id: str
    role: str
    phone: str
    district: Optional[str] = None
    land_size: Optional[float] = None
    buyer_type: Optional[str] = None
    address: Optional[str] = None
    trust_score: float = 50.0
    device_id: Optional[str] = None
    ip_address: Optional[str] = None


class FraudScoreResponse(BaseModel):
    score: float
    risk_level: str
    reason_codes: list
    details: dict


# Dependency to get fraud service
async def get_fraud_service(supabase: Client = Depends(lambda: None)) -> FraudService:
    # In real app, get from app state
    from app.main import supabase as global_supabase
    return FraudService(global_supabase)


@router.post("/score-listing", response_model=FraudScoreResponse)
async def score_listing(
    request: ListingScoreRequest,
    fraud_service: FraudService = Depends(get_fraud_service)
):
    """
    Score a produce listing for fraud/anomaly risk.
    Checks: price vs district median, quantity anomalies, duplicate listings, new account risk.
    """
    try:
        listing_data = request.model_dump()
        result = await fraud_service.score_listing(listing_data)
        return FraudScoreResponse(
            score=result.score,
            risk_level=result.risk_level,
            reason_codes=result.reason_codes,
            details=result.details
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring failed: {str(e)}"
        )


@router.post("/score-account", response_model=FraudScoreResponse)
async def score_account(
    request: AccountScoreRequest,
    fraud_service: FraudService = Depends(get_fraud_service)
):
    """
    Score a user account for fraud risk.
    Checks: multiple registrations from same device/IP, suspicious patterns, incomplete profile.
    """
    try:
        user_data = request.model_dump()
        result = await fraud_service.score_account(user_data)
        return FraudScoreResponse(
            score=result.score,
            risk_level=result.risk_level,
            reason_codes=result.reason_codes,
            details=result.details
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring failed: {str(e)}"
        )


@router.get("/risk-levels")
async def get_risk_levels():
    """Return risk level definitions"""
    return {
        "levels": [
            {"level": "MINIMAL", "score_range": "0-19", "action": "Allow"},
            {"level": "LOW", "score_range": "20-39", "action": "Monitor"},
            {"level": "MEDIUM", "score_range": "40-69", "action": "Review required"},
            {"level": "HIGH", "score_range": "70-100", "action": "Block/Flag for admin"}
        ],
        "reason_codes": {
            "PRICE_BELOW_MEDIAN_40PCT": "Listing price >40% below district APMC median",
            "PRICE_BELOW_MEDIAN_25PCT": "Listing price 25-40% below district APMC median",
            "UNUSUALLY_HIGH_QUANTITY": "Quantity exceeds typical smallholder volume",
            "POTENTIAL_DUPLICATE_LISTING": "Similar listing by same farmer in 24h",
            "NEW_ACCOUNT_HIGH_VALUE": "New account (<7 days) posting high-value listing",
            "MULTIPLE_ACCOUNTS_24H": "≥3 registrations from same device/IP in 24h",
            "SUSPICIOUS_PHONE_PATTERN": "Phone number matches known test/fake patterns",
            "INCOMPLETE_FARMER_PROFILE": "Farmer missing district or land size",
            "INCOMPLETE_BUYER_PROFILE": "Buyer missing type or address",
            "LOW_TRUST_SCORE": "Trust score below 20"
        }
    }