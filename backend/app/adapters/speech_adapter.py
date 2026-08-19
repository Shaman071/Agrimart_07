# AgriMart Backend - Speech Adapter
# Adapter Pattern: Converts raw Whisper/STT output to structured listing JSON

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import re
import json


class ListingData(BaseModel):
    """Structured output for frontend listing form"""
    crop_type: str = Field(..., description="Crop name in English")
    qty_avail: float = Field(..., gt=0, description="Quantity in kg/quintal")
    price: float = Field(..., gt=0, description="Price per unit")
    district: str = Field(..., description="District name")


class SpeechAdapter:
    """
    Adapter for converting speech-to-text output to structured listing data.
    Supports Kannada, Hindi, English input.
    """

    # Crop name mappings (vernacular -> English)
    CROP_MAPPINGS = {
        # Kannada
        "அரிசி": "Rice", "ராகி": "Ragi", "தேங்காய்": "Coconut",
        "வெள்ளரி": "Cucumber", "மிளகாய்": "Chilli", "தக்காளி": "Tomato",
        "வாழைப்பழம்": "Banana", "மாங்காய்": "Mango", "கப்பாலம்": "Cabbage",
        "பீட்ரூட்": "Beetroot", "கேரட்": "Carrot", "உருளைக் கிழங்கு": "Potato",
        "வெங்காயம்": "Onion", "சாம்பல்": "Sambar Onion", "பூசணி": "Pumpkin",

        # Hindi
        "चावल": "Rice", "गेहूं": "Wheat", "मक्का": "Maize", "बाजरा": "Bajra",
        "ज्वार": "Jowar", "चना": "Chickpea", "अरहर": "Pigeon Pea", "मूंग": "Green Gram",
        "उड़द": "Black Gram", "मसूर": "Lentil", "सरसों": "Mustard", "सोयाबीन": "Soybean",
        "मूंगफली": "Groundnut", "तिल": "Sesame", "कपास": "Cotton", "गन्ना": "Sugarcane",
        "आलू": "Potato", "प्याज": "Onion", "टमाटर": "Tomato", "मिर्च": "Chilli",
        "फूलगोभी": "Cauliflower", "पत्तागोभी": "Cabbage", "भिंडी": "Okra", "बैंगन": "Brinjal",
        "केला": "Banana", "आम": "Mango", "पपीता": "Papaya", "अंगूर": "Grapes",

        # English (passthrough)
        "rice": "Rice", "wheat": "Wheat", "maize": "Maize", "ragi": "Ragi",
        "coconut": "Coconut", "tomato": "Tomato", "onion": "Onion", "potato": "Potato",
        "chilli": "Chilli", "banana": "Banana", "mango": "Mango",
    }

    # District mappings
    DISTRICT_MAPPINGS = {
        # Karnataka districts (Kannada/English)
        "ಬೆಂಗಳೂರು": "Bangalore Urban", "ಬೆಂಗಳೂರು ಗ್ರಾಮೀಣ": "Bangalore Rural",
        "ಮೈಸೂರು": "Mysore", "ಹubli": "Hubli", "ಧಾರವಾಡ": "Dharwad",
        "ಮಂಗಳೂರು": "Mangalore", "ಬೆಳಗಾವಿ": "Belgaum", "ಗುಲ್ಬರ್ಗಾ": "Gulbarga",
        "ಬidone": "Bidar", "ರಾಯಚೂರು": "Raichur", "ಕೊಪ್ಪಲ್": "Koppal",

        # Common English names
        "bangalore": "Bangalore Urban", "mysore": "Mysore", "hubli": "Hubli",
        "mangalore": "Mangalore", "belgaum": "Belgaum",
    }

    # Unit mappings
    UNIT_MAPPINGS = {
        "kg": 1, "kgs": 1, "kilo": 1, "kilos": 1, "kilogram": 1,
        "quintal": 100, "quintals": 100, "qtl": 100,
        "ton": 1000, "tons": 1000, "tonne": 1000,
        "bag": 50, "bags": 50,
    }

    def __init__(self):
        pass

    def parse(self, raw_text: str, language: str = "en") -> ListingData:
        """
        Main entry point: convert raw STT text to ListingData
        """
        # Normalize text
        text = raw_text.lower().strip()

        # Extract entities
        crop = self._extract_crop(text)
        qty = self._extract_quantity(text)
        price = self._extract_price(text)
        district = self._extract_district(text)

        # Validate required fields
        missing = []
        if not crop:
            missing.append("crop_type")
        if not qty:
            missing.append("qty_avail")
        if not price:
            missing.append("price")
        if not district:
            missing.append("district")

        if missing:
            raise ValueError(f"Could not extract: {', '.join(missing)}. Please speak again with all details.")

        return ListingData(
            crop_type=crop,
            qty_avail=qty,
            price=price,
            district=district
        )

    def _extract_crop(self, text: str) -> Optional[str]:
        """Extract crop name from text"""
        # Check for known crop names
        for vernacular, english in self.CROP_MAPPINGS.items():
            if vernacular.lower() in text:
                return english

        # Try to find crop after keywords
        patterns = [
            r"(?:crop|फसल|பயிர்|பயிர் வகை)\s+(?:is|ہے|ஆகும்|это)\s*(\w+)",
            r"(?:growing|उगा रहे|வளர்த்து|grow)\s+(\w+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                crop = match.group(1).lower()
                return self.CROP_MAPPINGS.get(crop, crop.title())

        return None

    def _extract_quantity(self, text: str) -> Optional[float]:
        """Extract quantity and convert to kg"""
        # Pattern: number + unit
        pattern = r"(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|quintal|quintals|qtl|ton|tons|tonne|bag|bags)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = float(match.group(1))
            unit = match.group(2).lower()
            multiplier = self.UNIT_MAPPINGS.get(unit, 1)
            return value * multiplier

        # Pattern: just number (assume kg)
        pattern2 = r"(?:quantity|मात्रा|அளவு|qty)\s*(?:is|ہے|ஆகும்)?\s*(\d+(?:\.\d+)?)"
        match = re.search(pattern2, text, re.IGNORECASE)
        if match:
            return float(match.group(1))

        return None

    def _extract_price(self, text: str) -> Optional[float]:
        """Extract price per unit"""
        patterns = [
            r"(?:price|दर|விலை|rate)\s*(?:is|ہے|ஆகும்)?\s*(?:rs\.?|₹|rupees)?\s*(\d+(?:\.\d+)?)",
            r"(?:rs\.?|₹|rupees)\s*(\d+(?:\.\d+)?)\s*(?:per|/|প্রতি|ம*)&?(?:kg|quintal|kilo)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))

        return None

    def _extract_district(self, text: str) -> Optional[str]:
        """Extract district name"""
        for vernacular, english in self.DISTRICT_MAPPINGS.items():
            if vernacular.lower() in text:
                return english

        # Pattern: district keyword + name
        pattern = r"(?:district|जिला|மாவட்டம்)\s+(?:is|ہے|ஆகும்)?\s*(\w+)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            district = match.group(1).lower()
            return self.DISTRICT_MAPPINGS.get(district, district.title())

        return None


# Singleton instance
speech_adapter = SpeechAdapter()


def parse_listing_from_speech(raw_text: str, language: str = "en") -> Dict[str, Any]:
    """
    Convenience function for the voice router.
    Returns dict compatible with frontend form.
    """
    data = speech_adapter.parse(raw_text, language)
    return data.model_dump()