import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest

class CityAnomalyDetector:
    
    @staticmethod
    def detect_zscore_anomalies(values: List[float], threshold: float = 2.5) -> List[Dict[str, Any]]:
        """
        Computes Z-Score statistical anomalies over a list of historical metric values.
        Returns explainable anomaly metadata.
        """
        if len(values) < 5:
            return []
            
        arr = np.array(values)
        mean = np.mean(arr)
        std = np.std(arr)
        
        if std == 0:
            return []
            
        z_scores = (arr - mean) / std
        anomalies = []
        
        for idx, (val, z) in enumerate(zip(arr, z_scores)):
            if abs(z) >= threshold:
                direction = "Spike (+)" if z > 0 else "Drop (-)"
                pct_diff = ((val - mean) / mean) * 100.0 if mean != 0 else 0.0
                
                explanation = (
                    f"Metric value {val:.2f} deviates by {z:.2f} std deviations from historical "
                    f"mean of {mean:.2f} ({direction} {abs(pct_diff):.1f}%)."
                )
                anomalies.append({
                    "index": idx,
                    "value": float(val),
                    "z_score": float(z),
                    "mean": float(mean),
                    "std": float(std),
                    "pct_difference": float(pct_diff),
                    "explanation": explanation,
                    "confidence_score": float(min(0.99, abs(z) / (threshold * 1.5)))
                })
                
        return anomalies

    @staticmethod
    def detect_isolation_forest_anomalies(df_metrics: pd.DataFrame, contamination: float = 0.05) -> pd.DataFrame:
        """
        Uses scikit-learn IsolationForest to fit multi-dimensional metric streams.
        """
        if df_metrics.empty or len(df_metrics) < 10:
            df_metrics["is_iforest_anomaly"] = False
            df_metrics["iforest_score"] = 0.0
            return df_metrics

        model = IsolationForest(contamination=contamination, random_state=42)
        features = df_metrics[["value"]].values
        
        df_metrics["iforest_pred"] = model.fit_predict(features)
        df_metrics["iforest_score"] = model.decision_function(features)
        df_metrics["is_iforest_anomaly"] = df_metrics["iforest_pred"] == -1
        
        return df_metrics
