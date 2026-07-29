import random
from datetime import datetime
from typing import Dict, Any
from app.simulation.generator_base import BaseSensorGenerator

class TransportSimulator(BaseSensorGenerator):
    
    @classmethod
    def generate_corridor_metrics(cls, corridor_id: int, dt: datetime, force_incident: bool = False) -> Dict[str, Any]:
        diurnal = cls.get_diurnal_factor(dt)
        
        # Traffic peak hours (8-9 AM and 5-6 PM)
        hour = dt.hour + dt.minute / 60.0
        is_rush_hour = (7.5 <= hour <= 9.5) or (16.5 <= hour <= 18.5)
        rush_multiplier = 1.6 if is_rush_hour else 1.0
        
        base_speed = 45.0
        base_flow = 1400
        
        # Rush hour lowers speed and increases flow
        speed_mph = max(12.0, base_speed - (diurnal * rush_multiplier * 22.0))
        speed_mph = cls.add_noise(speed_mph, 0.05)
        
        flow_veh_hr = int(base_flow * (0.4 + 0.7 * diurnal * rush_multiplier))
        flow_veh_hr = int(cls.add_noise(float(flow_veh_hr), 0.05))
        
        congestion_index = max(0.0, min(100.0, (1.0 - (speed_mph / base_speed)) * 100.0))
        
        incident_active = False
        anomaly_reason = None
        anomaly_score = 0.0
        
        if force_incident or (random.random() < 0.02):
            incident_active = True
            speed_mph = max(5.0, speed_mph * 0.3)
            congestion_index = min(99.0, congestion_index + 45.0)
            anomaly_reason = f"Corridor #{corridor_id} Multi-Vehicle Collision & Lane Closure"
            anomaly_score = 0.91
            
        return {
            "speed_mph": round(speed_mph, 1),
            "flow_veh_hr": flow_veh_hr,
            "congestion_index": round(congestion_index, 1),
            "incident_active": incident_active,
            "anomaly_reason": anomaly_reason,
            "anomaly_score": anomaly_score
        }

    @classmethod
    def generate_transit_metrics(cls, vehicle_id: int, dt: datetime) -> Dict[str, Any]:
        diurnal = cls.get_diurnal_factor(dt)
        
        delay_min = max(0.0, random.gauss(1.5, 2.0) + (diurnal * 3.0))
        ridership = int(20 + diurnal * 70 + random.randint(0, 15))
        health_score = max(60.0, 98.0 - (random.random() * 5.0))
        
        status = "On Time"
        if delay_min > 10.0:
            status = "Severely Delayed"
        elif delay_min > 4.0:
            status = "Delayed"
            
        return {
            "delay_minutes": round(delay_min, 1),
            "ridership_count": ridership,
            "health_score": round(health_score, 1),
            "status": status
        }
