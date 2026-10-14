# AgriMart Backend - Vision Router
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import base64

from app.adapters.image_adapter import grade_crop_image, diagnose_crop_image

router = APIRouter()

class GradeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image")
    crop_type: str = Field(..., description="Crop type for grading")

class GradeResponse(BaseModel):
    ai_grade: str
    confidence: float
    suggested_price_range: dict
    quality_factors: dict

class DiagnoseRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image of affected crop")
    crop_type: str = Field(..., description="Crop type for context-aware diagnosis")
    district: Optional[str] = "Bangalore"

class DiagnoseResponse(BaseModel):
    likely_issue: str
    confidence: float
    recommended_action: str
    possible_causes: list
    weather_context: Optional[dict] = None

@router.post("/grade-crop", response_model=GradeResponse)
async def grade_crop(
    crop_type: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        image_bytes = await image.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        result = grade_crop_image(image_base64, crop_type)
        return GradeResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grading failed: {str(e)}"
        )

@router.post("/grade-crop-base64", response_model=GradeResponse)
async def grade_crop_base64(request: GradeRequest):
    try:
        result = grade_crop_image(request.image_base64, request.crop_type)
        return GradeResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grading failed: {str(e)}"
        )

@router.post("/diagnose-crop", response_model=DiagnoseResponse)
async def diagnose_crop(
    crop_type: str = Form(...),
    district: Optional[str] = Form("Bangalore"),
    image: UploadFile = File(...)
):
    try:
        image_bytes = await image.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        result = diagnose_crop_image(image_base64, crop_type, district)
        return DiagnoseResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnosis failed: {str(e)}"
        )

@router.post("/diagnose-crop-base64", response_model=DiagnoseResponse)
async def diagnose_crop_base64(request: DiagnoseRequest):
    try:
        result = diagnose_crop_image(request.image_base64, request.crop_type, request.district or "Bangalore")
        return DiagnoseResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnosis failed: {str(e)}"
        )

@router.get("/supported-crops")
async def get_supported_crops():
    from app.adapters.image_adapter import DISEASE_REMEDIES
    return {
        "diagnosis_crops": list(DISEASE_REMEDIES.keys()),
        "roboflow_model": "plants-diseases-detection-and-classification:v12"
    }