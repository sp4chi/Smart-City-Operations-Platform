# CityPulse — IoT & SCADA Hardware Feed Swap Guide

## Architecture Overview

CityPulse is built with a strict **Separation of Concerns** principle. Physical sensor data ingestion is decoupled from the core database, ML models, REST API, and frontend visualization layers via the **Data Simulation Abstraction Interface**.

```
[ Physical IoT / SCADA Sensors ]          [ CityPulse Synthetic Simulator ]
   (MQTT / Kafka / OPC-UA / Modbus)           (app/simulation/engine.py)
                 │                                        │
                 ▼                                        ▼
   ┌────────────────────────────────────────────────────────────┐
   │         Ingestion Adapter / Telemetry Pipeline             │
   └─────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
   ┌────────────────────────────────────────────────────────────┐
   │                MetricTimeSeries Database Store             │
   └─────────────────────────────┬──────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐
   │    ML Anomaly & Forecast  │   │   FastAPI & WebSockets    │
   └───────────────────────────┘   └───────────────────────────┘
```

---

## 1. Abstract Generator Interface (`BaseSensorGenerator`)

All synthetic generators in `app/simulation/` implement a standardized schema for metric payloads:

```python
{
    "timestamp": datetime.now(timezone.utc),
    "district_id": int,
    "domain": "utilities" | "transportation" | "public_services" | "infrastructure",
    "metric_name": str,
    "value": float,
    "unit": str,
    "is_anomaly": bool,
    "anomaly_score": float,
    "anomaly_reason": str
}
```

---

## 2. Replacing Synthetic Simulator with Real IoT Stream

To plug real physical devices into CityPulse:

### Option A: MQTT / Broker Ingestion Worker
Deploy an MQTT subscriber worker inside `app/simulation/mqtt_adapter.py`:

```python
import paho.mqtt.client as mqtt
import json
from app.db.models import MetricTimeSeries
from app.core.database import SessionLocal

def on_message(client, userdata, msg):
    payload = json.loads(msg.payload.decode('utf-8'))
    db = SessionLocal()
    try:
        metric = MetricTimeSeries(
            district_id=payload['district_id'],
            domain=payload['domain'],
            metric_name=payload['sensor_type'],
            value=payload['telemetry_value'],
            unit=payload['unit']
        )
        db.add(metric)
        db.commit()
    finally:
        db.close()

client = mqtt.Client()
client.on_message = on_message
client.connect("mqtt.citypulse-iot.org", 1883, 60)
client.subscribe("citypulse/telemetry/#")
client.loop_start()
```

### Option B: Kafka Event Stream / TimescaleDB Extension
For high-throughput industrial SCADA pipelines (e.g. 50,000 events/sec), configure PostgreSQL with TimescaleDB hypertables:

```sql
CREATE TABLE metric_telemetry (
    time TIMESTAMPTZ NOT NULL,
    district_id INTEGER NOT NULL,
    metric_name TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL
);

SELECT create_hypertable('metric_telemetry', 'time');
```

---

## 3. Zero-Downtime Migration Strategy

1. **Keep DB Schemas Intact**: `MetricTimeSeries` remains the single source of truth for historical AI/ML training and REST APIs.
2. **Disable Background Simulator**: Set `SIMULATION_ENABLED=False` in `.env`.
3. **Connect Ingestion Adapter**: Launch the MQTT/Kafka subscriber worker. Live metric streams will automatically update dashboard KPIs and trigger WebSockets notifications without changing a single line of frontend UI code!
