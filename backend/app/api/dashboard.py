from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.db.models import (
    District, Alert, ServiceRequest311, UtilitiesAsset, TrafficCorridor, InfrastructureAsset, EmergencyUnit, MetricTimeSeries, MaintenanceTicket
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    districts = db.query(District).all()
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).order_by(Alert.created_at.desc()).all()
    open_311 = db.query(ServiceRequest311).filter(ServiceRequest311.status.in_(["Open", "In Progress"])).count()
    total_population = sum(d.population for d in districts)
    
    # Calculate City Health Score
    critical_alerts = sum(1 for a in active_alerts if a.severity == "Critical")
    warning_alerts = sum(1 for a in active_alerts if a.severity == "Warning")
    city_health_pct = max(60.0, 100.0 - (critical_alerts * 8.0) - (warning_alerts * 3.0))
    
    # Utilities Aggregate
    u_assets = db.query(UtilitiesAsset).all()
    total_mw = sum(u.electricity_mw for u in u_assets)
    avg_psi = sum(u.water_pressure_psi for u in u_assets) / len(u_assets) if u_assets else 60.0
    
    # Traffic Aggregate
    t_corrs = db.query(TrafficCorridor).all()
    avg_congestion = sum(c.congestion_index for c in t_corrs) / len(t_corrs) if t_corrs else 25.0
    
    # Infrastructure Aggregate
    infra_assets = db.query(InfrastructureAsset).all()
    high_risk_count = sum(1 for i in infra_assets if i.risk_level in ["High", "Critical"])
    
    # Emergency Response Avg
    e_units = db.query(EmergencyUnit).all()
    avg_response = sum(e.avg_response_time_min for e in e_units) / len(e_units) if e_units else 4.5
    
    # District Status Map
    district_statuses = []
    for d in districts:
        d_alerts = [a for a in active_alerts if a.district_id == d.id]
        if any(a.severity == "Critical" for a in d_alerts):
            status = "Critical"
        elif any(a.severity == "Warning" for a in d_alerts):
            status = "Warning"
        else:
            status = "Normal"
            
        district_statuses.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "population": d.population,
            "lat": d.lat,
            "lng": d.lng,
            "bounds": d.bounds_json,
            "status": status,
            "active_alert_count": len(d_alerts)
        })
        
    return {
        "city_health_pct": round(city_health_pct, 1),
        "total_population": total_population,
        "active_alerts_count": len(active_alerts),
        "critical_alerts_count": critical_alerts,
        "open_311_requests": open_311,
        "total_power_mw": round(total_mw, 1),
        "avg_water_psi": round(avg_psi, 1),
        "avg_traffic_congestion_pct": round(avg_congestion, 1),
        "high_risk_infra_count": high_risk_count,
        "avg_emergency_response_min": round(avg_response, 1),
        "districts": district_statuses,
        "recent_alerts": [
            {
                "id": a.id,
                "code": a.alert_code,
                "domain": a.domain,
                "district_id": a.district_id,
                "severity": a.severity,
                "title": a.title,
                "description": a.description,
                "root_cause_hint": a.root_cause_hint,
                "created_at": a.created_at.isoformat()
            } for a in active_alerts[:10]
        ]
    }

@router.get("/alerts")
def get_alerts_feed(domain: Optional[str] = None, severity: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert).filter(Alert.is_resolved == False)
    if domain:
        query = query.filter(Alert.domain == domain)
    if severity:
        query = query.filter(Alert.severity == severity)
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "code": a.alert_code,
            "domain": a.domain,
            "district_id": a.district_id,
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "root_cause_hint": a.root_cause_hint,
            "created_at": a.created_at.isoformat()
        } for a in alerts
    ]

@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"Alert {alert.alert_code} resolved successfully", "alert_id": alert_id}

class PlaybookExecuteReq(BaseModel):
    action: str  # "dispatch_emergency" | "create_ticket" | "traffic_reroute" | "broadcast_advisory"
    unit_id: Optional[int] = None
    notes: Optional[str] = None
    priority: Optional[str] = "High"
    auto_resolve: Optional[bool] = False

@router.post("/alerts/{alert_id}/playbook")
def execute_alert_playbook(
    alert_id: int,
    req: PlaybookExecuteReq,
    db: Session = Depends(get_db)
):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    execution_result = {
        "alert_id": alert.id,
        "alert_code": alert.alert_code,
        "action": req.action,
        "success": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if req.action == "dispatch_emergency":
        unit = None
        if req.unit_id:
            unit = db.get(EmergencyUnit, req.unit_id)
        if not unit:
            # Pick first available emergency unit in district or adjacent
            unit = db.query(EmergencyUnit).filter(
                EmergencyUnit.district_id == alert.district_id,
                EmergencyUnit.status == "Available"
            ).first()
        if not unit:
            unit = db.query(EmergencyUnit).filter(EmergencyUnit.status == "Available").first()
            
        if unit:
            unit.status = "Dispatched"
            unit.active_incidents_count = (unit.active_incidents_count or 0) + 1
            unit.last_updated = datetime.now(timezone.utc)
            execution_result["unit_code"] = unit.unit_code
            execution_result["unit_type"] = unit.unit_type
            execution_result["eta_minutes"] = round(unit.avg_response_time_min, 1)
            execution_result["message"] = f"Unit {unit.unit_code} ({unit.unit_type}) dispatched with ETA {round(unit.avg_response_time_min, 1)}m"
        else:
            execution_result["message"] = "All emergency units currently engaged; queued for nearest available unit"
            
    elif req.action == "create_ticket":
        tck_code = f"TCK-{alert.domain[:3].upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        ticket = MaintenanceTicket(
            ticket_code=tck_code,
            asset_type=alert.domain,
            asset_id=1,
            district_id=alert.district_id,
            priority=req.priority or "High",
            title=f"[Incident Playbook] {alert.title}",
            description=f"Automated playbook work order generated for alert {alert.alert_code}: {alert.description}. Notes: {req.notes or 'None'}",
            status="Approved"
        )
        db.add(ticket)
        execution_result["ticket_code"] = tck_code
        execution_result["message"] = f"Priority maintenance work order {tck_code} issued and approved for municipal repair crews"
        
    elif req.action == "traffic_reroute":
        corridor = db.query(TrafficCorridor).filter(TrafficCorridor.district_id == alert.district_id).first()
        if corridor:
            corridor.congestion_index = max(10.0, corridor.congestion_index - 30.0)
            corridor.speed_mph = min(50.0, corridor.speed_mph + 12.0)
            corridor.incident_active = False
            execution_result["corridor_name"] = corridor.name
            execution_result["message"] = f"Dynamic traffic signal adjustment and detour broadcast active on {corridor.name}"
        else:
            execution_result["message"] = "Traffic signal timing adjusted across district arterial intersections"
            
    elif req.action == "broadcast_advisory":
        execution_result["message"] = f"Public advisory broadcasted across 311 SMS/mobile channels for {alert.title}"
        
    if req.auto_resolve:
        alert.is_resolved = True
        alert.resolved_at = datetime.now(timezone.utc)
        execution_result["alert_resolved"] = True
        
    db.commit()
    return execution_result

