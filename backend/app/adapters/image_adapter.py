# AgriMart Backend - Image Adapter
# Adapter Pattern: Converts raw vision model output to structured grading/diagnosis JSON

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from enum import Enum
import base64
import io
from PIL import Image
import random


class Grade(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class GradeResult(BaseModel):
    ai_grade: Grade
    confidence: float = Field(..., ge=0, le=1)
    suggested_price_range: Dict[str, float] = Field(..., description="min/max price per kg")
    quality_factors: Dict[str, float] = Field(default_factory=dict)


class DiagnosisResult(BaseModel):
    likely_issue: str
    confidence: float = Field(..., ge=0, le=1)
    recommended_action: str
    possible_causes: List[str] = Field(default_factory=list)


class ImageAdapter:
    """
    Adapter for crop image analysis.
    Implements mock CV pipeline behind clean interface for easy model swap.
    """

    # Grade thresholds (mock heuristics)
    GRADE_CRITERIA = {
        Grade.A: {"color_uniformity": 0.8, "size_consistency": 0.75, "defect_ratio": 0.05},
        Grade.B: {"color_uniformity": 0.6, "size_consistency": 0.55, "defect_ratio": 0.15},
        Grade.C: {"color_uniformity": 0.4, "size_consistency": 0.35, "defect_ratio": 0.30},
    }

    # Market price baselines (per kg in INR) - mock data
    BASE_PRICES = {
        "Tomato": 25, "Onion": 30, "Potato": 20, "Rice": 45,
        "Wheat": 28, "Maize": 22, "Ragi": 35, "Coconut": 18,
        "Banana": 40, "Mango": 60, "Chilli": 80, "Cabbage": 25,
        "Cauliflower": 30, "Brinjal": 28, "Okra": 35, "Pumpkin": 20,
        "Carrot": 35, "Beetroot": 40, "Groundnut": 55, "Soybean": 48,
        "Cotton": 65, "Sugarcane": 3.5, "Chickpea": 70, "Pigeon Pea": 65,
    }

    # Disease knowledge base (mock)
    DISEASE_KB = {
        "Tomato": {
            "Early Blight": {"symptoms": ["dark spots on leaves", "yellowing"], "treatment": "Apply copper fungicide, remove affected leaves"},
            "Late Blight": {"symptoms": ["water-soaked lesions", "white mold"], "treatment": "Apply mancozeb, ensure good drainage"},
            "Leaf Curl": {"symptoms": ["curled leaves", "stunted growth"], "treatment": "Control whiteflies, use resistant varieties"},
        },
        "Potato": {
            "Late Blight": {"symptoms": ["dark lesions", "white sporulation"], "treatment": "Apply chlorothalonil, crop rotation"},
            "Early Blight": {"symptoms": ["concentric rings on leaves"], "treatment": "Apply mancozeb, remove debris"},
        },
        "Onion": {
            "Purple Blotch": {"symptoms": ["purple lesions on leaves"], "treatment": "Apply mancozeb, avoid overhead irrigation"},
            "Downy Mildew": {"symptoms": ["yellow patches", "purple fuzz"], "treatment": "Apply fosetyl-Al, improve air circulation"},
        },
        "Rice": {
            "Blast": {"symptoms": ["diamond-shaped lesions"], "treatment": "Apply tricyclazole, use resistant varieties"},
            "Bacterial Blight": {"symptoms": ["yellow stripes on leaves"], "treatment": "Copper compounds, seed treatment"},
        },
        "Chilli": {
            "Anthracnose": {"symptoms": ["sunken spots on fruit"], "treatment": "Apply carbendazim, hot water seed treatment"},
            "Powdery Mildew": {"symptoms": ["white powder on leaves"], "treatment": "Apply sulfur, ensure spacing"},
        },
    }

    def __init__(self):
        pass

    def _load_image(self, image_data: str) -> Image.Image:
        """Load image from base64 or file path"""
        if image_data.startswith("data:image"):
            # Base64 data URL
            header, encoded = image_data.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            return Image.open(io.BytesIO(image_bytes))
        else:
            # Assume file path or base64
            try:
                return Image.open(image_data)
            except:
                image_bytes = base64.b64decode(image_data)
                return Image.open(io.BytesIO(image_bytes))

    def _mock_analyze_image(self, image: Image.Image, crop_type: str) -> Dict[str, float]:
        """
        Mock CV analysis - returns quality metrics.
        In production, replace with actual model inference.
        """
        # Simulate analysis based on image properties
        width, height = image.size
        aspect_ratio = width / height

        # Mock metrics (in production: use CNN/ViT model)
        color_score = random.uniform(0.4, 0.95)
        size_score = random.uniform(0.35, 0.9)
        defect_score = random.uniform(0.02, 0.4)

        return {
            "color_uniformity": round(color_score, 2),
            "size_consistency": round(size_score, 2),
            "defect_ratio": round(defect_score, 2),
        }

    def grade_crop(self, image_data: str, crop_type: str) -> GradeResult:
        """
        Grade crop quality from image.
        Returns GradeResult with grade, confidence, and price suggestion.
        """
        image = self._load_image(image_data)
        metrics = self._mock_analyze_image(image, crop_type)

        # Determine grade based on thresholds
        grade = Grade.C
        confidence = 0.0

        for g in [Grade.A, Grade.B, Grade.C]:
            criteria = self.GRADE_CRITERIA[g]
            if (metrics["color_uniformity"] >= criteria["color_uniformity"] and
                metrics["size_consistency"] >= criteria["size_consistency"] and
                metrics["defect_ratio"] <= criteria["defect_ratio"]):
                grade = g
                # Confidence based on how well it fits
                confidence = min(
                    metrics["color_uniformity"] / criteria["color_uniformity"],
                    metrics["size_consistency"] / criteria["size_consistency"],
                    (1 - metrics["defect_ratio"]) / (1 - criteria["defect_ratio"])
                )
                break

        confidence = round(min(max(confidence, 0.5), 0.99), 2)

        # Price suggestion based on grade
        base_price = self.BASE_PRICES.get(crop_type, 30)
        grade_multiplier = {"A": 1.2, "B": 1.0, "C": 0.75}[grade.value]
        suggested_price = round(base_price * grade_multiplier, 2)
        price_range = {
            "min": round(suggested_price * 0.9, 2),
            "max": round(suggested_price * 1.15, 2)
        }

        return GradeResult(
            ai_grade=grade,
            confidence=confidence,
            suggested_price_range=price_range,
            quality_factors=metrics
        )

    def diagnose_crop(self, image_data: str, crop_type: str) -> DiagnosisResult:
        """
        Diagnose crop disease from image.
        Returns DiagnosisResult with issue, confidence, and treatment.
        """
        image = self._load_image(image_data)

        # Mock diagnosis - in production use trained model
        diseases = self.DISEASE_KB.get(crop_type, {})
        if not diseases:
            # Generic healthy/unknown
            return DiagnosisResult(
                likely_issue="Healthy / Unknown",
                confidence=0.7,
                recommended_action="No specific action needed. Monitor crop regularly.",
                possible_causes=[]
            )

        # Pick a disease based on mock analysis
        disease_name = random.choice(list(diseases.keys()))
        disease_info = diseases[disease_name]
        confidence = round(random.uniform(0.65, 0.92), 2)

        return DiagnosisResult(
            likely_issue=disease_name,
            confidence=confidence,
            recommended_action=disease_info["treatment"],
            possible_causes=disease_info["symptoms"]
        )


# Singleton instance
image_adapter = ImageAdapter()


def grade_crop_image(image_data: str, crop_type: str) -> Dict[str, Any]:
    """Convenience function for vision router"""
    result = image_adapter.grade_crop(image_data, crop_type)
    return result.model_dump()


def diagnose_crop_image(image_data: str, crop_type: str) -> Dict[str, Any]:
    """Convenience function for vision router (Crop Doctor)"""
    result = image_adapter.diagnose_crop(image_data, crop_type)
    return result.model_dump()