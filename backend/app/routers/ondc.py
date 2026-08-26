# AgriMart Backend - ONDC Protocol REST Endpoints
# Open Network for Digital Commerce (ONDC) specification adapter
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import os
from supabase import create_client

router = APIRouter(prefix="/ondc", tags=["ONDC Protocol Adapter"])

def get_supabase():
    try:
        from app.main import supabase as global_supabase
        if global_supabase:
            return global_supabase
    except ImportError:
        pass

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if url and key and not url.startswith("https://your-project") and not key.startswith("your-service"):
        try:
            return create_client(url, key)
        except Exception:
            return None
    return None

class ONDCSearchRequest(BaseModel):
    crop_type: Optional[str] = None
    district: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

@router.post("/search")
async def ondc_search(req: ONDCSearchRequest):
    """
    ONDC Protocol: /search (Catalog Discovery)
    Returns ONDC-compliant item catalog listings.
    """
    supabase = get_supabase()
    catalog_items = []

    if supabase:
        try:
            query = supabase.table("produce_listings").select("*, farmers(full_name, district, trust_score)").eq("is_active", True)
            
            if req.crop_type:
                query = query.eq("crop_type", req.crop_type)
            if req.district:
                query = query.eq("district", req.district)
            
            res = query.execute()
            
            for item in (res.data or []):
                catalog_items.append({
                    "id": item["id"],
                    "descriptor": {
                        "name": item["crop_type"],
                        "code": f"CROP-{item['crop_type'].upper()}",
                        "grade": item.get("ai_grade", "A")
                    },
                    "price": {
                        "currency": "INR",
                        "value": str(item["price"])
                    },
                    "quantity": {
                        "available": item["qty_avail"],
                        "unit": "kg"
                    },
                    "provider": {
                        "id": item["farmer_id"],
                        "descriptor": {
                            "name": item.get("farmers", {}).get("full_name", "Verified Kisan") if item.get("farmers") else "Verified Kisan"
                        },
                        "location": item.get("district", "Karnataka")
                    },
                    "ondc_features": {
                        "group_buying_supported": item.get("pooling_enabled", False),
                        "escrow_protected": True
                    }
                })
        except Exception as e:
            print("ONDC Supabase search error:", e)

    # Fallback catalog item for dev/demo if database empty or unavailable
    if not catalog_items:
        catalog_items.append({
            "id": "demo-item-1",
            "descriptor": {
                "name": req.crop_type or "Tomato",
                "code": f"CROP-{(req.crop_type or 'TOMATO').upper()}",
                "grade": "A"
            },
            "price": {
                "currency": "INR",
                "value": "28"
            },
            "quantity": {
                "available": 500,
                "unit": "kg"
            },
            "provider": {
                "id": "demo-farmer-1",
                "descriptor": {
                    "name": "Kolar Direct Farmer"
                },
                "location": req.district or "Bangalore Urban"
            },
            "ondc_features": {
                "group_buying_supported": True,
                "escrow_protected": True
            }
        })
    
    return {
        "context": {
            "domain": "nic2004:52110",
            "action": "on_search",
            "version": "1.2.0",
            "bap_id": "agrimart.ondc.in",
            "bpp_id": "agrimart.provider.in"
        },
        "message": {
            "catalog": {
                "bpp/providers": catalog_items
            }
        }
    }

@router.get("/status/{order_id}")
async def ondc_status(order_id: str):
    """
    ONDC Protocol: /status (Track Order & Escrow Status)
    """
    supabase = get_supabase()
    order_data = None

    if supabase:
        try:
            res = supabase.table("orders").select("*, produce_listings(crop_type, price), transports(*)").eq("id", order_id).execute()
            if res.data:
                order_data = res.data[0]
        except Exception as e:
            print("ONDC Supabase status error:", e)

    if not order_data:
        # Mock ONDC order response for dev/demo
        order_data = {
            "id": order_id,
            "status": "Accepted",
            "transports": {"carrier": "AgriMart Logistics", "tracking_number": "TRK-98765"},
            "created_at": "2026-08-26"
        }
    
    return {
        "context": {
            "action": "on_status",
            "version": "1.2.0"
        },
        "message": {
            "order": {
                "id": order_data["id"],
                "state": order_data.get("status", "Accepted"),
                "fulfillment": {
                    "tracking": True,
                    "transport_details": order_data.get("transports")
                },
                "payment": {
                    "type": "ONDC_ESCROW",
                    "status": "PAID" if order_data.get("status") in ["Accepted", "Dispatched", "Completed"] else "UNPAID"
                }
            }
        }
    }
