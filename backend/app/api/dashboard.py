from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.db.models import (
    District, Alert, ServiceRequest311, UtilitiesAsset, TrafficCorridor, InfrastructureAsset, EmergencyUnit, MetricTimeSeries
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
