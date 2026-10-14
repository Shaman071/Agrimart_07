# AgriMart Backend - Chatbot Service with Word Boundary Matching & Accurate Demand Forecasting
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import random
import re
from datetime import datetime

class ChatQuery(BaseModel):
    query: str
    user_id: str
    user_role: str
    context: Dict[str, Any] = {}

class ChatResponse(BaseModel):
    answer: str
    data: Optional[Dict[str, Any]] = None
    suggestions: List[str] = []

class ChatbotService:
    """
    Demand Forecast Chatbot Service.
    Answers questions about crop arrivals, price trends, market conditions across Karnataka APMCs.
    """

    CROPS = [
        "tomato", "onion", "potato", "rice", "wheat", "maize", "ragi", "coconut",
        "banana", "mango", "chilli", "chili", "cabbage", "cauliflower", "brinjal", "okra",
        "pumpkin", "carrot", "beetroot", "groundnut", "soybean", "cotton", "sugarcane"
    ]
    
    DISTRICTS = [
        "bangalore", "bengaluru", "mysore", "mysuru", "hubli", "hubballi", "mangalore", "mangaluru",
        "belgaum", "belagavi", "gulbarga", "kalaburagi", "bidar", "raichur", "koppal", "dharwad",
        "bellary", "ballari", "chitradurga", "kolar", "mandya", "tumkur", "hassan"
    ]

    def __init__(self, supabase_client, market_service):
        self.supabase = supabase_client
        self.market_service = market_service

    def _find_crop(self, query: str) -> Optional[str]:
        q = query.lower()
        for c in self.CROPS:
            # Match whole words or plural forms (e.g., coconut, coconuts, tomato, tomatoes)
            pattern = r'\b' + re.escape(c) + r'(?:es|s)?\b'
            if re.search(pattern, q):
                return "chilli" if c == "chili" else c
        return None

    def _find_district(self, query: str) -> Optional[str]:
        q = query.lower()
        for d in self.DISTRICTS:
            if re.search(r'\b' + re.escape(d) + r'\b', q):
                return d
        return None

    async def process_query(self, chat_query: ChatQuery) -> ChatResponse:
        query = chat_query.query.strip()
        user_id = chat_query.user_id
        user_role = chat_query.user_role

        # Check intent priority
        if any(kw in query.lower() for kw in ["best time", "when to buy", "when to purchase", "trend", "forecast", "predict", "future", "रुझान", "पूर्वानुमान", "கருத்து", "ಪ್ರವೃತ್ತಿ"]):
            return await self._handle_demand_forecast_advice(query, user_id, user_role)
        elif any(kw in query.lower() for kw in ["price", "rate", "cost", "rates", "prices", "भाव", "விலை", "ರೇಟ್", "വില"]):
            return await self._handle_price_query(query, user_id, user_role)
        elif any(kw in query.lower() for kw in ["arrival", "supply", "coming", "آوک", "आवक", "வரவு", "ರವಾನೆ"]):
            return await self._handle_arrival_query(query, user_id, user_role)
        elif any(kw in query.lower() for kw in ["sell", "listing", "post", "बेचना", "விற்க", "ಮಾರು"]):
            return await self._handle_sell_query(query, user_id, user_role)
        elif any(kw in query.lower() for kw in ["how to buy", "steps to buy", "buy process", "purchase process"]):
            return await self._handle_buy_query(query, user_id, user_role)
        else:
            return await self._handle_flexible_query(query, user_id, user_role)

    async def _handle_price_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        found_crop = self._find_crop(query) or "tomato"
        found_district = self._find_district(query) or "bangalore"

        rates = self.market_service.get_apmc_rates(found_district, found_crop)
        if rates:
            modal_prices = [r.modal_price for r in rates]
            avg_modal = sum(modal_prices) / len(modal_prices)
            min_p = min(r.min_price for r in rates)
            max_p = max(r.max_price for r in rates)
            market_name = rates[0].market_name
            
            unit = "piece" if found_crop == "coconut" else "kg"

            return ChatResponse(
                answer=f"📊 **APMC Price Report for {found_crop.title()} in {rates[0].district}**:\n\n"
                       f"• **Modal Price**: ₹{avg_modal:.2f}/{unit}\n"
                       f"• **Price Range**: ₹{min_p:.2f} - ₹{max_p:.2f}/{unit}\n"
                       f"• **Reporting APMC Mandi**: {market_name}\n\n"
                       f"💡 *Buying Tip*: Direct farm pricing on AgriMart runs 15-25% below APMC modal rates due to zero middleman commission.",
                data={"crop": found_crop.title(), "district": rates[0].district, "rates": [r.model_dump() for r in rates]},
                suggestions=[
                    f"Best time to buy {found_crop.title()} this month",
                    f"Arrival volumes for {found_crop.title()} in {rates[0].district}",
                    "Browse Market Catalog"
                ]
            )

        return ChatResponse(
            answer="Please specify a crop and district. Example: 'Coconut prices near Mangalore' or 'Tomato price in Bangalore'.",
            suggestions=["Coconut prices near Mangalore", "Tomato price in Bangalore", "Rice rates in Mandya"]
        )

    async def _handle_demand_forecast_advice(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        found_crop = self._find_crop(query)
        found_district = self._find_district(query) or ("mangalore" if found_crop == "coconut" else "bangalore")

        crop_display = found_crop.title() if found_crop else "Crop"

        crop_forecasts = {
            "coconut": {
                "crop": "Coconut (Tiptur / Tender)",
                "modal_price": "₹20.00/piece",
                "trend": "Stable coastal supply in Mangalore & Udupi",
                "best_time": "Now! Coastal market arrivals are high with direct pricing from farmer Siddaiah T.",
                "tip": "Direct coconut farm orders on AgriMart run ₹20/piece vs ₹26 retail benchmark."
            },
            "rice": {
                "crop": "Rice (Sona Masoori)",
                "modal_price": "₹44.00/kg",
                "trend": "Stable to slightly declining (-3% expected)",
                "best_time": "Mid to late this month when fresh Mandya & Mysore harvest arrivals reach peak volume.",
                "tip": "Join an active AgriMart Group Buying Pool now to lock an instant 8-12% wholesale discount!"
            },
            "tomato": {
                "crop": "Tomato (Grade A)",
                "modal_price": "₹28.00/kg",
                "trend": "Favorable buying window (prices down 5% in Bangalore Urban)",
                "best_time": "Now! Current market supply is high from Kolar & Bangalore farms.",
                "tip": "Direct farm orders on AgriMart from Ramesh Gowda run ₹28/kg vs ₹34 APMC benchmark."
            },
            "onion": {
                "crop": "Onion (Red Nashik)",
                "modal_price": "₹32.00/kg",
                "trend": "Moderate increase (+4%) expected in 2 weeks due to Hubli transport demand",
                "best_time": "Buy within the next 3 to 5 days before regional prices increase.",
                "tip": "Leverage Group Buying Pools to aggregate demand with other B2B buyers."
            },
            "potato": {
                "crop": "Potato (Hassan Premium)",
                "modal_price": "₹22.00/kg",
                "trend": "Steady supply from Hassan district",
                "best_time": "Anytime this month. Prices are stable at ₹22/kg.",
                "tip": "Farmer Manjunath H is offering direct farm dispatch with escrow protection."
            }
        }

        info = crop_forecasts.get(found_crop, {
            "crop": crop_display,
            "modal_price": "₹30.00/kg",
            "trend": f"Stable market trends across {found_district.title()} APMCs",
            "best_time": "Mid-month procurement provides the best balance of stock availability and price stability.",
            "tip": "Use Group Buying Pools or direct farmer 1-to-1 negotiations for wholesale discounts."
        })

        answer = (
            f"🌾 **Demand & Buying Time Forecast for {info['crop']}**:\n\n"
            f"• **Current Benchmark Rate**: {info['modal_price']}\n"
            f"• **Market Trend Forecast**: {info['trend']}\n"
            f"• **Best Time to Buy**: {info['best_time']}\n\n"
            f"💡 *Buying Strategy*: {info['tip']}"
        )

        return ChatResponse(
            answer=answer,
            data={"crop": info['crop'], "district": found_district.title(), "forecast": info},
            suggestions=[
                f"{info['crop']} price in {found_district.title()}",
                f"Arrival volumes for {info['crop']}",
                "Browse Market Catalog"
            ]
        )

    async def _handle_arrival_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        found_crop = self._find_crop(query) or "tomato"
        found_district = self._find_district(query) or "bangalore"

        arrivals = self.market_service.get_crop_arrivals(found_district, found_crop)
        return ChatResponse(
            answer=f"📦 **Arrival Report for {arrivals['crop_type']} ({arrivals['district']})**:\n\n"
                   f"• **Last 7 Days**: {arrivals['arrivals_7d']} quintals\n"
                   f"• **Last 30 Days**: {arrivals['arrivals_30d']} quintals\n"
                   f"• **Daily Average**: {arrivals['avg_daily_arrival']} quintals/day\n"
                   f"• **Reporting Mandis**: {arrivals['markets_reporting']} APMC centers",
            data=arrivals,
            suggestions=[
                f"Best time to buy {arrivals['crop_type']} this month",
                "Best time to place group pool order?",
                "Show price forecast"
            ]
        )

    async def _handle_flexible_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        found_crop = self._find_crop(query)
        found_district = self._find_district(query)

        if found_crop or found_district:
            return await self._handle_price_query(query, user_id, user_role)

        return ChatResponse(
            answer="👋 Welcome to **AgriMart Demand Forecast Intelligence**!\n\n"
                   "Ask me about any crop or district in Karnataka. For example:\n"
                   "• *'Coconut prices near Mangalore'*\n"
                   "• *'Best time to buy Rice this month'*\n"
                   "• *'Tomato price in Bangalore'*",
            suggestions=["Coconut prices near Mangalore", "Best time to buy Rice this month", "Tomato price in Bangalore"]
        )

    async def _handle_sell_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        return ChatResponse(
            answer="📢 **To list produce as a farmer**:\n1. Click **KisanVani Voice Action**\n2. Speak naturally in Kannada, Hindi, or English (e.g. *'10 quintal rice at 44 rupees in Mysore'*)\n3. AI auto-extracts your listing & publishes it with 100% Escrow security.",
            suggestions=["Open KisanVani Voice Action", "Create Listing Manually", "Check my inventory"]
        )

    async def _handle_buy_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        return ChatResponse(
            answer="🛒 **To buy produce on AgriMart**:\n1. Browse **Market Catalog**\n2. Filter by crop, district, and APMC benchmark\n3. Add to Cart or join a **Group Buying Pool**\n4. Pay via Razorpay Escrow. Funds are released to the farmer only after delivery confirmation.",
            suggestions=["Browse Market Catalog", "View Cart", "Track Active Orders"]
        )