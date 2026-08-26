# Test suite for FastAPI endpoints
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_voice_parse_listing():
    response = client.post("/voice/parse-listing", json={
        "text": "I have 500 kg tomato at 25 rupees per kg in Bangalore",
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["crop_type"] == "Tomato"
    assert data["qty_avail"] == 500.0
    assert data["price"] == 25.0
    assert data["district"] == "Bangalore Urban"

def test_vision_supported_crops():
    response = client.get("/vision/supported-crops")
    assert response.status_code == 200
    assert "grading_crops" in response.json()

def test_fraud_risk_levels():
    response = client.get("/fraud/risk-levels")
    assert response.status_code == 200
    assert "levels" in response.json()

def test_market_apmc_rates():
    response = client.get("/market/apmc-rates?district=Bangalore%20Urban")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_chatbot_demand_forecast():
    response = client.post("/chatbot/demand-forecast", json={
        "query": "Tomato price in Bangalore",
        "user_id": "test-user",
        "user_role": "buyer"
    })
    assert response.status_code == 200
    assert "answer" in response.json()

def test_ondc_search():
    response = client.post("/api/v1/ondc/search", json={
        "crop_type": "Tomato",
        "district": "Bangalore Urban"
    })
    assert response.status_code == 200
    assert "message" in response.json()
