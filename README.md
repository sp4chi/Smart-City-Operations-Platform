# 🏙️ CityPulse — AI-Native Smart City Operations Platform

CityPulse is a full-stack, AI-native smart city operations and analytics platform. It provides municipal leadership and district operators with a single pane of glass for real-time monitoring, explainable anomaly detection, predictive maintenance, demand forecasting, and a natural-language operations assistant across four core urban domains: **Utilities**, **Transportation**, **Public Services**, and **Infrastructure**.

---
**Live link: https://citypulse-frontend-zxw5.onrender.com**

---

## 🤖 Core AI Engines

CityPulse features 4 core AI engines integrated directly into the platform:

1. **📈 Urban Trend Prediction**:
   - **Models**: Holt-Winters Exponential Smoothing & ARIMA Trend Extrapolators (`statsmodels`).
   - **Capabilities**: Predicts 24-hour and 7-day lookahead municipal demand curves (electricity load in MW, water pressure in PSI, gas flow in bar, traffic congestion indices) with 95% confidence intervals.
   - **Location**: Navigable under `Utilities` and `Transportation` views or sidebar AI shortcut.

2. **🤖 AI City Advisor**:
   - **Models**: Gemini 2.5 Flash Grounded RAG Pipeline (`google-genai`).
   - **Capabilities**: A natural-language co-pilot that queries live operational database state to provide evidence-backed municipal recommendations (e.g. *"Which districts need immediate water pressure intervention?"*).
   - **Location**: Navigable via `Ops Assistant` top navbar button or sidebar AI shortcut.

3. **⚡ Resource Optimization**:
   - **Models**: Weibull Reliability Risk Decay Estimator.
   - **Capabilities**: Evaluates infrastructure condition scores (0-100), predicts failure probabilities, calculates days-to-failure windows, and optimizes 311 service request dispatches to minimize budget impact and emergency response SLAs.
   - **Location**: Navigable under `Infrastructure` and `Public Services` views or sidebar AI shortcut.

4. **🧠 Operational Insights**:
   - **Models**: Explainable Z-Score & Isolation Forest Anomaly Detectors + Spatial-Temporal Incident Clusterer (`scikit-learn`).
   - **Capabilities**: Detects sudden sensor anomalies, generates plain-language root-cause diagnosis hints (e.g. *"Water flow surge + 55% pressure drop → Underground main fracture near Riverfront Substation"*), and groups multi-domain alerts into cascading incident briefs.
   - **Location**: Navigable under `Operations Dashboard` and `Live Alert Feed` drawer.

---

## 🌟 Key Domain Features

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

6. **Role-Based Access Control (RBAC) & Auth**:
   - 👑 **Admin**: Full read, write, work-order dispatch, and user management control.
   - ⚡ **Operator**: Operational read and field write dispatch access.
   - 👁️ **Viewer**: Public inspector read-only access (write operations blocked with `HTTP 403 Forbidden`).

---

## ⚡ Supabase Cloud PostgreSQL Integration

CityPulse supports **Supabase Cloud PostgreSQL** out of the box with custom schema isolation (`citypulse` schema).

### Apply Schema & Seed Data to Supabase via Python

1. Add your Supabase database connection URL to `backend/.env`:

```env
SUPABASE_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

2. Run the Python migration script:

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Execute migration
python3 migrate.py
```

The script automatically connects to Supabase, creates an isolated **`citypulse`** schema, creates all 11 domain tables, configures Row Level Security (RLS) policies, and populates initial municipal seed data.

---

## 🚀 Setup & Running Instructions

### 1. Backend Setup & Startup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment & install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start FastAPI Uvicorn Server (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup & Startup

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages & run dev server
npm install
npm run dev
```

Open your browser to `http://localhost:5173`.

---

## 🧪 Running Automated Tests

```bash
cd backend
pytest
```

---

## 🎬 Short Demo Script & Feature Walkthrough

Follow these steps to demonstrate key platform capabilities:

1. **Watch Live Simulated Data**: Open `http://localhost:5173`. Observe the green pulsing **Live IoT Stream (3s)** dot in the top navbar.
2. **Map & District Selection**: Click on **District 3 — East Riverfront** on the Leaflet map to filter KPIs.
3. **Check Operational Insights & AI Anomaly Alert**: Click the **Alert Bell** icon to inspect active alerts and automated root-cause hints.
4. **View Urban Trend Prediction**: Click **Utilities** in the sidebar to view the 24-hour predictive trendline with 95% confidence bounds.
5. **Interact with AI City Advisor**: Click **Ops Assistant** and ask: *"Which districts have water anomalies right now?"*
