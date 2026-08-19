# AgriMart Backend - Fraud Detection Service
from typing import Dict, Any, List
from pydantic import BaseModel, Field
import random
from datetime import datetime, timedelta


class FraudScore(BaseModel):
    score: float = Field(..., ge=0, le=100)
    risk_level: str
    reason_codes: List[str]
    details: Dict[str, Any]


class FraudService:
    """
    Fraud anomaly detection for listings and accounts.
    Checks: price anomalies, duplicate registrations, velocity checks.
    """

    # Mock district median prices (per kg)
    DISTRICT_MEDIANS = {
        "Bangalore Urban": {"Tomato": 28, "Onion": 32, "Potato": 22, "Rice": 48},
        "Mysore": {"Tomato": 26, "Onion": 30, "Potato": 20, "Ragi": 34},
        "Hubli": {"Tomato": 24, "Onion": 28, "Potato": 18, "Maize": 21},
        "Mangalore": {"Tomato": 30, "Onion": 35, "Potato": 24, "Coconut": 20},
        "Belgaum": {"Tomato": 23, "Onion": 27, "Potato": 19, "Sugarcane": 3.2},
    }

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    async def score_listing(self, listing_data: Dict[str, Any]) -> FraudScore:
        """
        Score a produce listing for anomalies.
        """
        reason_codes = []
        score = 0.0
        details = {}

        # 1. Price anomaly check (>40% below district median)
        district = listing_data.get("district", "")
        crop = listing_data.get("crop_type", "")
        price = listing_data.get("price", 0)

        median_price = self.DISTRICT_MEDIANS.get(district, {}).get(crop, 0)
        if median_price > 0 and price > 0:
            deviation = (median_price - price) / median_price * 100
            details["price_deviation_pct"] = round(deviation, 1)
            details["district_median"] = median_price

            if deviation > 40:
                reason_codes.append("PRICE_BELOW_MEDIAN_40PCT")
                score += 35
            elif deviation > 25:
                reason_codes.append("PRICE_BELOW_MEDIAN_25PCT")
                score += 20

        # 2. Unusually high quantity for small farmer (mock check)
        qty = listing_data.get("qty_avail", 0)
        if qty > 10000:  # 10 tonnes
            reason_codes.append("UNUSUALLY_HIGH_QUANTITY")
            score += 15
            details["quantity_flag"] = "exceeds_typical_smallholder_volume"

        # 3. Duplicate listing check (same farmer, same crop, similar price in 24h)
        # In production: query database
        duplicate_check = await self._check_duplicate_listing(listing_data)
        if duplicate_check:
            reason_codes.append("POTENTIAL_DUPLICATE_LISTING")
            score += 25
            details["duplicate_listing_id"] = duplicate_check

        # 4. New account with high-value listing
        farmer_id = listing_data.get("farmer_id")
        if farmer_id:
            account_age = await self._get_account_age(farmer_id)
            if account_age and account_age < 7 and price * qty > 50000:
                reason_codes.append("NEW_ACCOUNT_HIGH_VALUE")
                score += 20
                details["account_age_days"] = account_age

        risk_level = self._calculate_risk_level(score)

        return FraudScore(
            score=round(min(score, 100), 1),
            risk_level=risk_level,
            reason_codes=reason_codes,
            details=details
        )

    async def score_account(self, user_data: Dict[str, Any]) -> FraudScore:
        """
        Score a user account for fraud risk.
        """
        reason_codes = []
        score = 0.0
        details = {}

        # 1. Multiple accounts from same device/IP in 24h
        device_id = user_data.get("device_id")
        ip = user_data.get("ip_address")
        if device_id or ip:
            recent_count = await self._count_recent_registrations(device_id, ip)
            if recent_count >= 3:
                reason_codes.append("MULTIPLE_ACCOUNTS_24H")
                score += 40
                details["recent_registrations"] = recent_count

        # 2. Phone/email pattern anomalies
        phone = user_data.get("phone", "")
        if self._is_suspicious_phone_pattern(phone):
            reason_codes.append("SUSPICIOUS_PHONE_PATTERN")
            score += 15

        # 3. Incomplete profile for farmer/buyer role
        role = user_data.get("role", "")
        if role == "farmer":
            if not user_data.get("district") or not user_data.get("land_size"):
                reason_codes.append("INCOMPLETE_FARMER_PROFILE")
                score += 10
        elif role == "buyer":
            if not user_data.get("buyer_type") or not user_data.get("address"):
                reason_codes.append("INCOMPLETE_BUYER_PROFILE")
                score += 10

        # 4. Trust score anomaly (very low without history)
        trust_score = user_data.get("trust_score", 50)
        if trust_score < 20:
            reason_codes.append("LOW_TRUST_SCORE")
            score += 15

        risk_level = self._calculate_risk_level(score)

        return FraudScore(
            score=round(min(score, 100), 1),
            risk_level=risk_level,
            reason_codes=reason_codes,
            details=details
        )

    async def _check_duplicate_listing(self, listing_data: Dict) -> str:
        """Mock: check for similar recent listing by same farmer"""
        # In production: query produce_listings table
        # SELECT id FROM produce_listings WHERE farmer_id = X AND crop_type = Y
        # AND ABS(price - Z) < 5 AND created_at > NOW() - INTERVAL '24 hours'
        return None  # Mock: no duplicates found

    async def _get_account_age(self, farmer_id: str) -> int:
        """Mock: get account age in days"""
        # In production: query users.created_at
        return random.randint(1, 365)

    async def _count_recent_registrations(self, device_id: str, ip: str) -> int:
        """Mock: count registrations from same device/IP in 24h"""
        # In production: query users table with device fingerprint
        return random.randint(0, 2)

    def _is_suspicious_phone_pattern(self, phone: str) -> bool:
        """Check for suspicious phone patterns"""
        if not phone:
            return False
        # Patterns: sequential digits, all same digit, known test numbers
        suspicious = ["1111111111", "1234567890", "9999999999", "0000000000"]
        return phone[-10:] in suspicious

    def _calculate_risk_level(self, score: float) -> str:
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        elif score >= 20:
            return "LOW"
        return "MINIMAL"