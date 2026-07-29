import math
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.db.models import (
    User, District, MetricTimeSeries, UtilitiesAsset, TrafficCorridor,
    PublicTransitVehicle, ServiceRequest311, EmergencyUnit, InfrastructureAsset,
    Alert, MaintenanceTicket
)
from app.simulation.utilities_sim import UtilitiesSimulator
from app.simulation.transport_sim import TransportSimulator
from app.simulation.services_sim import PublicServicesSimulator

DISTRICT_DATA = [
    {
        "code": "D-01",
        "name": "Downtown Central",
        "population": 125000,
        "lat": 30.2672,
        "lng": -97.7431,
        "area_sq_km": 15.4,
        "bounds": [
            [30.275, -97.750], [30.275, -97.730], [30.255, -97.730], [30.255, -97.750]
        ]
    },
    {
        "code": "D-02",
        "name": "Northside Tech Corridor",
        "population": 110000,
        "lat": 30.3800,
        "lng": -97.7300,
        "area_sq_km": 28.6,
        "bounds": [
            [30.395, -97.745], [30.395, -97.715], [30.365, -97.715], [30.365, -97.745]
        ]
    },
    {
        "code": "D-03",
        "name": "East Riverfront",
        "population": 85000,
        "lat": 30.2500,
        "lng": -97.7100,
        "area_sq_km": 22.1,
        "bounds": [
            [30.265, -97.725], [30.265, -97.695], [30.235, -97.695], [30.235, -97.725]
        ]
    },
    {
        "code": "D-04",
        "name": "West Heights",
        "population": 72000,
        "lat": 30.2800,
        "lng": -97.8000,
        "area_sq_km": 34.2,
        "bounds": [
            [30.295, -97.815], [30.295, -97.785], [30.265, -97.785], [30.265, -97.815]
        ]
    },
    {
        "code": "D-05",
        "name": "South Suburbs",
        "population": 108000,
        "lat": 30.2100,
        "lng": -97.7600,
        "area_sq_km": 31.0,
        "bounds": [
            [30.225, -97.775], [30.225, -97.745], [30.195, -97.745], [30.195, -97.775]
        ]
    }
]

INFRASTRUCTURE_CATALOG = [
    ("Congress Ave Bridge", "bridge", "Downtown Central Main River Crossing", 30.263, -97.744, 52.0, "High", 1),
    ("I-35 Elevated Highway Corridor", "road", "Northside Expressway Link", 30.370, -97.728, 41.5, "Critical", 2),
    ("East Side Pumping Station & Reservoir", "building", "Riverfront Water Treatment Plant", 30.252, -97.705, 88.0, "Low", 3),
    ("Lamar Blvd Pavement Segment 4", "road", "West Heights Commercial Corridor", 30.282, -97.795, 78.0, "Medium", 4),
    ("Smart LED Streetlight Grid Zone A", "streetlight", "Downtown Central Night Vision Grid", 30.269, -97.741, 94.0, "Low", 1),
    ("South Loop Overpass Pass-Through", "bridge", "South Suburbs Highway Junction", 30.212, -97.758, 63.0, "Medium", 5)
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    # 1. Ensure Default Users Always Exist
    admin_user = db.query(User).filter(User.email == "admin@citypulse.gov").first()
    if not admin_user:
        print("[SEED] Seeding default users...")
        users = [
            User(email="admin@citypulse.gov", full_name="City Administrator", hashed_password=get_password_hash("admin123"), role="admin"),
            User(email="operator@citypulse.gov", full_name="Ops Lead Specialist", hashed_password=get_password_hash("operator123"), role="operator"),
            User(email="viewer@citypulse.gov", full_name="Public View Inspector", hashed_password=get_password_hash("viewer123"), role="viewer"),
        ]
        db.add_all(users)
        db.commit()
    else:
        # Update admin password hash to ensure test environment match
        admin_user.hashed_password = get_password_hash("admin123")
        op_user = db.query(User).filter(User.email == "operator@citypulse.gov").first()
        if op_user:
            op_user.hashed_password = get_password_hash("operator123")
        vw_user = db.query(User).filter(User.email == "viewer@citypulse.gov").first()
        if vw_user:
            vw_user.hashed_password = get_password_hash("viewer123")
        db.commit()

    # Check if remaining domain data already seeded
    if db.query(District).first() is not None:
        print("[SEED] Database already populated. Skipping initial seed.")
        db.close()
        return

    print("[SEED] Starting initial database seeding (30 days historical data)...")
    
    # 2. Create Districts
    districts = []
    for d in DISTRICT_DATA:
        dist = District(
            code=d["code"],
            name=d["name"],
            population=d["population"],
            lat=d["lat"],
            lng=d["lng"],
            area_sq_km=d["area_sq_km"],
            bounds_json=d["bounds"]
        )
        db.add(dist)
        districts.append(dist)
    db.commit()
    
    # Refresh district IDs
    district_map = {d.code: d.id for d in db.query(District).all()}
    
    # 3. Utilities Assets
    for dist in districts:
        u_asset = UtilitiesAsset(
            district_id=dist.id,
            name=f"{dist.name} Regional Utility Hub",
            asset_type="power_grid",
            status="Normal",
            electricity_mw=145.0,
            water_pressure_psi=62.5,
            water_flow_gpm=3800.0,
            gas_pressure_bar=4.15,
            waste_fill_pct=45.0
        )
        db.add(u_asset)
        
    # 4. Traffic Corridors & Transit
    for dist in districts:
        corr = TrafficCorridor(
            district_id=dist.id,
            name=f"{dist.name} Express Arterial",
            start_location=f"North {dist.code}",
            end_location=f"South {dist.code}",
            speed_mph=38.5,
            flow_veh_hr=1350,
            congestion_index=28.0
        )
        db.add(corr)
        
        bus = PublicTransitVehicle(
            district_id=dist.id,
            route_name=f"Metro Route {dist.id * 10 + 4}",
            vehicle_type="bus",
            vehicle_code=f"BUS-{dist.id}09",
            delay_minutes=1.5,
            ridership_count=42,
            health_score=94.0,
            status="On Time"
        )
        db.add(bus)
        
    # 5. Infrastructure Assets (Deduplicated)
    for item in INFRASTRUCTURE_CATALOG:
        name, a_type, loc, lat, lng, score, risk, target_dist_id = item
        if db.query(InfrastructureAsset).filter(InfrastructureAsset.name == name).first() is None:
            days_to_fail = int((score - 30.0) * 8.5)
            asset = InfrastructureAsset(
                district_id=target_dist_id,
                name=name,
                asset_type=a_type,
                location_description=loc,
                lat=lat,
                lng=lng,
                condition_score=score,
                risk_level=risk,
                estimated_days_to_failure=days_to_fail,
                maintenance_status="Operational" if risk != "Critical" else "Scheduled"
            )
            db.add(asset)
        
    # 6. Emergency Units
    for dist in districts:
        for u_type in ["Police", "Fire", "EMS"]:
            unit = EmergencyUnit(
                district_id=dist.id,
                unit_code=f"{u_type.upper()[:3]}-UNIT-{dist.id}1",
                unit_type=u_type,
                status="Available",
                avg_response_time_min=4.2 if u_type == "EMS" else 5.1
            )
            db.add(unit)
            
    # 7. Seed Active 311 Requests
    now = datetime.now(timezone.utc)
    for i in range(12):
        dist = districts[i % len(districts)]
        req = PublicServicesSimulator.generate_311_request(dist.id, dist.lat, dist.lng, i)
        s_req = ServiceRequest311(
            request_number=req["request_number"],
            title=req["title"],
            category=req["category"],
            description=req["description"],
            district_id=req["district_id"],
            lat=req["lat"],
            lng=req["lng"],
            priority=req["priority"],
            status="Open" if i < 8 else "In Progress",
            sla_hours=req["sla_hours"],
            created_at=now - timedelta(hours=random.randint(1, 36))
        )
        db.add(s_req)
        
    # 8. Seed Initial Alerts
    alert_1 = Alert(
        alert_code="ALT-2026-001",
        domain="utilities",
        district_id=districts[2].id, # East Riverfront
        severity="Critical",
        title="Severe Water Main Pressure Drop",
        description="Main distribution pipeline in East Riverfront registered a 55% pressure drop (28.2 PSI) with an abnormal flow surge.",
        root_cause_hint="Possible underground main pipe fracture near Riverfront Substation."
    )
    alert_2 = Alert(
        alert_code="ALT-2026-002",
        domain="transportation",
        district_id=districts[1].id, # Northside Tech Corridor
        severity="Warning",
        title="I-35 Expressway Bottleneck",
        description="Severe traffic congestion index reached 88% due to lane disruption.",
        root_cause_hint="Single vehicle stalled at Exit 234."
    )
    db.add_all([alert_1, alert_2])
    
    # 9. Seed 30 Days of Historical Time Series Metrics
    print("[SEED] Generating 30 days of hourly time-series metrics...")
    start_time = now - timedelta(days=30)
    
    metrics_batch = []
    current_step = start_time
    
    while current_step <= now:
        for dist in districts:
            # Utilities metrics
            util_data = UtilitiesSimulator.generate_district_utilities(dist.id, current_step)
            metrics_batch.append(MetricTimeSeries(
                timestamp=current_step,
                district_id=dist.id,
                domain="utilities",
                metric_name="electricity_mw",
                value=util_data["electricity_mw"],
                unit="MW",
                is_anomaly=util_data["is_anomaly"],
                anomaly_score=util_data["anomaly_score"],
                anomaly_reason=util_data["anomaly_reason"]
            ))
            metrics_batch.append(MetricTimeSeries(
                timestamp=current_step,
                district_id=dist.id,
                domain="utilities",
                metric_name="water_pressure_psi",
                value=util_data["water_pressure_psi"],
                unit="PSI",
                is_anomaly=util_data["is_anomaly"],
                anomaly_score=util_data["anomaly_score"],
                anomaly_reason=util_data["anomaly_reason"]
            ))
            
            # Transport metrics
            trans_data = TransportSimulator.generate_corridor_metrics(dist.id, current_step)
            metrics_batch.append(MetricTimeSeries(
                timestamp=current_step,
                district_id=dist.id,
                domain="transportation",
                metric_name="congestion_index",
                value=trans_data["congestion_index"],
                unit="%",
                is_anomaly=trans_data["incident_active"],
                anomaly_score=trans_data["anomaly_score"],
                anomaly_reason=trans_data["anomaly_reason"]
            ))
            metrics_batch.append(MetricTimeSeries(
                timestamp=current_step,
                district_id=dist.id,
                domain="transportation",
                metric_name="speed_mph",
                value=trans_data["speed_mph"],
                unit="MPH",
                is_anomaly=trans_data["incident_active"],
                anomaly_score=trans_data["anomaly_score"],
                anomaly_reason=trans_data["anomaly_reason"]
            ))

        # Commit in batches of 500 records
        if len(metrics_batch) >= 500:
            db.add_all(metrics_batch)
            db.commit()
            metrics_batch = []
            
        current_step += timedelta(hours=1)
        
    if metrics_batch:
        db.add_all(metrics_batch)
        db.commit()
        
    db.close()
    print("[SEED] Historical database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
