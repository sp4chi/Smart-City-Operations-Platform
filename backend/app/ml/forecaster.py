import numpy as np
import pandas as pd
from typing import Dict, Any, List
from statsmodels.tsa.holtwinters import ExponentialSmoothing

class DemandForecaster:
    
    @staticmethod
    def forecast_24h_demand(timestamps: List[str], values: List[float], hours_ahead: int = 24) -> Dict[str, Any]:
        """
        Fits Holt-Winters Exponential Smoothing (or Linear Trend Fallback) on historical time series
        and generates a 24-hour lookahead forecast with lower and upper confidence bounds.
        """
        if len(values) < 12:
            # Fallback simple moving average projection
            last_val = values[-1] if values else 100.0
            mean_val = np.mean(values) if values else 100.0
            forecast = [float(last_val)] * hours_ahead
            return {
                "method": "simple_moving_average",
                "forecast": forecast,
                "lower_bound": [float(last_val * 0.9)] * hours_ahead,
                "upper_bound": [float(last_val * 1.1)] * hours_ahead,
                "metrics_mean": float(mean_val)
            }
            
        try:
            # Try Holt-Winters Exponential Smoothing with seasonal period 24 (hourly)
            series = pd.Series(values)
            model = ExponentialSmoothing(
                series,
                trend="add",
                seasonal="add",
                seasonal_periods=24 if len(values) >= 48 else 12
            ).fit()
            
            predictions = model.forecast(hours_ahead)
            pred_vals = [float(max(0.0, v)) for v in predictions]
            
            # Standard error estimation
            residuals = series - model.fittedvalues
            std_err = float(np.std(residuals)) if len(residuals) > 0 else float(np.std(values) * 0.1)
            
            lower_bound = [float(max(0.0, v - 1.96 * std_err)) for v in pred_vals]
            upper_bound = [float(v + 1.96 * std_err) for v in pred_vals]
            
            return {
                "method": "holt_winters_exponential_smoothing",
                "forecast": pred_vals,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "metrics_mean": float(np.mean(values)),
                "std_error": std_err
            }
        except Exception:
            # Fallback to linear regression trend
            x = np.arange(len(values))
            slope, intercept = np.polyfit(x, values, 1)
            future_x = np.arange(len(values), len(values) + hours_ahead)
            pred_vals = [float(max(0.0, slope * fx + intercept)) for fx in future_x]
            
            std_err = float(np.std(values) * 0.08)
            return {
                "method": "linear_trend_regression",
                "forecast": pred_vals,
                "lower_bound": [float(max(0.0, v - 1.5 * std_err)) for v in pred_vals],
                "upper_bound": [float(v + 1.5 * std_err) for v in pred_vals],
                "metrics_mean": float(np.mean(values)),
                "std_error": std_err
            }
