from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.db.models import UtilitiesAsset, MetricTimeSeries, MaintenanceTicket, District
from app.ml.anomaly_detector import CityAnomalyDetector
from app.ml.forecaster import DemandForecaster

router = APIRouter(prefix="/utilities", tags=["Utilities"])

class TicketCreateRequest(BaseModel):
    asset_id: int
    district_id: int
    title: str
    description: str
    priority: str = "High"

@router.get("/status")
def get_utilities_status(district_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(UtilitiesAsset)
    if district_id:
        query = query.filter(UtilitiesAsset.district_id == district_id)
        
    assets = query.all()
    result = []
    for a in assets:
        d = db.get(District, a.district_id)
        result.append({
            "id": a.id,
            "district_id": a.district_id,
            "district_name": d.name if d else f"District {a.district_id}",
            "name": a.name,
            "asset_type": a.asset_type,
            "status": a.status,
            "electricity_mw": a.electricity_mw,
            "water_pressure_psi": a.water_pressure_psi,
            "water_flow_gpm": a.water_flow_gpm,
            "gas_pressure_bar": a.gas_pressure_bar,
            "waste_fill_pct": a.waste_fill_pct,
            "last_updated": a.last_updated.isoformat()
        })
    return result

@router.get("/forecast")
def get_utilities_forecast(metric: str = "electricity_mw", district_id: int = 1, hours: int = 24, db: Session = Depends(get_db)):
    # Fetch historical readings from DB
    records = db.query(MetricTimeSeries).filter(
        MetricTimeSeries.district_id == district_id,
        MetricTimeSeries.metric_name == metric
    ).order_by(MetricTimeSeries.timestamp.asc()).all()
    
    timestamps = [r.timestamp.isoformat() for r in records]
    values = [r.value for r in records]
    
    forecast_result = DemandForecaster.forecast_24h_demand(timestamps, values, hours_ahead=hours)
    
    # Generate future hourly timestamp labels
    last_ts = records[-1].timestamp if records else datetime.now(timezone.utc)
    future_timestamps = [(last_ts + timedelta(hours=i+1)).strftime("%H:00") for i in range(hours)]
    
    return {
        "metric_name": metric,
        "district_id": district_id,
        "historical_count": len(values),
        "timestamps": future_timestamps,
        "forecast": forecast_result["forecast"],
        "lower_bound": forecast_result["lower_bound"],
        "upper_bound": forecast_result["upper_bound"],
        "method": forecast_result["method"],
        "mean_baseline": forecast_result["metrics_mean"]
    }

@router.get("/anomalies")
def get_utilities_anomalies(district_id: int = 1, db: Session = Depends(get_db)):
    records = db.query(MetricTimeSeries).filter(
        MetricTimeSeries.district_id == district_id,
        MetricTimeSeries.domain == "utilities"
    ).order_by(MetricTimeSeries.timestamp.desc()).limit(100).all()
    
    values = [r.value for r in reversed(records)]
    anomalies = CityAnomalyDetector.detect_zscore_anomalies(values, threshold=2.2)
    return anomalies

@router.post("/tickets/create")
def create_maintenance_ticket(req: TicketCreateRequest, db: Session = Depends(get_db)):
    code = f"TCK-UTL-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    ticket = MaintenanceTicket(
        ticket_code=code,
        asset_type="utilities",
        asset_id=req.asset_id,
        district_id=req.district_id,
        priority=req.priority,
        title=req.title,
        description=req.description,
        status="Pending"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {"message": "Maintenance ticket created successfully", "ticket_code": code, "id": ticket.id}
