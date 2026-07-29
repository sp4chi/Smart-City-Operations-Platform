import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

class BaseSensorGenerator:
    """
    Abstract sensor simulation generator.
    Produces realistic time-series data with diurnal cycles, noise, and configurable anomaly triggers.
    """
    
    @staticmethod
    def get_diurnal_factor(dt: datetime) -> float:
        """
        Returns a factor between 0.0 and 1.0 based on time of day (sine curve peaking at 14:00/2pm).
        """
        hour = dt.hour + (dt.minute / 60.0)
        # Shift peak to 14:00 (2 PM)
        angle = (hour - 14) * (2 * math.pi / 24)
        factor = (math.cos(angle) + 1.0) / 2.0  # Range 0.0 to 1.0
        return factor

    @staticmethod
    def add_noise(base_val: float, noise_pct: float = 0.05) -> float:
        """
        Applies Gaussian noise to a value.
        """
        variation = random.gauss(0, noise_pct * base_val)
        return max(0.0, base_val + variation)
