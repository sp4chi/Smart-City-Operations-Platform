from typing import Dict, Any, List

class PredictiveMaintenanceEngine:
    
    @staticmethod
    def calculate_failure_risk(condition_score: float, age_years: float, last_inspection_days_ago: int, asset_type: str) -> Dict[str, Any]:
        """
        Computes asset health risk score (0-100), estimated failure window, and actionable recommendation.
        """
        # Baseline failure probability curve based on Weibull distribution shape
        score_component = max(0.0, (100.0 - condition_score) / 100.0)
        age_component = min(1.0, age_years / 30.0)
        inspection_risk = min(1.0, last_inspection_days_ago / 180.0)
        
        failure_prob = (score_component * 0.6) + (age_component * 0.25) + (inspection_risk * 0.15)
        failure_prob_pct = round(failure_prob * 100.0, 1)
        
        if failure_prob_pct >= 65.0:
            risk_category = "Critical"
            action = "Dispatch immediate inspection team & schedule emergency repair ticket."
        elif failure_prob_pct >= 40.0:
            risk_category = "High"
            action = "Include in upcoming 14-day preventative maintenance cycle."
        elif failure_prob_pct >= 20.0:
            risk_category = "Medium"
            action = "Routine inspection scheduled within 60 days."
        else:
            risk_category = "Low"
            action = "Asset operating within nominal health parameters."

        est_days = int(max(3, (condition_score - 25.0) * 7.2))
        
        return {
            "condition_score": condition_score,
            "failure_probability_pct": failure_prob_pct,
            "risk_category": risk_category,
            "recommended_action": action,
            "estimated_days_to_failure": est_days,
            "factors": {
                "score_impact": f"{score_component * 60:.1f}%",
                "asset_age_impact": f"{age_component * 25:.1f}%",
                "inspection_lag_impact": f"{inspection_risk * 15:.1f}%"
            }
        }
