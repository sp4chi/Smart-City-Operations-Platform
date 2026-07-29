from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from app.core.database import get_db
from app.db.models import InfrastructureAsset, MaintenanceTicket, District
from app.ml.predictive_maint import PredictiveMaintenanceEngine

router = APIRouter(prefix="/infrastructure", tags=["Infrastructure"])

class ScheduleMaintenanceRequest(BaseModel):
    asset_id: int
    title: str
    priority: str = "High"
    estimated_cost: float = 2500.0

@router.get("/assets")
def get_infrastructure_assets(risk_level: Optional[str] = None, asset_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(InfrastructureAsset)
    if risk_level:
        query = query.filter(InfrastructureAsset.risk_level == risk_level)
    if asset_type:
        query = query.filter(InfrastructureAsset.asset_type == asset_type)
        
    assets = query.order_by(InfrastructureAsset.condition_score.asc()).all()
    result = []
    for a in assets:
        d = db.get(District, a.district_id)
        
        # Calculate ML Risk Evaluation
        ml_eval = PredictiveMaintenanceEngine.calculate_failure_risk(
            condition_score=a.condition_score,
            age_years=12.5,
            last_inspection_days_ago=45,
            asset_type=a.asset_type
        )
        
        result.append({
            "id": a.id,
            "district_id": a.district_id,
            "district_name": d.name if d else f"District {a.district_id}",
            "name": a.name,
            "asset_type": a.asset_type,
            "location_description": a.location_description,
            "lat": a.lat,
            "lng": a.lng,
            "condition_score": a.condition_score,
            "risk_level": a.risk_level,
            "estimated_days_to_failure": a.estimated_days_to_failure,
            "maintenance_status": a.maintenance_status,
            "last_inspection_date": a.last_inspection_date.isoformat(),
            "ml_risk_eval": ml_eval
        })
    return result

@router.post("/maintenance/schedule")
def schedule_maintenance(req: ScheduleMaintenanceRequest, db: Session = Depends(get_db)):
    asset = db.query(InfrastructureAsset).get(req.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Infrastructure asset not found")
        
    code = f"TCK-INF-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    ticket = MaintenanceTicket(
        ticket_code=code,
        asset_type="infrastructure",
        asset_id=asset.id,
        district_id=asset.district_id,
        priority=req.priority,
        title=req.title,
        description=f"Preventative maintenance scheduled for asset {asset.name} (Condition: {asset.condition_score:.1f}).",
        estimated_cost=req.estimated_cost,
        status="Scheduled"
    )
    asset.maintenance_status = "Scheduled"
    db.add(ticket)
    db.commit()
    return {"message": "Maintenance ticket scheduled successfully", "ticket_code": code}
