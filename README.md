# 🏙️ CityPulse — AI-Native Smart City Operations Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet%20GIS-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

CityPulse is a full-stack, AI-native smart city operations and analytics platform. It provides municipal leadership and district operators with a single pane of glass for real-time monitoring, explainable anomaly detection, predictive maintenance, demand forecasting, and a natural-language operations assistant across four core urban domains: **Utilities**, **Transportation**, **Public Services**, and **Infrastructure**.

---

🌐 **Live Demo**: [https://citypulse-frontend-zxw5.onrender.com](https://citypulse-frontend-zxw5.onrender.com)

---

## 🏷️ Technology Tags & Architecture Keywords

`smart-city` • `ai-native` • `fastapi` • `react` • `typescript` • `google-gemini` • `rag-pipeline` • `time-series-forecasting` • `holt-winters` • `isolation-forest` • `predictive-maintenance` • `supabase` • `postgresql` • `leaflet-gis` • `websockets` • `jwt-rbac` • `docker`

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
   - Live unresolved alert drawer with real-time WebSocket updates every 3 seconds.

2. **Utilities Management**:
   - Telemetry monitoring for Electricity (MW), Water (PSI/GPM), Gas Pressure (bar), and Smart Waste Fill Level (%).
   - Interactive 24-hour Holt-Winters predictive forecast area chart with 95% confidence bounds and nominal threshold baseline.
   - Automated work order ticket dispatch modal for field maintenance crews.

3. **Transportation & Transit**:
   - Traffic corridor congestion monitoring, speed telemetry, and vehicle flow rates.
   - Metro public transit vehicle health scores, delay trackers, and active route status.
   - Smart parking occupancy grid with live spot availability ratios.

4. **Public Services & Emergency Response**:
   - 311 Citizen Service Request tracking (Potholes, Water Leaks, Streetlights, Noise Complaints).
   - SLA countdown timers and priority-based work order creation.
   - Emergency Services dispatch tracking (Police, Fire, EMS) with average response time analytics.

5. **Infrastructure Integrity & Asset Failure Risk**:
   - Predictive maintenance risk ranking (Bridge, Highway, Water Treatment, Streetlight Grid).
   - Condition score degradation models (0-100) and estimated days to failure.
   - Preventative maintenance scheduling workflow with budget cost estimators.

6. **Authentication & Role-Based Access Control (RBAC)**:
   - Built-in JWT Authentication with three granular system roles:
     - 👑 **Admin**: Full read/write access to all API endpoints, maintenance scheduling, and ticket dispatch.
     - ⚙️ **Operator**: Write access to create 311 requests and dispatch field maintenance tickets.
     - 👁️ **Viewer**: Read-only access to GIS maps, analytics, and AI assistant.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, TailwindCSS, Lucide Icons, Leaflet GIS (`react-leaflet`), Recharts.
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy ORM, Pydantic V2, Uvicorn, WebSockets.
- **AI / ML**: Google GenAI (`google-genai`), Scikit-Learn (IsolationForest), Statsmodels (Holt-Winters), Numpy, Pandas.
- **Database**: SQLite (Local Dev) / Supabase Cloud PostgreSQL (`citypulse` custom schema).
- **Authentication**: OAuth2 Password Flow with Bearer JWT tokens (`passlib` + `python-jose`).
- **Deployment**: Docker, Docker Compose, Render Cloud Blueprint (`render.yaml`).

---

## 🚀 Quickstart Guide

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

## ☁️ Supabase Cloud Migration (Optional)

To connect CityPulse to **Supabase Cloud PostgreSQL**:

1. Add your Supabase URI connection string to `backend/.env`:
   ```env
   SUPABASE_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

2. Run the automated Python migration runner:
   ```bash
   python3 migrate.py
   ```
   *Creates the isolated `citypulse` schema, 11 domain tables, Row Level Security (RLS) policies, and populates initial seed data.*

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
