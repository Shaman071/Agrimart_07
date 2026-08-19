# AgriMart Backend - Vision Router
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from pydantic import BaseModel, Field
from typing import Optional
import base64

from app.adapters.image_adapter import grade_crop_image, diagnose_crop_image, GradeResult, DiagnosisResult
from app.core.config import get_settings


router = APIRouter()


class GradeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image (data URL or raw)")
    crop_type: str = Field(..., description="Crop type for context-aware grading")


class GradeResponse(BaseModel):
    ai_grade: str
    confidence: float
    suggested_price_range: dict
    quality_factors: dict


class DiagnoseRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image of affected crop")
    crop_type: str = Field(..., description="Crop type for context-aware diagnosis")


class DiagnoseResponse(BaseModel):
    likely_issue: str
    confidence: float
    recommended_action: str
    possible_causes: list


@router.post("/grade-crop", response_model=GradeResponse)
async def grade_crop(
    crop_type: str = Form(...),
    image: UploadFile = File(...)
):
    """
    Grade crop quality from uploaded image.
    Returns AI grade (A/B/C), confidence, and suggested price range.
    """
    try:
        # Read and encode image
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
    """
    Grade crop from base64 image (for direct API calls).
    """
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
    image: UploadFile = File(...)
):
    """
    Crop Doctor: Diagnose crop disease from image.
    Returns likely issue, confidence, and treatment recommendation.
    """
    try:
        image_bytes = await image.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')

        result = diagnose_crop_image(image_base64, crop_type)
        return DiagnoseResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnosis failed: {str(e)}"
        )


@router.post("/diagnose-crop-base64", response_model=DiagnoseResponse)
async def diagnose_crop_base64(request: DiagnoseRequest):
    """
    Crop Doctor from base64 image.
    """
    try:
        result = diagnose_crop_image(request.image_base64, request.crop_type)
        return DiagnoseResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnosis failed: {str(e)}"
        )


@router.get("/supported-crops")
async def get_supported_crops():
    """Return list of crops supported by grading/diagnosis"""
    from app.adapters.image_adapter import image_adapter
    return {
        "grading_crops": list(image_adapter.BASE_PRICES.keys()),
        "diagnosis_crops": list(image_adapter.DISEASE_KB.keys()),
        "note": "Diagnosis available for major crops. Others return generic healthy/unknown."
    }