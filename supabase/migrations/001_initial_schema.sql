-- ====================================================================
-- CityPulse Smart City Operations Platform — Initial Supabase Schema
-- Migration Version: 001_initial_schema.sql
-- ====================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. Table: users
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. Table: districts
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.districts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    population INTEGER NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    area_sq_km DOUBLE PRECISION NOT NULL,
    bounds_json JSONB
);

-- --------------------------------------------------------------------
-- 3. Table: metric_time_series
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metric_time_series (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    domain VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50) NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score DOUBLE PRECISION DEFAULT 0.0,
    anomaly_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_metric_ts_timestamp ON public.metric_time_series(timestamp);
CREATE INDEX IF NOT EXISTS idx_metric_ts_district ON public.metric_time_series(district_id);
CREATE INDEX IF NOT EXISTS idx_metric_ts_domain ON public.metric_time_series(domain);

-- --------------------------------------------------------------------
-- 4. Table: utilities_assets
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.utilities_assets (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Normal',
    electricity_mw DOUBLE PRECISION DEFAULT 0.0,
    water_pressure_psi DOUBLE PRECISION DEFAULT 0.0,
    water_flow_gpm DOUBLE PRECISION DEFAULT 0.0,
    gas_pressure_bar DOUBLE PRECISION DEFAULT 0.0,
    waste_fill_pct DOUBLE PRECISION DEFAULT 0.0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. Table: traffic_corridors
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.traffic_corridors (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    speed_mph DOUBLE PRECISION DEFAULT 35.0,
    flow_veh_hr INTEGER DEFAULT 1200,
    congestion_index DOUBLE PRECISION DEFAULT 25.0,
    incident_active BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. Table: public_transit_vehicles
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_transit_vehicles (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_code VARCHAR(100) UNIQUE NOT NULL,
    delay_minutes DOUBLE PRECISION DEFAULT 0.0,
    ridership_count INTEGER DEFAULT 45,
    health_score DOUBLE PRECISION DEFAULT 95.0,
    status VARCHAR(50) DEFAULT 'On Time',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. Table: service_requests_311
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_requests_311 (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Open',
    sla_hours INTEGER DEFAULT 48,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------
-- 8. Table: emergency_units
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_units (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    unit_code VARCHAR(100) UNIQUE NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available',
    avg_response_time_min DOUBLE PRECISION DEFAULT 4.5,
    active_incidents_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. Table: infrastructure_assets
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.infrastructure_assets (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    location_description VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    condition_score DOUBLE PRECISION DEFAULT 85.0,
    risk_level VARCHAR(50) DEFAULT 'Low',
    estimated_days_to_failure INTEGER DEFAULT 365,
    maintenance_status VARCHAR(50) DEFAULT 'Operational',
    last_inspection_date TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 10. Table: alerts
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
    id SERIAL PRIMARY KEY,
    alert_code VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(100) NOT NULL,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    root_cause_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------
-- 11. Table: maintenance_tickets
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    asset_id INTEGER NOT NULL,
    district_id INTEGER REFERENCES public.districts(id) ON DELETE CASCADE,
    priority VARCHAR(50) DEFAULT 'Medium',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_cost DOUBLE PRECISION DEFAULT 1500.0,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_time_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilities_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_transit_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests_311 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all domain tables (anonymous & authenticated)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public read access" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow public read access" ON public.%I FOR SELECT USING (true)', tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access for service_role" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow full access for service_role" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;

-- ====================================================================
-- SEED DATA POPULATION
-- ====================================================================

-- 1. Seed Districts
INSERT INTO public.districts (code, name, population, lat, lng, area_sq_km, bounds_json)
VALUES
('D-01', 'Downtown Central', 125000, 30.2672, -97.7431, 15.4, '[[30.275, -97.750], [30.275, -97.730], [30.255, -97.730], [30.255, -97.750]]'::jsonb),
('D-02', 'Northside Tech Corridor', 110000, 30.3800, -97.7300, 28.6, '[[30.395, -97.745], [30.395, -97.715], [30.365, -97.715], [30.365, -97.745]]'::jsonb),
('D-03', 'East Riverfront', 85000, 30.2500, -97.7100, 22.1, '[[30.265, -97.725], [30.265, -97.695], [30.235, -97.695], [30.235, -97.725]]'::jsonb),
('D-04', 'West Heights', 72000, 30.2800, -97.8000, 34.2, '[[30.295, -97.815], [30.295, -97.785], [30.265, -97.785], [30.265, -97.815]]'::jsonb),
('D-05', 'South Suburbs', 108000, 30.2100, -97.7600, 31.0, '[[30.225, -97.775], [30.225, -97.745], [30.195, -97.745], [30.195, -97.775]]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 2. Seed Default Users
INSERT INTO public.users (email, full_name, hashed_password, role)
VALUES
('admin@citypulse.gov', 'City Administrator', 'pbkdf2_sha256$citypulse-secret$87dbfdc777e5d85265451bfd4eb1e679a957d195c6f62f3fef8c728e5dbdbcd9', 'admin'),
('operator@citypulse.gov', 'Ops Lead Specialist', 'pbkdf2_sha256$citypulse-secret$87dbfdc777e5d85265451bfd4eb1e679a957d195c6f62f3fef8c728e5dbdbcd9', 'operator'),
('viewer@citypulse.gov', 'Public View Inspector', 'pbkdf2_sha256$citypulse-secret$87dbfdc777e5d85265451bfd4eb1e679a957d195c6f62f3fef8c728e5dbdbcd9', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- 3. Seed Utilities Assets
INSERT INTO public.utilities_assets (district_id, name, asset_type, status, electricity_mw, water_pressure_psi, water_flow_gpm, gas_pressure_bar, waste_fill_pct)
VALUES
(1, 'Downtown Central Regional Utility Hub', 'power_grid', 'Normal', 145.0, 62.5, 3800.0, 4.15, 45.0),
(2, 'Northside Tech Corridor Regional Utility Hub', 'power_grid', 'Normal', 170.0, 64.0, 4300.0, 4.20, 52.0),
(3, 'East Riverfront Regional Utility Hub', 'power_grid', 'Critical', 195.0, 28.2, 6800.0, 4.10, 68.0),
(4, 'West Heights Regional Utility Hub', 'power_grid', 'Normal', 220.0, 68.5, 5300.0, 4.25, 38.0),
(5, 'South Suburbs Regional Utility Hub', 'power_grid', 'Normal', 245.0, 71.0, 5800.0, 4.30, 41.0)
ON CONFLICT DO NOTHING;

-- 4. Seed Traffic Corridors
INSERT INTO public.traffic_corridors (district_id, name, start_location, end_location, speed_mph, flow_veh_hr, congestion_index, incident_active)
VALUES
(1, 'Downtown Central Express Arterial', 'North D-01', 'South D-01', 38.5, 1350, 28.0, false),
(2, 'Northside Tech Corridor Express Arterial', 'North D-02', 'South D-02', 14.2, 1850, 84.5, true),
(3, 'East Riverfront Express Arterial', 'North D-03', 'South D-03', 42.0, 1100, 22.0, false),
(4, 'West Heights Express Arterial', 'North D-04', 'South D-04', 44.5, 950, 18.0, false),
(5, 'South Suburbs Express Arterial', 'North D-05', 'South D-05', 40.0, 1250, 32.0, false)
ON CONFLICT DO NOTHING;

-- 5. Seed Public Transit Vehicles
INSERT INTO public.public_transit_vehicles (district_id, route_name, vehicle_type, vehicle_code, delay_minutes, ridership_count, health_score, status)
VALUES
(1, 'Metro Route 14', 'bus', 'BUS-109', 1.5, 42, 94.0, 'On Time'),
(2, 'Metro Route 24', 'bus', 'BUS-209', 12.8, 88, 76.0, 'Severely Delayed'),
(3, 'Metro Route 34', 'bus', 'BUS-309', 2.1, 35, 96.0, 'On Time'),
(4, 'Metro Route 44', 'bus', 'BUS-409', 0.8, 29, 98.0, 'On Time'),
(5, 'Metro Route 54', 'bus', 'BUS-509', 3.5, 51, 91.0, 'On Time')
ON CONFLICT (vehicle_code) DO NOTHING;

-- 6. Seed Infrastructure Assets
INSERT INTO public.infrastructure_assets (district_id, name, asset_type, location_description, lat, lng, condition_score, risk_level, estimated_days_to_failure, maintenance_status)
VALUES
(1, 'Congress Ave Bridge', 'bridge', 'Downtown Central Main River Crossing', 30.263, -97.744, 52.0, 'High', 193, 'Operational'),
(2, 'I-35 Elevated Highway Corridor', 'road', 'Northside Expressway Link', 30.370, -97.728, 41.5, 'Critical', 97, 'Scheduled'),
(3, 'Lamar Blvd Pavement Segment 4', 'road', 'West Heights Commercial Corridor', 30.282, -97.795, 78.0, 'Medium', 408, 'Operational'),
(4, 'East Side Pumping Station & Reservoir', 'building', 'Riverfront Water Treatment Plant', 30.252, -97.705, 88.0, 'Low', 493, 'Operational'),
(5, 'Smart LED Streetlight Grid Zone A', 'streetlight', 'Downtown Central Night Vision Grid', 30.269, -97.741, 94.0, 'Low', 544, 'Operational')
ON CONFLICT DO NOTHING;

-- 7. Seed Initial Alerts
INSERT INTO public.alerts (alert_code, domain, district_id, severity, title, description, root_cause_hint)
VALUES
('ALT-2026-001', 'utilities', 3, 'Critical', 'Severe Water Main Pressure Drop', 'Main distribution pipeline in East Riverfront registered a 55% pressure drop (28.2 PSI) with an abnormal flow surge.', 'Possible underground main pipe fracture near Riverfront Substation.'),
('ALT-2026-002', 'transportation', 2, 'Warning', 'I-35 Expressway Bottleneck', 'Severe traffic congestion index reached 88% due to lane disruption.', 'Single vehicle stalled at Exit 234.')
ON CONFLICT (alert_code) DO NOTHING;

-- 8. Seed Emergency Units
INSERT INTO public.emergency_units (district_id, unit_code, unit_type, status, avg_response_time_min, active_incidents_count)
VALUES
(1, 'POL-UNIT-11', 'Police', 'Available', 5.1, 0),
(1, 'FIR-UNIT-11', 'Fire', 'Available', 4.8, 0),
(1, 'EMS-UNIT-11', 'EMS', 'Available', 4.2, 0),
(2, 'POL-UNIT-21', 'Police', 'Dispatched', 5.8, 1),
(3, 'EMS-UNIT-31', 'EMS', 'Dispatched', 4.1, 1)
ON CONFLICT (unit_code) DO NOTHING;

-- 9. Seed Sample 311 Requests
INSERT INTO public.service_requests_311 (request_number, title, category, description, district_id, lat, lng, priority, status, sla_hours)
VALUES
('REQ-311-20260729-101', 'Citizen Report: Pothole Repair near District #1', 'Pothole Repair', 'Deep pothole reported near Congress Ave intersection.', 1, 30.2672, -97.7431, 'High', 'Open', 72),
('REQ-311-20260729-102', 'Citizen Report: Water Leak near District #3', 'Water Leak', 'Water leaking onto sidewalk near East Riverfront plant.', 3, 30.2500, -97.7100, 'Urgent', 'Open', 12)
ON CONFLICT (request_number) DO NOTHING;
