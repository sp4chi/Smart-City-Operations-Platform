from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from app.core.database import get_db
from app.db.models import ServiceRequest311, EmergencyUnit, District, User
from app.simulation.services_sim import CATEGORIES_311
from app.api.auth import require_roles

router = APIRouter(prefix="/public-services", tags=["Public Services"])

class ServiceRequestCreate(BaseModel):
    title: str
    category: str
    description: str
    district_id: int
    lat: float
    lng: float
    priority: str = "Medium"

@router.get("/311/requests")
def get_311_requests(status: Optional[str] = None, district_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ServiceRequest311)
    if status:
        query = query.filter(ServiceRequest311.status == status)
    if district_id:
        query = query.filter(ServiceRequest311.district_id == district_id)
        
    requests = query.order_by(ServiceRequest311.created_at.desc()).all()
    result = []
    for r in requests:
        d = db.get(District, r.district_id)
        result.append({
            "id": r.id,
            "request_number": r.request_number,
            "title": r.title,
            "category": r.category,
            "description": r.description,
            "district_id": r.district_id,
            "district_name": d.name if d else f"District {r.district_id}",
            "lat": r.lat,
            "lng": r.lng,
            "priority": r.priority,
            "status": r.status,
            "sla_hours": r.sla_hours,
            "created_at": r.created_at.isoformat()
        })
    return result

@router.post("/311/create")
def create_311_request(
    req: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "operator"]))
):
    req_num = f"REQ-311-{datetime.now().strftime('%Y%m%d')}-{db.query(ServiceRequest311).count() + 101}"
    sla = 48
    for cat, domain, h in CATEGORIES_311:
        if cat == req.category:
            sla = h
            break
            
    s_req = ServiceRequest311(
        request_number=req_num,
        title=req.title,
        category=req.category,
        description=req.description,
        district_id=req.district_id,
        lat=req.lat,
        lng=req.lng,
        priority=req.priority,
        status="Open",
        sla_hours=sla,
        created_at=datetime.now(timezone.utc)
    )
    db.add(s_req)
    db.commit()
    db.refresh(s_req)
    return {"message": "311 Service Request created successfully", "request_number": req_num, "id": s_req.id}

@router.get("/emergency/units")
def get_emergency_units(district_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(EmergencyUnit)
    if district_id:
        query = query.filter(EmergencyUnit.district_id == district_id)
        
    units = query.all()
    result = []
    for u in units:
        d = db.get(District, u.district_id)
        lat_offset = ((u.id * 7) % 11 - 5) * 0.0025
        lng_offset = ((u.id * 13) % 11 - 5) * 0.0025
        lat = round(d.lat + lat_offset, 5) if d else 30.2672
        lng = round(d.lng + lng_offset, 5) if d else -97.7431
        result.append({
            "id": u.id,
            "district_id": u.district_id,
            "district_name": d.name if d else f"District {u.district_id}",
            "unit_code": u.unit_code,
            "unit_type": u.unit_type,
            "status": u.status,
            "avg_response_time_min": u.avg_response_time_min,
            "active_incidents_count": u.active_incidents_count,
            "lat": lat,
            "lng": lng,
            "last_updated": u.last_updated.isoformat()
        })
    return result

class EmergencyDispatchReq(BaseModel):
    incident_title: Optional[str] = "High Priority Municipal Incident"
    district_id: Optional[int] = None
    notes: Optional[str] = None

@router.post("/emergency/{unit_id}/dispatch")
def dispatch_emergency_unit(
    unit_id: int,
    req: Optional[EmergencyDispatchReq] = None,
    db: Session = Depends(get_db)
):
    unit = db.get(EmergencyUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Emergency unit not found")
    unit.status = "Dispatched"
    unit.active_incidents_count = (unit.active_incidents_count or 0) + 1
    unit.last_updated = datetime.now(timezone.utc)
    if req and req.district_id:
        unit.district_id = req.district_id
    db.commit()
    db.refresh(unit)
    d = db.get(District, unit.district_id)
    return {
        "message": f"Unit {unit.unit_code} ({unit.unit_type}) dispatched successfully",
        "unit_id": unit.id,
        "unit_code": unit.unit_code,
        "unit_type": unit.unit_type,
        "status": unit.status,
        "district_name": d.name if d else f"District {unit.district_id}",
        "active_incidents_count": unit.active_incidents_count,
        "eta_minutes": round(unit.avg_response_time_min, 1)
    }

@router.post("/emergency/{unit_id}/recall")
def recall_emergency_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.get(EmergencyUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Emergency unit not found")
    unit.status = "Available"
    unit.active_incidents_count = max(0, (unit.active_incidents_count or 1) - 1)
    unit.last_updated = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"Unit {unit.unit_code} marked as Available", "status": "Available"}

