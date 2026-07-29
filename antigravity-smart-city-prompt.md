# Build Prompt for Antigravity: AI-Native Smart City Operations Platform

Copy everything below into Antigravity as your project brief.

---

## Project Title
**CityPulse** — An AI-Native Smart City Operations Platform

## Context
Smart cities need a single pane of glass for municipal leadership and operations staff to monitor and manage utilities, transportation, public services, and infrastructure. This project is a **software analytics platform only** — no physical IoT devices, sensors, or hardware integration. All real-time data must come from **realistic synthetic data generators/simulators** built into the app, designed so they could later be swapped for real IoT/SCADA feeds without changing the rest of the architecture.

## Objective
Build a full-stack, AI-native web application that gives city administrators centralized, real-time visibility into:
1. **Utilities** (electricity, water, gas, waste management)
2. **Transportation** (traffic flow, public transit, parking)
3. **Public services** (emergency services, 311 citizen requests, public safety)
4. **Infrastructure** (roads, bridges, streetlights, buildings — condition & maintenance)

The platform must be "AI-native," meaning AI/ML is a first-class part of the architecture, not a bolt-on: anomaly detection, predictive maintenance, forecasting, and a natural-language operations assistant should be core features, not an afterthought.

## Scope Constraints
- No real IoT hardware integration. Instead, build a **data simulation layer** that generates realistic time-series and event data for all domains, seeded to be plausible for a mid-size city (e.g., ~500K population).
- Design the simulation layer behind a clean interface/abstraction so real sensor feeds could later be substituted with minimal changes.
- Single deployable web app (backend + frontend + database), runnable locally, with clear setup instructions.

## Core Modules & Functional Requirements

### 1. Centralized Operations Dashboard
- City-wide overview: key KPIs across all domains (uptime %, active incidents, service requests open/closed, energy/water consumption trends, traffic congestion index)
- Map-based view (city zones/districts) with status color-coding (normal / warning / critical)
- Real-time alert feed with severity levels and drill-down into the underlying domain

### 2. Utilities Management
- Simulated electricity load, water consumption/pressure, gas flow, and waste collection data per district
- Outage/leak/anomaly detection with root-cause hints
- Consumption forecasting (daily/weekly load prediction)
- Maintenance ticket workflow tied to detected anomalies

### 3. Transportation
- Simulated traffic flow/congestion by corridor and intersection
- Public transit performance (on-time %, ridership trends, vehicle health)
- Parking occupancy simulation
- Incident detection (e.g., simulated accidents, road closures) with impact analysis on nearby routes

### 4. Public Services
- 311-style citizen service request intake, categorization, and routing (simulate incoming requests: potholes, noise complaints, streetlight outages, etc.)
- Emergency services dashboard: simulated call volume, response times, unit availability by zone
- SLA tracking and backlog visualization

### 5. Infrastructure Management
- Asset registry (roads, bridges, streetlights, public buildings) with condition scores
- Predictive maintenance: simulate sensor/inspection data and use ML to flag assets likely to need maintenance
- Maintenance scheduling and budget/resource impact view

### 6. AI-Native Capabilities (must span the whole app, not be one tab)
- **Anomaly detection** on all time-series streams (utilities load, traffic, service request spikes) using statistical or ML models
- **Forecasting** for demand/load (electricity, water, traffic, service request volume) — e.g., simple time-series models (ARIMA/Prophet) or a lightweight ML model
- **Predictive maintenance scoring** for infrastructure assets
- **Natural-language operations assistant**: a chat interface where an operator can ask things like "Which districts had the most water anomalies this week?" or "Summarize today's incidents" and get answers generated over the live data (RAG-style: query structured data, then summarize with an LLM)
- **Automated incident summarization**: AI-generated plain-language summaries of clusters of related alerts/incidents
- All AI features should have a clear "explainability" element (why was this flagged as an anomaly, what data supports the recommendation)

## Suggested Technical Architecture
*(Antigravity may adjust specifics, but should follow this shape)*

- **Frontend**: React (TypeScript), component-based dashboard, charting library (Recharts or similar), map visualization (Leaflet or Mapbox with mock geodata)
- **Backend**: Python (FastAPI) or Node.js (Express/NestJS) — Python preferred if ML models are Python-based
- **Database**: PostgreSQL for relational/domain data + a time-series-friendly store (TimescaleDB extension or InfluxDB) for sensor-style metrics
- **Simulation layer**: scheduled background jobs/workers that continuously generate synthetic events and metrics into the database, at configurable intervals, to mimic real-time IoT feeds
- **ML/AI layer**: 
  - Classical ML/stat models (e.g., scikit-learn, statsmodels/Prophet) for anomaly detection and forecasting, trained/re-trained on the simulated historical data
  - LLM integration (via Gemini API or configurable provider) for the natural-language assistant and incident summarization, grounded in queries against the live database (not hallucinated)
- **Real-time updates**: WebSockets or Server-Sent Events so the dashboard updates live as simulated data streams in
- **Auth**: basic role-based access (admin, department operator, viewer) — doesn't need to be production-grade, but should exist
- **API layer**: well-documented REST (or GraphQL) endpoints for each domain, separate from the simulation internals

## Data Strategy
- Build a `data-simulation` module with generators for each domain (utilities, transportation, public services, infrastructure)
- Generators should produce data with realistic patterns: daily/weekly seasonality, occasional spikes/anomalies, correlated events (e.g., a traffic incident increasing nearby 311 complaints)
- Persist generated data to the database on a schedule (e.g., every N seconds/minutes, configurable) so the system behaves like a live operational platform
- Include a way to seed several months of historical data on first run so forecasting/ML models have something to train on immediately

## Non-Functional Requirements
- Clear separation of concerns: simulation layer, data layer, API layer, ML layer, frontend — swappable independently
- Environment-based configuration (no hardcoded secrets/URLs)
- Reasonable performance for a demo/prototype scale (doesn't need to handle real city-scale load, but shouldn't be trivially broken by continuous simulated ingestion)
- Basic automated tests for backend API endpoints and ML utility functions
- README with setup, run, and architecture overview instructions

## Deliverables
1. Full source code (frontend + backend + simulation + ML) in a single repo/project structure
2. Seed script to populate historical synthetic data
3. Running instructions (local dev setup, env vars, how to start simulation workers)
4. Architecture diagram/description (can be a markdown doc) explaining how a real IoT feed would plug in later
5. Short demo script/walkthrough of key features (dashboard, anomaly alert, forecast view, NL assistant query)

## Suggested Build Order (for Antigravity to plan against)
1. Project scaffolding (frontend + backend + DB, docker-compose if useful)
2. Data models/schema for all four domains
3. Simulation engine + historical seed data
4. Domain APIs (CRUD/read endpoints per module)
5. Frontend dashboard shell + domain pages + map view
6. Real-time layer (WebSocket/SSE) wiring dashboard to live simulated data
7. Anomaly detection + forecasting models
8. Predictive maintenance scoring for infrastructure
9. Natural-language assistant (LLM + grounded queries)
10. Polish: alerts feed, incident summarization, auth, tests, README

## Success Criteria
- A reviewer can start the app, watch simulated city data flow in live, see at least one AI-flagged anomaly and one forecast, and successfully ask the NL assistant a question about current operations and get an accurate, data-grounded answer.

---

**Instruction to Antigravity**: Plan this as a multi-step agentic build. Propose the concrete tech stack and folder structure first, confirm the plan, then implement module by module in the build order above, running tests as you go.
