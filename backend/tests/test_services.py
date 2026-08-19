# AgriMart Backend - Test Configuration
import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.adapters.speech_adapter import speech_adapter, parse_listing_from_speech
from app.adapters.image_adapter import image_adapter, grade_crop_image, diagnose_crop_image
from app.services.fraud_service import FraudService
from app.services.market_service import MarketService


class TestSpeechAdapter:
    """Tests for speech-to-listing parsing"""

    def test_parse_english_listing(self):
        text = "I have 500 kg tomato at 25 rupees per kg in Bangalore"
        result = parse_listing_from_speech(text, "en")
        assert result["crop_type"] == "Tomato"
        assert result["qty_avail"] == 500
        assert result["price"] == 25
        assert result["district"] == "Bangalore Urban"

    def test_parse_hindi_listing(self):
        text = "मेरे पास 10 क्विंटल प्याज 30 रुपये प्रति किलो में है मैसूर में"
        result = parse_listing_from_speech(text, "hi")
        assert result["crop_type"] == "Onion"
        assert result["qty_avail"] == 1000  # 10 quintal = 1000 kg
        assert result["price"] == 30
        assert result["district"] == "Mysore"

    def test_parse_kannada_listing(self):
        text = "ನನ್ನ ಬಳಿ 200 ಕಿಲೋ ಟೊಮ್ಯಾಟೊ 28 ರೂಪಾಯಿಯಲ್ಲಿ ಬೆಂಗಳೂರಿನಲ್ಲಿ"
        result = parse_listing_from_speech(text, "kn")
        assert result["crop_type"] == "Tomato"
        assert result["qty_avail"] == 200
        assert result["price"] == 28
        assert result["district"] == "Bangalore Urban"

    def test_missing_fields_raises_error(self):
        text = "I have tomato"
        with pytest.raises(ValueError) as exc:
            parse_listing_from_speech(text, "en")
        assert "Could not extract" in str(exc.value)

    def test_unit_conversion_quintal(self):
        text = "5 quintal rice at 45 rs/kg in Hubli"
        result = parse_listing_from_speech(text, "en")
        assert result["qty_avail"] == 500  # 5 quintal = 500 kg


class TestImageAdapter:
    """Tests for image grading and diagnosis"""

    def test_grade_crop_returns_valid_structure(self):
        # Create a minimal test image
        from PIL import Image
        import io
        import base64

        img = Image.new('RGB', (100, 100), color='red')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

        result = grade_crop_image(img_base64, "Tomato")
        assert "ai_grade" in result
        assert result["ai_grade"] in ["A", "B", "C"]
        assert 0 <= result["confidence"] <= 1
        assert "suggested_price_range" in result
        assert "min" in result["suggested_price_range"]
        assert "max" in result["suggested_price_range"]

    def test_diagnose_crop_returns_valid_structure(self):
        from PIL import Image
        import io
        import base64

        img = Image.new('RGB', (100, 100), color='green')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

        result = diagnose_crop_image(img_base64, "Tomato")
        assert "likely_issue" in result
        assert "confidence" in result
        assert 0 <= result["confidence"] <= 1
        assert "recommended_action" in result


class TestFraudService:
    """Tests for fraud detection"""

    @pytest.fixture
    def fraud_service(self):
        class MockSupabase:
            pass
        return FraudService(MockSupabase())

    @pytest.mark.asyncio
    async def test_score_listing_price_anomaly(self, fraud_service):
        listing = {
            "farmer_id": "test-farmer",
            "crop_type": "Tomato",
            "qty_avail": 100,
            "price": 10,  # Way below median of ~28
            "district": "Bangalore Urban"
        }
        result = await fraud_service.score_listing(listing)
        assert result.score > 30
        assert "PRICE_BELOW_MEDIAN_40PCT" in result.reason_codes

    @pytest.mark.asyncio
    async def test_score_listing_normal_price(self, fraud_service):
        listing = {
            "farmer_id": "test-farmer",
            "crop_type": "Tomato",
            "qty_avail": 100,
            "price": 28,  # At median
            "district": "Bangalore Urban"
        }
        result = await fraud_service.score_listing(listing)
        assert result.score < 20
        assert result.risk_level in ["MINIMAL", "LOW"]

    @pytest.mark.asyncio
    async def test_score_account_multiple_registrations(self, fraud_service):
        user = {
            "user_id": "test-user",
            "role": "farmer",
            "phone": "9876543210",
            "device_id": "device-123",
            "ip_address": "192.168.1.1"
        }
        # Mock the internal method to return high count
        fraud_service._count_recent_registrations = lambda d, i: 5
        result = await fraud_service.score_account(user)
        assert result.score >= 40
        assert "MULTIPLE_ACCOUNTS_24H" in result.reason_codes


class TestMarketService:
    """Tests for market data service"""

    @pytest.fixture
    def market_service(self):
        class MockSupabase:
            pass
        return MarketService(MockSupabase())

    def test_get_apmc_rates_known_district(self, market_service):
        rates = market_service.get_apmc_rates("Bangalore Urban", "Tomato")
        assert len(rates) > 0
        for r in rates:
            assert r.district == "Bangalore Urban"
            assert r.crop_type == "Tomato"
            assert r.min_price > 0
            assert r.max_price >= r.min_price
            assert r.modal_price > 0

    def test_get_apmc_rates_unknown_district(self, market_service):
        rates = market_service.get_apmc_rates("Unknown District", "Tomato")
        assert rates == []

    def test_get_district_trends(self, market_service):
        trends = market_service.get_district_trends("Bangalore Urban")
        assert len(trends) > 0
        for t in trends:
            assert t.district == "Bangalore Urban"
            assert t.trend in ["rising", "falling", "stable"]


class TestChatbotService:
    """Tests for chatbot service"""

    @pytest.fixture
    def chatbot_service(self):
        class MockSupabase:
            def table(self, name):
                class MockQuery:
                    def select(self, *args):
                        return self
                    def eq(self, *args):
                        return self
                    def execute(self):
                        class MockResult:
                            data = []
                        return MockResult()
                return MockQuery()

        class MockMarketService:
            def get_apmc_rates(self, district, crop=None):
                from app.services.market_service import APMCRate
                return [APMCRate(district=district, crop_type=crop or "Tomato",
                               min_price=20, max_price=30, modal_price=25,
                               date="2024-01-01", market_name="Test Market")]

            def get_crop_arrivals(self, district, crop):
                return {"arrivals_7d": 100, "arrivals_30d": 500,
                       "avg_daily_arrival": 15, "markets_reporting": 3}

            def get_district_trends(self, district):
                from app.services.market_service import MarketTrend
                return [MarketTrend(crop_type="Tomato", district=district,
                                  avg_price_7d=25, avg_price_30d=24,
                                  price_change_7d=2, price_change_30d=5,
                                  arrival_volume_7d=100, trend="rising")]

        from app.services.chatbot_service import ChatbotService
        return ChatbotService(MockSupabase(), MockMarketService())

    @pytest.mark.asyncio
    async def test_price_query(self, chatbot_service):
        from app.services.chatbot_service import ChatQuery
        query = ChatQuery(query="Tomato price in Bangalore", user_id="u1", user_role="farmer")
        result = await chatbot_service.process_query(query)
        assert "Tomato" in result.answer
        assert "Bangalore" in result.answer

    @pytest.mark.asyncio
    async def test_arrival_query(self, chatbot_service):
        from app.services.chatbot_service import ChatQuery
        query = ChatQuery(query="Onion arrivals in Mysore", user_id="u1", user_role="buyer")
        result = await chatbot_service.process_query(query)
        assert "Onion" in result.answer
        assert "Mysore" in result.answer

    @pytest.mark.asyncio
    async def test_general_query_farmer(self, chatbot_service):
        from app.services.chatbot_service import ChatQuery
        query = ChatQuery(query="Hello", user_id="u1", user_role="farmer")
        result = await chatbot_service.process_query(query)
        assert "listing" in result.answer.lower() or "grade" in result.answer.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])