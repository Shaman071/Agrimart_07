# AgriMart Backend - Voice Router
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from app.adapters.speech_adapter import parse_listing_from_speech, speech_adapter, ListingData
from app.core.config import get_settings
from supabase import Client


router = APIRouter()


class VoiceParseRequest(BaseModel):
    """Input: raw text from STT (or audio file in production)"""
    text: str = Field(..., description="Raw transcript from Whisper/STT")
    language: str = Field(default="en", description="Language code: en, hi, kn")


class VoiceParseResponse(BaseModel):
    """Output: structured listing data for frontend form"""
    crop_type: str
    qty_avail: float
    price: float
    district: str
    confidence: float = Field(default=0.9, description="Parsing confidence")
    raw_text: str


@router.post("/parse-listing", response_model=VoiceParseResponse)
async def parse_listing(request: VoiceParseRequest):
    """
    Parse voice transcript into structured listing data.
    Accepts raw text (for dev) - in production, accept audio file and call Whisper first.
    """
    try:
        parsed = parse_listing_from_speech(request.text, request.language)
        return VoiceParseResponse(
            **parsed,
            confidence=0.9,
            raw_text=request.text
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Parsing failed: {str(e)}"
        )


@router.get("/supported-languages")
async def get_supported_languages():
    return {
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "hi", "name": "Hindi"},
            {"code": "kn", "name": "Kannada"},
        ],
        "note": "Speech-to-text happens client-side or via external STT. This endpoint parses the resulting text."
    }


@router.get("/crop-vocabulary")
async def get_crop_vocabulary():
    """Return known crop vocabulary for frontend hints"""
    return {
        "crops": list(speech_adapter.CROP_MAPPINGS.values()),
        "districts": list(set(speech_adapter.DISTRICT_MAPPINGS.values())),
        "units": list(speech_adapter.UNIT_MAPPINGS.keys())
    }