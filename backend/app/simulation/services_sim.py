import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.simulation.generator_base import BaseSensorGenerator

CATEGORIES_311 = [
    ("Pothole Repair", "Infrastructure", 72),
    ("Streetlight Outage", "Utilities", 24),
    ("Water Leak", "Utilities", 12),
    ("Illegal Waste Dumping", "Public Services", 48),
    ("Noise Complaint", "Public Safety", 8),
    ("Traffic Signal Malfunction", "Transportation", 6)
]

class PublicServicesSimulator(BaseSensorGenerator):
    
    @classmethod
    def generate_311_request(cls, district_id: int, lat: float, lng: float, request_count: int) -> Dict[str, Any]:
        cat, domain, sla_hours = random.choice(CATEGORIES_311)
        req_num = f"REQ-311-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        
        offset_lat = lat + random.uniform(-0.02, 0.02)
        offset_lng = lng + random.uniform(-0.02, 0.02)
        
        priority = random.choice(["Low", "Medium", "Medium", "High"])
        if sla_hours <= 12:
            priority = "High" if random.random() > 0.3 else "Urgent"
            
        return {
            "request_number": req_num,
            "title": f"Citizen Report: {cat} near District #{district_id}",
            "category": cat,
            "description": f"Citizen report submitted via 311 app requiring field crew dispatch for {cat}.",
            "district_id": district_id,
            "lat": round(offset_lat, 5),
            "lng": round(offset_lng, 5),
            "priority": priority,
            "status": "Open",
            "sla_hours": sla_hours
        }

    @classmethod
    def generate_emergency_unit_metrics(cls, unit_type: str, dt: datetime) -> Dict[str, Any]:
        diurnal = cls.get_diurnal_factor(dt)
        base_resp = {"Police": 5.5, "Fire": 4.8, "EMS": 4.2}.get(unit_type, 5.0)
        
        response_time = base_resp + (diurnal * 1.5) + random.uniform(-0.5, 0.8)
        status = random.choice(["Available", "Available", "Dispatched", "On Scene"])
        active_count = random.randint(1, 4) if status != "Available" else 0
        
        return {
            "status": status,
            "avg_response_time_min": round(max(2.0, response_time), 1),
            "active_incidents_count": active_count
        }
