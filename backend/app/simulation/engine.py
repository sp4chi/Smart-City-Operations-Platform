import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.db.models import (
    District, UtilitiesAsset, TrafficCorridor, PublicTransitVehicle,
    EmergencyUnit, InfrastructureAsset, MetricTimeSeries, Alert
)
from app.simulation.utilities_sim import UtilitiesSimulator
from app.simulation.transport_sim import TransportSimulator
from app.simulation.services_sim import PublicServicesSimulator
from app.simulation.infra_sim import InfrastructureSimulator

logger = logging.getLogger("simulation")

class SimulationEngine:
    def __init__(self):
        self.is_running = False
        self._task = None
        self.broadcaster_callback = None

    def set_broadcaster(self, callback):
        self.broadcaster_callback = callback

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Simulation Engine started with {settings.SIMULATION_INTERVAL_SECONDS}s tick interval.")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.tick()
            except Exception as e:
                logger.error(f"Error during simulation tick: {e}", exc_info=True)
            await asyncio.sleep(settings.SIMULATION_INTERVAL_SECONDS)

    async def tick(self):
        db: Session = SessionLocal()
        now = datetime.now(timezone.utc)
        
        try:
            districts = db.query(District).all()
            tick_events = []
            
            for dist in districts:
                # 1. Utilities Simulation
                u_data = UtilitiesSimulator.generate_district_utilities(dist.id, now)
                u_asset = db.query(UtilitiesAsset).filter(UtilitiesAsset.district_id == dist.id).first()
                if u_asset:
                    u_asset.electricity_mw = u_data["electricity_mw"]
                    u_asset.water_pressure_psi = u_data["water_pressure_psi"]
                    u_asset.water_flow_gpm = u_data["water_flow_gpm"]
                    u_asset.gas_pressure_bar = u_data["gas_pressure_bar"]
                    u_asset.waste_fill_pct = u_data["waste_fill_pct"]
                    u_asset.status = "Critical" if u_data["is_anomaly"] else "Normal"
                    u_asset.last_updated = now

                # Save Time-series records
                ts_power = MetricTimeSeries(
                    timestamp=now, district_id=dist.id, domain="utilities",
                    metric_name="electricity_mw", value=u_data["electricity_mw"], unit="MW",
                    is_anomaly=u_data["is_anomaly"], anomaly_score=u_data["anomaly_score"],
                    anomaly_reason=u_data["anomaly_reason"]
                )
                ts_water = MetricTimeSeries(
                    timestamp=now, district_id=dist.id, domain="utilities",
                    metric_name="water_pressure_psi", value=u_data["water_pressure_psi"], unit="PSI",
                    is_anomaly=u_data["is_anomaly"], anomaly_score=u_data["anomaly_score"],
                    anomaly_reason=u_data["anomaly_reason"]
                )
                db.add_all([ts_power, ts_water])

                # Trigger alert if anomaly detected
                if u_data["is_anomaly"]:
                    alert_code = f"ALT-UTL-{now.strftime('%H%M%S')}-{dist.id}"
                    existing = db.query(Alert).filter(Alert.alert_code == alert_code).first()
                    if not existing:
                        new_alert = Alert(
                            alert_code=alert_code,
                            domain="utilities",
                            district_id=dist.id,
                            severity="Critical" if u_data["anomaly_score"] > 0.9 else "Warning",
                            title=f"Utilities Anomaly in {dist.name}",
                            description=u_data["anomaly_reason"] or "Abnormal sensor telemetry readings.",
                            root_cause_hint="Automated real-time anomaly detection system flag."
                        )
                        db.add(new_alert)
                        tick_events.append({
                            "type": "NEW_ALERT",
                            "alert_code": alert_code,
                            "district": dist.name,
                            "severity": new_alert.severity,
                            "title": new_alert.title
                        })

                # 2. Transportation Simulation
                t_data = TransportSimulator.generate_corridor_metrics(dist.id, now)
                t_corr = db.query(TrafficCorridor).filter(TrafficCorridor.district_id == dist.id).first()
                if t_corr:
                    t_corr.speed_mph = t_data["speed_mph"]
                    t_corr.flow_veh_hr = t_data["flow_veh_hr"]
                    t_corr.congestion_index = t_data["congestion_index"]
                    t_corr.incident_active = t_data["incident_active"]
                    t_corr.last_updated = now

                ts_traffic = MetricTimeSeries(
                    timestamp=now, district_id=dist.id, domain="transportation",
                    metric_name="congestion_index", value=t_data["congestion_index"], unit="%",
                    is_anomaly=t_data["incident_active"], anomaly_score=t_data["anomaly_score"],
                    anomaly_reason=t_data["anomaly_reason"]
                )
                db.add(ts_traffic)

                # 3. Infrastructure Wear
                infra_assets = db.query(InfrastructureAsset).filter(InfrastructureAsset.district_id == dist.id).all()
                for asset in infra_assets:
                    sim_infra = InfrastructureSimulator.simulate_asset_degradation(asset.condition_score, asset.asset_type)
                    asset.condition_score = sim_infra["condition_score"]
                    asset.risk_level = sim_infra["risk_level"]
                    asset.estimated_days_to_failure = sim_infra["estimated_days_to_failure"]

            db.commit()

            # Broadcast live update payload to connected WebSocket clients
            if self.broadcaster_callback:
                payload = {
                    "timestamp": now.isoformat(),
                    "type": "METRIC_UPDATE",
                    "events": tick_events,
                    "active_districts_count": len(districts)
                }
                await self.broadcaster_callback(payload)
                
        finally:
            db.close()

simulation_engine = SimulationEngine()
