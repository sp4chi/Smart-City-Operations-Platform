import random
from datetime import datetime
from typing import Dict, Any
from app.simulation.generator_base import BaseSensorGenerator

class UtilitiesSimulator(BaseSensorGenerator):
    
    @classmethod
    def generate_district_utilities(cls, district_id: int, dt: datetime, force_anomaly: bool = False) -> Dict[str, Any]:
        diurnal = cls.get_diurnal_factor(dt)
        
        # Base loads per district
        base_mw = 120.0 + (district_id * 25.0)
        base_water_psi = 65.0
        base_water_gpm = 3500.0 + (district_id * 500.0)
        base_gas_bar = 4.2
        base_waste_pct = min(98.0, 40.0 + (diurnal * 45.0) + (random.random() * 10))
        
        # Power MW varies heavily with diurnal cycle
        electricity_mw = base_mw * (0.6 + 0.6 * diurnal)
        electricity_mw = cls.add_noise(electricity_mw, 0.03)
        
        # Water PSI drops slightly during peak usage hours
        water_psi = base_water_psi - (diurnal * 8.0)
        water_psi = cls.add_noise(water_psi, 0.02)
        
        water_flow_gpm = base_water_gpm * (0.7 + 0.5 * diurnal)
        water_flow_gpm = cls.add_noise(water_flow_gpm, 0.04)
        
        gas_pressure = cls.add_noise(base_gas_bar, 0.02)
        
        anomaly_flag = False
        anomaly_reason = None
        anomaly_score = 0.0
        
        # Trigger synthetic anomaly conditions
        if force_anomaly or (random.random() < 0.03):
            anomaly_type = random.choice(["water_leak", "power_surge", "low_gas_pressure"])
            if anomaly_type == "water_leak":
                water_psi = water_psi * 0.45 # Severe drop in pressure
                water_flow_gpm = water_flow_gpm * 1.8 # Spike in flow
                anomaly_flag = True
                anomaly_reason = f"District {district_id} Main Feeder Water Leak (Pressure drop to {water_psi:.1f} PSI)"
                anomaly_score = 0.92
            elif anomaly_type == "power_surge":
                electricity_mw = electricity_mw * 1.65 # Power grid surge
                anomaly_flag = True
                anomaly_reason = f"District {district_id} Substation Thermal Overload (Load surge to {electricity_mw:.1f} MW)"
                anomaly_score = 0.88
            elif anomaly_type == "low_gas_pressure":
                gas_pressure = gas_pressure * 0.5
                anomaly_flag = True
                anomaly_reason = f"District {district_id} Gas Regulator Valve Failure (Pressure at {gas_pressure:.2f} bar)"
                anomaly_score = 0.85
                
        return {
            "electricity_mw": round(electricity_mw, 2),
            "water_pressure_psi": round(water_psi, 1),
            "water_flow_gpm": round(water_flow_gpm, 1),
            "gas_pressure_bar": round(gas_pressure, 2),
            "waste_fill_pct": round(base_waste_pct, 1),
            "is_anomaly": anomaly_flag,
            "anomaly_reason": anomaly_reason,
            "anomaly_score": anomaly_score
        }
