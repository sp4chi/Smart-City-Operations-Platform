import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app.ml.anomaly_detector import CityAnomalyDetector
from app.ml.forecaster import DemandForecaster
from app.ml.predictive_maint import PredictiveMaintenanceEngine
from app.ml.incident_clustering import IncidentClusteringEngine

def test_zscore_anomaly_detection():
    normal_data = [50.0, 51.2, 49.8, 50.5, 52.0, 48.9, 50.1]
    # Insert clear anomaly spike
    anomaly_data = normal_data + [125.0]
    
    anomalies = CityAnomalyDetector.detect_zscore_anomalies(anomaly_data, threshold=2.0)
    assert len(anomalies) >= 1
    assert anomalies[0]["value"] == 125.0
    assert anomalies[0]["z_score"] > 2.0
    assert "deviates" in anomalies[0]["explanation"]

def test_demand_forecasting():
    ts = ["2026-07-29T10:00:00"] * 30
    vals = [100 + i * 2 for i in range(30)]
    
    result = DemandForecaster.forecast_24h_demand(ts, vals, hours_ahead=24)
    assert "forecast" in result
    assert len(result["forecast"]) == 24
    assert len(result["lower_bound"]) == 24
    assert len(result["upper_bound"]) == 24

def test_predictive_maintenance_risk():
    eval_res = PredictiveMaintenanceEngine.calculate_failure_risk(
        condition_score=35.0,
        age_years=25.0,
        last_inspection_days_ago=120,
        asset_type="bridge"
    )
    assert eval_res["risk_category"] in ["High", "Critical"]
    assert eval_res["failure_probability_pct"] > 40.0
    assert eval_res["estimated_days_to_failure"] < 100

def test_incident_clustering():
    alerts = [
        {"district_id": 1, "district_name": "Downtown", "domain": "utilities", "severity": "Critical", "title": "Water Main Leak"},
        {"district_id": 1, "district_name": "Downtown", "domain": "utilities", "severity": "Warning", "title": "Low Pressure"}
    ]
    clusters = IncidentClusteringEngine.cluster_and_summarize_alerts(alerts)
    assert len(clusters) == 1
    assert clusters[0]["district_name"] == "Downtown"
    assert clusters[0]["alert_count"] == 2
    assert clusters[0]["severity"] == "Critical"
