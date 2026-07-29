import random
from datetime import datetime
from typing import Dict, Any

class InfrastructureSimulator:
    
    @classmethod
    def simulate_asset_degradation(cls, current_score: float, asset_type: str) -> Dict[str, Any]:
        """
        Simulates natural wear and tear + sensor noise on infrastructure condition score (0-100).
        """
        decay_rate = {"road": 0.05, "bridge": 0.02, "building": 0.01, "streetlight": 0.08}.get(asset_type, 0.03)
        
        # Micro degradation per step
        new_score = max(10.0, current_score - (random.random() * decay_rate))
        
        risk_level = "Low"
        if new_score < 40.0:
            risk_level = "Critical"
        elif new_score < 60.0:
            risk_level = "High"
        elif new_score < 75.0:
            risk_level = "Medium"
            
        estimated_days = int(max(5, (new_score - 30.0) * 8.5))
        
        return {
            "condition_score": round(new_score, 1),
            "risk_level": risk_level,
            "estimated_days_to_failure": estimated_days
        }
