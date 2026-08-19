# AgriMart Backend - Market Data Service
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import random


class APMCRate(BaseModel):
    district: str
    crop_type: str
    min_price: float
    max_price: float
    modal_price: float
    date: str
    market_name: str


class MarketTrend(BaseModel):
    crop_type: str
    district: str
    avg_price_7d: float
    avg_price_30d: float
    price_change_7d: float
    price_change_30d: float
    arrival_volume_7d: float
    trend: str  # "rising", "falling", "stable"


class MarketService:
    """
    Market data service for APMC rates and trends.
    Mock implementation - in production, integrate with live APMC APIs.
    """

    # Mock APMC data for major Karnataka markets
    MOCK_APMC_DATA = {
        "Bangalore Urban": {
            "Tomato": [{"market": "Yeshwanthpur APMC", "min": 22, "max": 35, "modal": 28},
                       {"market": "K R Market", "min": 20, "max": 32, "modal": 26}],
            "Onion": [{"market": "Yeshwanthpur APMC", "min": 28, "max": 38, "modal": 32},
                      {"market": "K R Market", "min": 26, "max": 36, "modal": 30}],
            "Potato": [{"market": "Yeshwanthpur APMC", "min": 18, "max": 26, "modal": 22}],
            "Rice": [{"market": "Yeshwanthpur APMC", "min": 42, "max": 52, "modal": 48}],
            "Ragi": [{"market": "Yeshwanthpur APMC", "min": 32, "max": 40, "modal": 36}],
        },
        "Mysore": {
            "Tomato": [{"market": "Mysore APMC", "min": 20, "max": 32, "modal": 26}],
            "Onion": [{"market": "Mysore APMC", "min": 26, "max": 34, "modal": 30}],
            "Potato": [{"market": "Mysore APMC", "min": 16, "max": 24, "modal": 20}],
            "Ragi": [{"market": "Mysore APMC", "min": 30, "max": 38, "modal": 34}],
            "Coconut": [{"market": "Mysore APMC", "min": 16, "max": 22, "modal": 19}],
        },
        "Hubli": {
            "Tomato": [{"market": "Hubli APMC", "min": 18, "max": 30, "modal": 24}],
            "Onion": [{"market": "Hubli APMC", "min": 24, "max": 32, "modal": 28}],
            "Potato": [{"market": "Hubli APMC", "min": 14, "max": 22, "modal": 18}],
            "Maize": [{"market": "Hubli APMC", "min": 18, "max": 24, "modal": 21}],
            "Cotton": [{"market": "Hubli APMC", "min": 58, "max": 72, "modal": 65}],
        },
        "Mangalore": {
            "Tomato": [{"market": "Mangalore APMC", "min": 25, "max": 38, "modal": 30}],
            "Onion": [{"market": "Mangalore APMC", "min": 30, "max": 40, "modal": 35}],
            "Coconut": [{"market": "Mangalore APMC", "min": 18, "max": 24, "modal": 20}],
            "Banana": [{"market": "Mangalore APMC", "min": 35, "max": 48, "modal": 40}],
        },
        "Belgaum": {
            "Tomato": [{"market": "Belgaum APMC", "min": 20, "max": 30, "modal": 23}],
            "Onion": [{"market": "Belgaum APMC", "min": 23, "max": 31, "modal": 27}],
            "Sugarcane": [{"market": "Belgaum APMC", "min": 2.8, "max": 3.8, "modal": 3.2}],
            "Soybean": [{"market": "Belgaum APMC", "min": 44, "max": 52, "modal": 48}],
        },
    }

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def get_apmc_rates(self, district: str, crop_type: Optional[str] = None) -> List[APMCRate]:
        """
        Get APMC benchmark rates for a district and optionally crop.
        """
        district_data = self.MOCK_APMC_DATA.get(district, {})
        results = []

        crops = [crop_type] if crop_type else district_data.keys()

        for crop in crops:
            markets = district_data.get(crop, [])
            for m in markets:
                # Add some daily variation
                variation = random.uniform(-0.05, 0.05)
                results.append(APMCRate(
                    district=district,
                    crop_type=crop,
                    min_price=round(m["min"] * (1 + variation), 2),
                    max_price=round(m["max"] * (1 + variation), 2),
                    modal_price=round(m["modal"] * (1 + variation), 2),
                    date=datetime.now().strftime("%Y-%m-%d"),
                    market_name=m["market"]
                ))

        return results

    def get_district_trends(self, district: str) -> List[MarketTrend]:
        """
        Get price trends for all crops in a district.
        Mock implementation using simulated historical data.
        """
        district_data = self.MOCK_APMC_DATA.get(district, {})
        results = []

        for crop in district_data.keys():
            # Simulate 30-day price history
            base_price = district_data[crop][0]["modal"]
            prices_7d = [base_price * random.uniform(0.9, 1.1) for _ in range(7)]
            prices_30d = [base_price * random.uniform(0.85, 1.15) for _ in range(30)]

            avg_7d = sum(prices_7d) / 7
            avg_30d = sum(prices_30d) / 30

            change_7d = ((prices_7d[-1] - prices_7d[0]) / prices_7d[0]) * 100
            change_30d = ((prices_30d[-1] - prices_30d[0]) / prices_30d[0]) * 100

            if change_7d > 5:
                trend = "rising"
            elif change_7d < -5:
                trend = "falling"
            else:
                trend = "stable"

            results.append(MarketTrend(
                crop_type=crop,
                district=district,
                avg_price_7d=round(avg_7d, 2),
                avg_price_30d=round(avg_30d, 2),
                price_change_7d=round(change_7d, 1),
                price_change_30d=round(change_30d, 1),
                arrival_volume_7d=round(random.uniform(50, 500), 1),
                trend=trend
            ))

        return results

    def get_crop_arrivals(self, district: str, crop_type: str) -> Dict[str, Any]:
        """
        Get recent arrival volumes for a crop in district.
        Mock data.
        """
        return {
            "crop_type": crop_type,
            "district": district,
            "arrivals_7d": round(random.uniform(100, 1000), 1),
            "arrivals_30d": round(random.uniform(500, 5000), 1),
            "avg_daily_arrival": round(random.uniform(20, 150), 1),
            "markets_reporting": random.randint(3, 8)
        }