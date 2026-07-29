from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.db.models import TrafficCorridor, PublicTransitVehicle, District

router = APIRouter(prefix="/transportation", tags=["Transportation"])

@router.get("/corridors")
def get_traffic_corridors(district_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(TrafficCorridor)
    if district_id:
        query = query.filter(TrafficCorridor.district_id == district_id)
        
    corridors = query.all()
    result = []
    for c in corridors:
        d = db.get(District, c.district_id)
        result.append({
            "id": c.id,
            "district_id": c.district_id,
            "district_name": d.name if d else f"District {c.district_id}",
            "name": c.name,
            "start_location": c.start_location,
            "end_location": c.end_location,
            "speed_mph": c.speed_mph,
            "flow_veh_hr": c.flow_veh_hr,
            "congestion_index": c.congestion_index,
            "incident_active": c.incident_active,
            "last_updated": c.last_updated.isoformat()
        })
    return result

@router.get("/transit")
def get_transit_vehicles(district_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(PublicTransitVehicle)
    if district_id:
        query = query.filter(PublicTransitVehicle.district_id == district_id)
        
    vehicles = query.all()
    result = []
    for v in vehicles:
        d = db.get(District, v.district_id)
        result.append({
            "id": v.id,
            "district_id": v.district_id,
            "district_name": d.name if d else f"District {v.district_id}",
            "route_name": v.route_name,
            "vehicle_type": v.vehicle_type,
            "vehicle_code": v.vehicle_code,
            "delay_minutes": v.delay_minutes,
            "ridership_count": v.ridership_count,
            "health_score": v.health_score,
            "status": v.status,
            "last_updated": v.last_updated.isoformat()
        })
    return result

@router.get("/parking")
def get_parking_occupancy(db: Session = Depends(get_db)):
    districts = db.query(District).all()
    garages = []
    for d in districts:
        occupancy = min(98.0, 35.0 + (d.id * 12.0) + (d.id * 3.5))
        garages.append({
            "garage_id": f"GAR-{d.code}",
            "name": f"{d.name} Municipal Garage",
            "district_id": d.id,
            "district_name": d.name,
            "total_capacity": 450 + (d.id * 100),
            "occupied_spots": int((450 + (d.id * 100)) * (occupancy / 100.0)),
            "occupancy_pct": round(occupancy, 1),
            "status": "Full" if occupancy > 90 else "Available"
        })
    return garages
