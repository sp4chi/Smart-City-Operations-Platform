import axios from 'axios';

const formatApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL;
  
  if (!url) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      url = 'https://citypulse-backend-uyye.onrender.com/api';
    } else {
      url = 'http://localhost:8000/api';
    }
  }
  
  // Ensure http/https protocol prefix
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  // Ensure /api suffix
  if (!url.endsWith('/api')) {
    url = `${url.replace(/\/$/, '')}/api`;
  }
  
  return url;
};

export const API_BASE_URL = formatApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor attaching JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('citypulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (email: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  
  const res = await axios.post(`${API_BASE_URL}/auth/login`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return res.data;
};

export const registerUser = async (data: { email: string; full_name: string; password: string; role: string }) => {
  const res = await axios.post(`${API_BASE_URL}/auth/register`, data);
  return res.data;
};

export const fetchDashboardOverview = async () => {
  const res = await api.get('/dashboard/overview');
  return res.data;
};

export const fetchAlertsFeed = async (domain?: string, severity?: string) => {
  const res = await api.get('/dashboard/alerts', { params: { domain, severity } });
  return res.data;
};

export const fetchUtilitiesStatus = async (districtId?: number) => {
  const res = await api.get('/utilities/status', { params: { district_id: districtId } });
  return res.data;
};

export const fetchUtilitiesForecast = async (metric = 'electricity_mw', districtId = 1, hours = 24) => {
  const res = await api.get('/utilities/forecast', {
    params: { metric, district_id: districtId, hours }
  });
  return res.data;
};

export const fetchUtilitiesAnomalies = async (districtId = 1) => {
  const res = await api.get('/utilities/anomalies', { params: { district_id: districtId } });
  return res.data;
};

export const createUtilityTicket = async (data: { asset_id: number; district_id: number; title: string; description: string; priority: string }) => {
  const res = await api.post('/utilities/tickets/create', data);
  return res.data;
};

export const fetchTrafficCorridors = async (districtId?: number) => {
  const res = await api.get('/transportation/corridors', { params: { district_id: districtId } });
  return res.data;
};

export const fetchTransitVehicles = async (districtId?: number) => {
  const res = await api.get('/transportation/transit', { params: { district_id: districtId } });
  return res.data;
};

export const fetchParkingOccupancy = async () => {
  const res = await api.get('/transportation/parking');
  return res.data;
};

export const fetch311Requests = async (status?: string, districtId?: number) => {
  const res = await api.get('/public-services/311/requests', { params: { status, district_id: districtId } });
  return res.data;
};

export const create311Request = async (data: { title: string; category: string; description: string; district_id: number; lat: number; lng: number; priority: string }) => {
  const res = await api.post('/public-services/311/create', data);
  return res.data;
};

export const fetchEmergencyUnits = async (districtId?: number) => {
  const res = await api.get('/public-services/emergency/units', { params: { district_id: districtId } });
  return res.data;
};

export const fetchInfrastructureAssets = async (districtId?: number, riskLevel?: string, assetType?: string) => {
  const res = await api.get('/infrastructure/assets', { params: { district_id: districtId, risk_level: riskLevel, asset_type: assetType } });
  return res.data;
};

export const scheduleInfrastructureMaintenance = async (data: { asset_id: number; title: string; priority: string; estimated_cost: number }) => {
  const res = await api.post('/infrastructure/maintenance/schedule', data);
  return res.data;
};

export const queryAIAssistant = async (prompt: string) => {
  const res = await api.post('/ai/chat', { prompt });
  return res.data;
};

export const fetchAIIncidentSummaries = async () => {
  const res = await api.get('/ai/incidents/summary');
  return res.data;
};
