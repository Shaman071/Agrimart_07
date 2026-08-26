# AgriMart Backend - Speech Adapter
# Adapter Pattern: Converts raw Whisper/STT output to structured listing JSON

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import re


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
        "ಅಕ್ಕಿ": "Rice", "ರಾಗಿ": "Ragi", "ತೆಂಗಿನಕಾಯಿ": "Coconut",
        "ದೋಸಕಾಯಿ": "Cucumber", "ಮೆಣಸಿನಕಾಯಿ": "Chilli", "ಟೊಮ್ಯಾಟೊ": "Tomato",
        "ಬಾಳೆಹಣ್ಣು": "Banana", "ಮಾವಿನಕಾಯಿ": "Mango", "ಕೋಸು": "Cabbage",
        "ಬೀಟ್ರೂಟ್": "Beetroot", "ಕ್ಯಾರೆಟ್": "Carrot", "ಆಲೂಗಡ್ಡೆ": "Potato",
        "ಈರುಳ್ಳಿ": "Onion", "ಕ್ಯಾರೆಟ್": "Carrot", "ಕುಂಬಳಕಾಯಿ": "Pumpkin",

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
        "ಬೆಂಗಳೂರಿನಲ್ಲಿ": "Bangalore Urban", "ಬೆಂಗಳೂರು ಗ್ರಾಮೀಣದಲ್ಲಿ": "Bangalore Rural",
        "ಮೈಸೂರು": "Mysore", "ಹubli": "Hubli", "ಧಾರವಾಡ": "Dharwad",
        "ಮೈಸೂರಿನಲ್ಲಿ": "Mysore", "ಹುಬಳ್ಳಿಯಲ್ಲಿ": "Hubli", "ಧಾರವಾಡದಲ್ಲಿ": "Dharwad",
        "ಮಂಗಳೂರು": "Mangalore", "ಬೆಳಗಾವಿ": "Belgaum", "ಗುಲ್ಬರ್ಗಾ": "Gulbarga",
        "ಮಂಗಳೂರಿನಲ್ಲಿ": "Mangalore", "ಬೆಳಗಾವಿಯಲ್ಲಿ": "Belgaum", "ಗುಲಬರ್ಗದಲ್ಲಿ": "Gulbarga",
        "ಬಿಸಿ": "Bidar", "ರಾಯಚೂರು": "Raichur", "ಕೊಪ್ಪಲ್": "Koppal",
        "ಬಿದರದಲ್ಲಿ": "Bidar", "ರಾಯಚೂರಿನಲ್ಲಿ": "Raichur", "ಕೊಪ್ಪಲ್‌ನಲ್ಲಿ": "Koppal",

        # Hindi district names (Devanagari)
        "बेंगलुरु": "Bangalore Urban", "बेंगलुरु ग्रामीण": "Bangalore Rural",
        "मैसूर": "Mysore", "हुबली": "Hubli", "धारवाड़": "Dharwad",
        "मैंगलोर": "Mangalore", "बेलगाम": "Belgaum", "गुलबर्गा": "Gulbarga",

        # Common English names
        "bangalore": "Bangalore Urban", "mysore": "Mysore", "hubli": "Hubli",
        "mangalore": "Mangalore", "belgaum": "Belgaum",
    }

    # Unit mappings
    UNIT_MAPPINGS = {
        # English
        "kg": 1, "kgs": 1, "kilo": 1, "kilos": 1, "kilogram": 1,
        "quintal": 100, "quintals": 100, "qtl": 100,
        "ton": 1000, "tons": 1000, "tonne": 1000,
        "bag": 50, "bags": 50,
        # Hindi
        "किलो": 1, "किलोग्राम": 1, "क्विंटल": 100, "क्विंटल्स": 100,
        "टन": 1000, "बैग": 50, "बोरा": 50,
        # Kannada
        "ಕಿಲೋ": 1, "ಕಿಲೋಗ್ರಾಂ": 1, "ಕ್ವಿಂಟಲ್": 100, "ಟನ್": 1000, "ಬ್ಯಾಗ್": 50,
    }

    def __init__(self):
        pass

    def parse(self, raw_text: str, language: str = "en") -> ListingData:
        """
        Main entry point: convert raw STT text to ListingData
        """
        # Normalize text - for non-Latin scripts, lower() doesn't change characters
        text = raw_text.strip()

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
        # Check for known crop names (case-insensitive for Latin, exact for non-Latin)
        text_lower = text.lower()
        for vernacular, english in self.CROP_MAPPINGS.items():
            if vernacular.lower() in text_lower:
                return english

        # Try to find crop after keywords
        patterns = [
            r"(?:crop|फसल|பயிர்|ಪಯಿರ್ வகೈ)\s+(?:is|ਹैं|ಆಗುಮೆ|это)\s*(\w+)",
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
        # Pattern: number + unit (English, Hindi, Kannada)
        pattern = r"(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|quintal|quintals|qtl|ton|tons|tonne|bag|bags|किलो|किलोग्राम|क्विंटल|क्विंटल्स|टन|बैग|बोरा|ಕಿಲೋ|ಕಿಲೋಗ್ರಾಂ|ಕ್ವಿಂಟಲ್|ಟನ್|ಬ್ಯಾಗ್)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = float(match.group(1))
            unit = match.group(2).lower()
            multiplier = self.UNIT_MAPPINGS.get(unit, 1)
            return value * multiplier

        # Pattern: just number (assume kg)
        pattern2 = r"(?:quantity|मात्रा|அளவு|qty)\s*(?:is|ਹैं|ಆಗುಮೆ)?\s*(\d+(?:\.\d+)?)"
        match = re.search(pattern2, text, re.IGNORECASE)
        if match:
            return float(match.group(1))

        return None

    def _extract_price(self, text: str) -> Optional[float]:
        """Extract price per unit"""
        patterns = [
            # "price is 25 rupees per kg" / "rate 25 rs per kg"
            r"(?:price|rate|ದর|விலை)\s*(?:is|ਹैं|ಆಗುಮೆ)?\s*(?:rs\.?|₹|rupees|रुपये|ರೂಪಾಯಿ|ರೂಪಾಯಿ)?\s*(\d+(?:\.\d+)?)\s*(?:per|/|ಪ್ರತಿ|ಮೂಲ್ಯ)?\s*(?:kg|quintal|kilo|किलो|கிலோ|ಕಿಲೋ)?",
            # "at 25 rupees per kg" / "25 rupees per kg"
            r"(?:at|@)\s*(?:rs\.?|₹|rupees|रुपये|ರೂಪಾಯಿ|ರೂಪಾಯಿ)?\s*(\d+(?:\.\d+)?)\s*(?:per|/|ಪ್ರತಿ|ಮೂಲ್ಯ)?\s*(?:kg|quintal|kilo|किलो|கிலோ|ಕಿಲೋ)?",
            # "rs. 25 per kg" / "₹ 25/kg"
            r"(?:rs\.?|₹|rupees|रुपये|ರೂಪಾಯಿ|ರೂಪಾಯಿ)\s*(\d+(?:\.\d+)?)\s*(?:per|/|ಪ್ರತಿ|ಮೂಲ್ಯ)?\s*(?:kg|quintal|kilo|ಕಿಲೋ|கிலோ)?",
            # "25 rs/kg"
            r"(\d+(?:\.\d+)?)\s*(?:rs\.?|₹|rupees|रुपये|ರೂಪಾಯಿ|ರೂಪಾಯಿ)\s*(?:per|/|ಪ್ರತಿ|ಮೂಲ್ಯ)?\s*(?:kg|quintal|kilo|ಕಿಲೋ|கிலோ)?",
            # "28 ರೂಪಾಯಿಯಲ್ಲಿ" - Kannada rupees with case ending
            r"(\d+(?:\.\d+)?)\s*(?:ರೂಪಾಯಿ|ರೂಪಾಯಿ|ರೂಪಾಯಿಗಳ)\s*(?:per|/|ಪ್ರತಿ|ಮೂಲ್ಯ)?\s*(?:kg|quintal|kilo|ಕಿಲೋ|ಕಿಗ್ರಾ)?",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))

        return None

    def _extract_district(self, text: str) -> Optional[str]:
        """Extract district name"""
        text_lower = text.lower()
        for vernacular, english in self.DISTRICT_MAPPINGS.items():
            if vernacular.lower() in text_lower:
                return english

        # Pattern: district keyword + name
        pattern = r"(?:district|जिला|ಮಾವಟ್ಟ)\s+(?:is|ਹैं|ಆಗುಮೆ)?\s*(\w+)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            district = match.group(1).lower()
            return self.DISTRICT_MAPPINGS.get(district, district.title())

        # Pattern: "in Bangalore" / "in Mysore"
        pattern2 = r"(?:in|at|में|ನಲ್ಲಿ)\s+(\w+(?:\s+\w+)?)"
        match = re.search(pattern2, text, re.IGNORECASE)
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