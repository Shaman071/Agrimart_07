# AgriMart Backend - Chatbot Service
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import random
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
    Answers questions about crop arrivals, price trends, market conditions.
    Uses database data + canned responses (RAG-less for simplicity).
    """

    def __init__(self, supabase_client, market_service):
        self.supabase = supabase_client
        self.market_service = market_service

    async def process_query(self, chat_query: ChatQuery) -> ChatResponse:
        """
        Process natural language query and return structured response.
        """
        query = chat_query.query.lower()
        user_id = chat_query.user_id
        user_role = chat_query.user_role

        # Intent classification (simple keyword-based)
        if any(kw in query for kw in ["price", "rate", "cost", "भाव", "விலை", "ರೇಟ್"]):
            return await self._handle_price_query(query, user_id, user_role)
        elif any(kw in query for kw in ["arrival", "supply", "coming", "आवक", "வரவு", "ರವಾನೆ"]):
            return await self._handle_arrival_query(query, user_id, user_role)
        elif any(kw in query for kw in ["trend", "forecast", "predict", "future", "रुझान", "पूर्वानुमान", "கருத்து", "ಪ್ರವೃತ್ತಿ"]):
            return await self._handle_trend_query(query, user_id, user_role)
        elif any(kw in query for kw in ["sell", "listing", "post", "बेचना", "விற்க", "ಮಾರು"]):
            return await self._handle_sell_query(query, user_id, user_role)
        elif any(kw in query for kw in ["buy", "purchase", "order", "खरीद", "வாங்க", "ಕೊಳ್ಳು"]):
            return await self._handle_buy_query(query, user_id, user_role)
        else:
            return await self._handle_general_query(query, user_id, user_role)

    async def _handle_price_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        """Handle price-related queries"""
        # Extract crop and district from query
        crops = ["tomato", "onion", "potato", "rice", "wheat", "maize", "ragi", "coconut",
                 "banana", "mango", "chilli", "cabbage", "cauliflower", "brinjal", "okra",
                 "pumpkin", "carrot", "beetroot", "groundnut", "soybean", "cotton", "sugarcane"]
        districts = ["bangalore", "mysore", "hubli", "mangalore", "belgaum", "gulbarga",
                     "bidar", "raichur", "koppal", "dharwad", "bellary", "chitradurga"]

        found_crop = next((c for c in crops if c in query), None)
        found_district = next((d for d in districts if d in query), None)

        if found_crop and found_district:
            rates = self.market_service.get_apmc_rates(found_district.title(), found_crop.title())
            if rates:
                modal_prices = [r.modal_price for r in rates]
                avg_modal = sum(modal_prices) / len(modal_prices)
                return ChatResponse(
                    answer=f"Current APMC modal price for {found_crop.title()} in {found_district.title()}: ₹{avg_modal:.2f}/kg (range: ₹{min(r.min_price for r in rates):.2f} - ₹{max(r.max_price for r in rates):.2f})",
                    data={"crop": found_crop, "district": found_district, "rates": [r.model_dump() for r in rates]},
                    suggestions=[
                        f"Show price trend for {found_crop} in {found_district}",
                        f"Compare prices across districts for {found_crop}",
                        "When is best time to sell?"
                    ]
                )

        return ChatResponse(
            answer="Please specify crop and district for price information. Example: 'Tomato price in Bangalore'",
            suggestions=["Tomato price in Bangalore", "Onion rates in Mysore", "Ragi price in Hubli"]
        )

    async def _handle_arrival_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        """Handle arrival/supply queries"""
        crops = ["tomato", "onion", "potato", "rice", "wheat", "maize", "ragi", "coconut"]
        districts = ["bangalore", "mysore", "hubli", "mangalore", "belgaum"]

        found_crop = next((c for c in crops if c in query), None)
        found_district = next((d for d in districts if d in query), None)

        if found_crop and found_district:
            arrivals = self.market_service.get_crop_arrivals(found_district.title(), found_crop.title())
            return ChatResponse(
                answer=f"Recent arrivals for {found_crop.title()} in {found_district.title()}: "
                       f"{arrivals['arrivals_7d']} quintals in last 7 days, "
                       f"{arrivals['arrivals_30d']} quintals in last 30 days. "
                       f"Average daily arrival: {arrivals['avg_daily_arrival']} quintals.",
                data=arrivals,
                suggestions=[
                    f"Price trend for {found_crop} in {found_district}",
                    "Which markets have highest arrivals?",
                    "Expected arrivals next week?"
                ]
            )

        return ChatResponse(
            answer="Specify crop and district for arrival data. Example: 'Onion arrivals in Bangalore'",
            suggestions=["Tomato arrivals in Bangalore", "Potato supply in Mysore", "Rice arrivals in Hubli"]
        )

    async def _handle_trend_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        """Handle trend/forecast queries"""
        districts = ["bangalore", "mysore", "hubli", "mangalore", "belgaum"]
        found_district = next((d for d in districts if d in query), None)

        if found_district:
            trends = self.market_service.get_district_trends(found_district.title())
            rising = [t for t in trends if t.trend == "rising"]
            falling = [t for t in trends if t.trend == "falling"]

            answer = f"Price trends for {found_district.title()}:\n"
            if rising:
                answer += f"📈 Rising: {', '.join([f'{t.crop_type} (+{t.price_change_7d}%)' for t in rising])}\n"
            if falling:
                answer += f"📉 Falling: {', '.join([f'{t.crop_type} ({t.price_change_7d}%)' for t in falling])}\n"
            stable = [t for t in trends if t.trend == "stable"]
            if stable:
                answer += f"➡️ Stable: {', '.join([t.crop_type for t in stable])}"

            return ChatResponse(
                answer=answer,
                data={"trends": [t.model_dump() for t in trends]},
                suggestions=[
                    f"Detailed forecast for {rising[0].crop_type if rising else 'Tomato'}",
                    "Best crops to plant this season",
                    "Market outlook for next month"
                ]
            )

        return ChatResponse(
            answer="Specify district for market trends. Example: 'Price trends in Bangalore'",
            suggestions=["Trends in Bangalore", "Market outlook Mysore", "Forecast for Hubli"]
        )

    async def _handle_sell_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        """Handle seller/farmer queries"""
        if user_role != "farmer":
            return ChatResponse(
                answer="This feature is for farmers. Please register as a farmer to list produce.",
                suggestions=["Register as farmer", "Learn about selling on AgriMart"]
            )

        # Get farmer's active listings
        try:
            listings = self.supabase.table("produce_listings").select("*").eq("farmer_id", user_id).eq("is_active", True).execute()
            if listings.data:
                crops = [l["crop_type"] for l in listings.data]
                return ChatResponse(
                    answer=f"You have active listings for: {', '.join(crops)}. Use the Inventory Manager to update quantities or create new listings.",
                    data={"listings": listings.data},
                    suggestions=["Create new listing", "Update quantities", "Check order status"]
                )
        except:
            pass

        return ChatResponse(
            answer="To sell on AgriMart: 1) Go to Create Listing, 2) Enter crop, quantity, price, 3) Use Voice (KisanVani) or Camera for AI grading, 4) Publish. Buyers will place orders.",
            suggestions=["Create Listing", "Use KisanVani Voice", "AI Grade my crop"]
        )

    async def _handle_buy_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        """Handle buyer queries"""
        if user_role not in ["buyer", "admin"]:
            return ChatResponse(
                answer="Buyer features require buyer registration. Please register as a buyer.",
                suggestions=["Register as buyer", "Browse marketplace"]
            )

        return ChatResponse(
            answer="To buy on AgriMart: 1) Browse Market Catalog with filters, 2) View listing details, 3) Add to cart or Join Pool for wholesale rates, 4) Place order with Razorpay escrow, 5) Track delivery in real-time.",
            suggestions=["Browse Market Catalog", "Join a Pool Order", "Track my orders"]
        )

    async def _handle_general_query(self, query: str, user_id: str, user_role: str) -> ChatResponse:
        """Handle general/help queries"""
        help_text = {
            "farmer": "I can help you with: crop prices, market trends, creating listings, AI grading (camera), voice listing (KisanVani), order management, and payouts.",
            "buyer": "I can help you with: browsing produce, price comparisons, pool orders for wholesale rates, order tracking, and market forecasts.",
            "admin": "I can help you with: system metrics, user verification, dispute resolution, fraud detection, and kiosk registration."
        }

        return ChatResponse(
            answer=help_text.get(user_role, "Welcome to AgriMart! Ask me about prices, trends, or how to buy/sell."),
            suggestions=["Crop prices", "Market trends", "How to sell", "How to buy"]
        )