export type UserRole = 'admin' | 'operator' | 'viewer';

export interface District {
  id: number;
  code: string;
  name: string;
  population: number;
  lat: number;
  lng: number;
  bounds: number[][];
  status: 'Normal' | 'Warning' | 'Critical';
  active_alert_count: number;
}

export interface Alert {
  id: number;
  code: string;
  domain: 'utilities' | 'transportation' | 'public_services' | 'infrastructure';
  district_id: number;
  severity: 'Info' | 'Warning' | 'Critical';
  title: string;
  description: string;
  root_cause_hint?: string;
  created_at: string;
}

export interface OverviewKPIs {
  city_health_pct: number;
  total_population: number;
  active_alerts_count: number;
  critical_alerts_count: number;
  open_311_requests: number;
  total_power_mw: number;
  avg_water_psi: number;
  avg_traffic_congestion_pct: number;
  high_risk_infra_count: number;
  avg_emergency_response_min: number;
  districts: District[];
  recent_alerts: Alert[];
}

export interface UtilityAsset {
  id: number;
  district_id: number;
  district_name: string;
  name: string;
  asset_type: string;
  status: string;
  electricity_mw: number;
  water_pressure_psi: number;
  water_flow_gpm: number;
  gas_pressure_bar: number;
  waste_fill_pct: number;
  last_updated: string;
}

export interface TrafficCorridor {
  id: number;
  district_id: number;
  district_name: string;
  name: string;
  start_location: string;
  end_location: string;
  speed_mph: number;
  flow_veh_hr: number;
  congestion_index: number;
  incident_active: boolean;
  last_updated: string;
}

export interface TransitVehicle {
  id: number;
  district_id: number;
  district_name: string;
  route_name: string;
  vehicle_type: string;
  vehicle_code: string;
  delay_minutes: number;
  ridership_count: number;
  health_score: number;
  status: string;
  last_updated: string;
}

export interface ServiceRequest311 {
  id: number;
  request_number: string;
  title: string;
  category: string;
  description: string;
  district_id: number;
  district_name: string;
  lat: number;
  lng: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved';
  sla_hours: number;
  created_at: string;
}

export interface EmergencyUnit {
  id: number;
  district_id: number;
  district_name: string;
  unit_code: string;
  unit_type: 'Police' | 'Fire' | 'EMS';
  status: 'Available' | 'Dispatched' | 'On Scene';
  avg_response_time_min: number;
  active_incidents_count: number;
  last_updated: string;
}

export interface InfrastructureAsset {
  id: number;
  district_id: number;
  district_name: string;
  name: string;
  asset_type: 'road' | 'bridge' | 'building' | 'streetlight';
  location_description: string;
  lat: number;
  lng: number;
  condition_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  estimated_days_to_failure: number;
  maintenance_status: string;
  last_inspection_date: string;
  ml_risk_eval: {
    failure_probability_pct: number;
    risk_category: string;
    recommended_action: string;
    factors: {
      score_impact: string;
      asset_age_impact: string;
      inspection_lag_impact: string;
    };
  };
}

export interface ForecastResponse {
  metric_name: string;
  district_id: number;
  historical_count: number;
  timestamps: string[];
  forecast: number[];
  lower_bound: number[];
  upper_bound: number[];
  method: string;
  mean_baseline: number;
}
