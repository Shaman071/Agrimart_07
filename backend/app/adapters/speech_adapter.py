# AgriMart Backend - Speech Adapter
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import re

class ListingData(BaseModel):
    crop_type: str = Field(default="Tomato")
    qty_avail: float = Field(default=100.0)
    price: float = Field(default=28.0)
    district: str = Field(default="Bangalore Urban")

class SpeechAdapter:
    CROP_MAPPINGS = {
        "ಅಕ್ಕಿ": "Rice", "ರಾಗಿ": "Ragi", "ತೆಂಗಿನಕಾಯಿ": "Coconut",
        "ಮೆಣಸಿನಕಾಯಿ": "Chilli", "ಟೊಮ್ಯಾಟೊ": "Tomato", "ಬಾಳೆಹಣ್ಣು": "Banana",
        "ಮಾವಿನಕಾಯಿ": "Mango", "ಆಲೂಗಡ್ಡೆ": "Potato", "ಈರುಳ್ಳಿ": "Onion",
        "चावल": "Rice", "गेहूं": "Wheat", "मक्का": "Maize", "आलू": "Potato",
        "प्याज": "Onion", "टमाटर": "Tomato", "मिर्च": "Chilli", "केला": "Banana", "आम": "Mango",
        "rice": "Rice", "wheat": "Wheat", "maize": "Maize", "ragi": "Ragi",
        "coconut": "Coconut", "tomato": "Tomato", "onion": "Onion", "potato": "Potato",
        "chilli": "Chilli", "banana": "Banana", "mango": "Mango",
    }

    DISTRICT_MAPPINGS = {
        "ಬೆಂಗಳೂರು": "Bangalore Urban", "ಮೈಸೂರು": "Mysore", "ಹುಬಳ್ಳಿ": "Hubli",
        "ಧಾರವಾಡ": "Dharwad", "ಮಂಗಳೂರು": "Mangalore", "ಬೆಳಗಾವಿ": "Belgaum",
        "ಬೆಂಗಳೂರಿನಲ್ಲಿ": "Bangalore Urban", "ಮೈಸೂರಿನಲ್ಲಿ": "Mysore", "ಹುಬಳ್ಳಿಯಲ್ಲಿ": "Hubli",
        "बेंगलुरु": "Bangalore Urban", "मैसूर": "Mysore", "हुबली": "Hubli",
        "bangalore": "Bangalore Urban", "mysore": "Mysore", "hubli": "Hubli",
        "mangalore": "Mangalore", "belgaum": "Belgaum", "kolar": "Kolar",
    }

    UNIT_MAPPINGS = {
        "kg": 1, "kgs": 1, "kilo": 1, "kilos": 1, "kilogram": 1,
        "quintal": 100, "quintals": 100, "qtl": 100, "ton": 1000, "tons": 1000,
        "किलो": 1, "क्विंटल": 100, "टन": 1000,
        "ಕಿಲೋ": 1, "ಕ್ವಿಂಟಲ್": 100, "ಟನ್": 1000,
    }

    def parse(self, raw_text: str, language: str = "en") -> ListingData:
        text = raw_text.strip()

        crop = self._extract_crop(text) or "Tomato"
        qty = self._extract_quantity(text) or 100.0
        price = self._extract_price(text) or 28.0
        district = self._extract_district(text) or "Bangalore Urban"

        return ListingData(
            crop_type=crop,
            qty_avail=qty,
            price=price,
            district=district
        )

    def _extract_crop(self, text: str) -> Optional[str]:
        text_lower = text.lower()
        for vernacular, english in self.CROP_MAPPINGS.items():
            if vernacular.lower() in text_lower:
                return english
        return None

    def _extract_quantity(self, text: str) -> Optional[float]:
        pattern = r"(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|quintal|quintals|qtl|ton|tons|tonne|bag|bags|किलो|क्विंटल|टन|ಕಿಲೋ|ಕ್ವಿಂಟಲ್|ಟನ್)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = float(match.group(1))
            unit = match.group(2).lower()
            mult = self.UNIT_MAPPINGS.get(unit, 1)
            return val * mult

        pattern2 = r"(\d+(?:\.\d+)?)"
        match2 = re.search(pattern2, text)
        if match2:
            return float(match2.group(1))
        return None

    def _extract_price(self, text: str) -> Optional[float]:
        patterns = [
            r"(?:price|rate|at|@|rs\.?|₹|rupees|रुपये|ರೂಪಾಯಿ)?\s*(\d+(?:\.\d+)?)\s*(?:rs|₹|rupees|per|\/|प्रति|ಪ್ರತಿ)",
            r"at\s*(\d+(?:\.\d+)?)",
            r"(\d+(?:\.\d+)?)\s*(?:rs|rupees|₹|रुपये|ರೂಪಾಯಿ)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        return None

    def _extract_district(self, text: str) -> Optional[str]:
        text_lower = text.lower()
        for vernacular, english in self.DISTRICT_MAPPINGS.items():
            if vernacular.lower() in text_lower:
                return english
        return None

speech_adapter = SpeechAdapter()

def parse_listing_from_speech(raw_text: str, language: str = "en") -> Dict[str, Any]:
    return speech_adapter.parse(raw_text, language).model_dump()