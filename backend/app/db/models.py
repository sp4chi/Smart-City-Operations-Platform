from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="operator")  # admin, operator, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class District(Base):
    __tablename__ = "districts"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    population = Column(Integer, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    area_sq_km = Column(Float, nullable=False)
    bounds_json = Column(JSON, nullable=True)  # GeoJSON polygon array

class MetricTimeSeries(Base):
    __tablename__ = "metric_time_series"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    domain = Column(String, index=True, nullable=False) # utilities, transportation, public_services, infrastructure
    metric_name = Column(String, index=True, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    is_anomaly = Column(Boolean, default=False, index=True)
    anomaly_score = Column(Float, default=0.0)
    anomaly_reason = Column(String, nullable=True)
    
    district = relationship("District")

class UtilitiesAsset(Base):
    __tablename__ = "utilities_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False) # power_grid, water_substation, gas_pipeline, waste_station
    status = Column(String, default="Normal") # Normal, Warning, Critical
    electricity_mw = Column(Float, default=0.0)
    water_pressure_psi = Column(Float, default=0.0)
    water_flow_gpm = Column(Float, default=0.0)
    gas_pressure_bar = Column(Float, default=0.0)
    waste_fill_pct = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=utc_now)
    
    district = relationship("District")

class TrafficCorridor(Base):
    __tablename__ = "traffic_corridors"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    name = Column(String, nullable=False)
    start_location = Column(String, nullable=False)
    end_location = Column(String, nullable=False)
    speed_mph = Column(Float, default=35.0)
    flow_veh_hr = Column(Integer, default=1200)
    congestion_index = Column(Float, default=25.0) # 0-100
    incident_active = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=utc_now)
    
    district = relationship("District")

class PublicTransitVehicle(Base):
    __tablename__ = "public_transit_vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    route_name = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False) # bus, light_rail
    vehicle_code = Column(String, nullable=False, unique=True)
    delay_minutes = Column(Float, default=0.0)
    ridership_count = Column(Integer, default=45)
    health_score = Column(Float, default=95.0)
    status = Column(String, default="On Time")
    last_updated = Column(DateTime, default=utc_now)
    
    district = relationship("District")

class ServiceRequest311(Base):
    __tablename__ = "service_requests_311"
    
    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False) # Pothole Repair, Streetlight Outage, Water Leak, Waste Collection, Noise Complaint
    description = Column(Text, nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    priority = Column(String, default="Medium") # Low, Medium, High, Urgent
    status = Column(String, default="Open", index=True) # Open, In Progress, Resolved
    sla_hours = Column(Integer, default=48)
    created_at = Column(DateTime, default=utc_now, index=True)
    resolved_at = Column(DateTime, nullable=True)
    
    district = relationship("District")

class EmergencyUnit(Base):
    __tablename__ = "emergency_units"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    unit_code = Column(String, unique=True, nullable=False)
    unit_type = Column(String, nullable=False) # Police, Fire, EMS
    status = Column(String, default="Available") # Available, Dispatched, On Scene
    avg_response_time_min = Column(Float, default=4.5)
    active_incidents_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=utc_now)
    
    district = relationship("District")

class InfrastructureAsset(Base):
    __tablename__ = "infrastructure_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    name = Column(String, nullable=False)
    asset_type = Column(String, index=True, nullable=False) # road, bridge, building, streetlight
    location_description = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    condition_score = Column(Float, default=85.0) # 0-100
    risk_level = Column(String, default="Low") # Low, Medium, High, Critical
    estimated_days_to_failure = Column(Integer, default=365)
    maintenance_status = Column(String, default="Operational") # Operational, Scheduled, Under Repair
    last_inspection_date = Column(DateTime, default=utc_now)
    
    district = relationship("District")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String, unique=True, index=True, nullable=False)
    domain = Column(String, index=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    severity = Column(String, index=True, nullable=False) # Info, Warning, Critical
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    root_cause_hint = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    
    district = relationship("District")

class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String, unique=True, index=True, nullable=False)
    asset_type = Column(String, nullable=False)
    asset_id = Column(Integer, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    priority = Column(String, default="Medium")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    estimated_cost = Column(Float, default=1500.0)
    status = Column(String, default="Pending") # Pending, Approved, In Progress, Completed
    created_at = Column(DateTime, default=utc_now)
    
    district = relationship("District")
