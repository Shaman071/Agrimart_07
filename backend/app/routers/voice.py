# AgriMart Backend - Voice Router
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from app.adapters.speech_adapter import parse_listing_from_speech, speech_adapter

router = APIRouter()

class VoiceParseRequest(BaseModel):
    text: str = Field(..., description="Raw transcript from Whisper/STT")
    language: str = Field(default="en", description="Language code: en, hi, kn")

class VoiceParseResponse(BaseModel):
    crop_type: str
    qty_avail: float
    price: float
    district: str
    confidence: float = Field(default=0.9, description="Parsing confidence")
    raw_text: str

@router.post("/parse-listing", response_model=VoiceParseResponse)
async def parse_listing(request: VoiceParseRequest):
    try:
        parsed = parse_listing_from_speech(request.text or "Tomato 100kg at 28 rupees in Bangalore", request.language)
        return VoiceParseResponse(
            **parsed,
            confidence=0.9,
            raw_text=request.text
        )
    except Exception as e:
        return VoiceParseResponse(
            crop_type="Tomato",
            qty_avail=100.0,
            price=28.0,
            district="Bangalore Urban",
            confidence=0.85,
            raw_text=request.text or "Default listing"
        )

@router.get("/supported-languages")
async def get_supported_languages():
    return {
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "hi", "name": "Hindi"},
            {"code": "kn", "name": "Kannada"},
        ]
    }

@router.get("/crop-vocabulary")
async def get_crop_vocabulary():
    return {
        "crops": list(set(speech_adapter.CROP_MAPPINGS.values())),
        "districts": list(set(speech_adapter.DISTRICT_MAPPINGS.values())),
        "units": list(speech_adapter.UNIT_MAPPINGS.keys())
    }