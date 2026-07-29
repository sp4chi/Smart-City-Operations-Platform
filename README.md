# 🏙️ CityPulse — AI-Native Smart City Operations Platform

CityPulse is a full-stack, AI-native smart city operations and analytics platform. It provides municipal leadership and district operators with a single pane of glass for real-time monitoring, explainable anomaly detection, predictive maintenance, demand forecasting, and a natural-language operations assistant across four core urban domains: **Utilities**, **Transportation**, **Public Services**, and **Infrastructure**.

---

## 🌟 Key Features

1. **Centralized Operations Dashboard**:
   - City Health Index & real-time cross-domain KPIs.
   - Interactive Leaflet GIS map with color-coded district polygons (**Downtown Central**, **Northside Tech Corridor**, **East Riverfront**, **West Heights**, **South Suburbs**) and clickable telemetry pins.
   - Real-time WebSockets alert stream with severity filters and root-cause hints.

2. **Utilities Management**:
   - Simulated Electricity MW load, Water Pressure (PSI), Water Flow (GPM), Gas Flow (bar), and Waste Bin fill levels.
   - Leak & surge anomaly detection with explainability metrics (Z-score deviation, percentile delta).
   - 24-hour Holt-Winters & Exponential Smoothing predictive demand forecast with 95% confidence bounds.
   - Maintenance work order dispatch workflow.

3. **Transportation**:
   - Real-time traffic speeds, vehicle flow (veh/hr), and congestion index gauges (0-100).
   - Public transit fleet performance (delays, ridership, vehicle health).
   - Garage parking occupancy simulation.
   - Traffic incident collision detection with nearby route impact analysis.

4. **Public Services**:
   - 311 Citizen Service Request intake, category routing, and SLA tracking backlog board.
   - Built-in interactive 311 report creation simulator modal.
   - Emergency services dashboard: Police, Fire, EMS unit response times and active dispatches.

5. **Infrastructure Management**:
   - Asset registry (bridges, roads, streetlights, public buildings) with condition scores (0-100).
   - Predictive maintenance: ML degradation curves predicting failure probabilities and estimated days to failure.
   - Maintenance scheduling calendar and budget impact estimation.

6. **AI-Native Capabilities (Across Whole Platform)**:
   - **Explainable Anomaly Detection**: Z-Score & Isolation Forest models.
   - **Demand Forecaster**: 24h & 7d lookahead demand predictions.
   - **Predictive Maintenance**: Asset health failure window estimations.
   - **Grounded NL Operations Assistant**: Chat co-pilot querying live operational database state via Gemini API (or structured RAG fallback engine).
   - **Automated Incident Clusterer**: Grouping correlated alerts into plain-language incident briefs.

---

## 🏗️ Technical Architecture

- **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Lucide React icons, Recharts analytics, Leaflet GIS maps.
- **Backend**: Python 3.11+ / FastAPI, Async SQLAlchemy, SQLite (with WAL mode for zero-external-dependency execution and instant startup), Uvicorn.
- **Real-Time Stream**: FastAPI WebSockets broadcasting synthetic IoT metrics every 3 seconds to connected dashboards.
- **Simulation Layer**: Modular IoT sensor generator background task seeded with 30 days of 15-minute historical data on first run.

---

## 🚀 Setup & Running Instructions

### 1. Prerequisites
- Python 3.9+
- Node.js v18+ and npm

### 2. Backend Setup & Startup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run database seed (auto-runs on server boot, or run manually)
PYTHONPATH=. python3 app/db/seed_data.py

# Start FastAPI Uvicorn Server (runs on http://localhost:8000)
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup & Startup

Open a new terminal tab:

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite React Dev Server (runs on http://localhost:5173)
npm run dev
```

Open your browser to `http://localhost:5173`.

---

## 🔑 Environment Variables Configuration

Create a `.env` file in `backend/` (optional):

```env
# Database URL (SQLite default)
DATABASE_URL=sqlite:///./citypulse.db

# Optional: Google Gemini API Key for NL Assistant
GEMINI_API_KEY=your_gemini_api_key_here

# Simulation Interval (Seconds)
SIMULATION_INTERVAL_SECONDS=3.0
```

*(Note: If no `GEMINI_API_KEY` is set, CityPulse automatically falls back to its grounded structured rule engine, so all natural language queries work seamlessly out-of-the-box!)*

---

## 🧪 Running Automated Tests

Run backend API and ML utility unit tests via pytest:

```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest
```

Run frontend build & TypeScript check:

```bash
cd frontend
npm run build
```

---

## 🎬 Short Demo Script & Feature Walkthrough

Follow these steps to demonstrate key platform capabilities:

1. **Watch Live Simulated Data**:
   - Open `http://localhost:5173`. Look at the top navbar — observe the green pulsing **Live IoT Stream (3s)** dot confirming active WebSockets ingestion.
   - Watch district metric badges update live every 3 seconds without refreshing.

2. **Map & District Selection**:
   - Click on **District 3 — East Riverfront** on the Leaflet map or dropdown filter. Notice how KPIs automatically filter to East Riverfront's operational status.

3. **Check AI Anomaly Alert & Root-Cause Hint**:
   - Click the **Alert Bell** icon in the top navbar to open the **Live Operations Feed**.
   - Inspect the critical alert: `ALT-2026-001: Severe Water Main Pressure Drop`. Read the automated root-cause hint explaining the pressure drop.

4. **View ML Demand Forecast**:
   - Click **Utilities** in the sidebar.
   - Switch the metric selector to **⚡ Electricity Grid Load (MW)** or **💧 Water Main Pressure (PSI)**.
   - Observe the 24-hour predictive trendline and shaded 95% confidence bounds generated by the Holt-Winters time-series model.

5. **Interact with Natural-Language Operations Assistant**:
   - Click **Ops Assistant** in the top right navbar to open the chat drawer.
   - Click any sample prompt chip, or type:
     - *"Which districts have water anomalies right now?"*
     - *"Summarize active critical alerts"*
     - *"What infrastructure assets are at high risk?"*
   - Read the grounded operational response containing exact data metrics and citation badges.

6. **Submit 311 Citizen Request**:
   - Click **Public Services** in the sidebar -> click **Submit 311 Request**.
   - Submit a test request (e.g. *Water Leak on 5th St*). See it immediately reflect in the backlog table and emergency SLA metrics!

---

## 📖 IoT Swap Architecture

See `docs/IoT_INTEGRATION_GUIDE.md` for a complete breakdown of how to swap the synthetic simulation engine for real physical MQTT / Kafka / SCADA feeds without changing application code.
