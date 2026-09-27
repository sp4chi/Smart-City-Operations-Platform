import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { District, Alert, TransitVehicle, EmergencyUnit, InfrastructureAsset } from '../types';
import { useApp } from '../context/AppContext';
import {
  fetchTransitVehicles,
  fetchEmergencyUnits,
  dispatchEmergencyUnit,
  recallEmergencyUnit,
  fetchInfrastructureAssets,
} from '../services/api';
import { IncidentPlaybookModal } from './IncidentPlaybookModal';
import { Bus, Radio, ShieldAlert, Layers, Zap, CheckCircle2, Wrench, Flame } from 'lucide-react';

// Custom Leaflet District Center Icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 12px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const greenIcon = createCustomIcon('#10b981');
const yellowIcon = createCustomIcon('#f59e0b');
const redIcon = createCustomIcon('#f43f5e');

// Custom Vehicle & Emergency Unit Icons
const createVehicleIcon = (status: string) => {
  const isDelayed = status.toLowerCase().includes('delay');
  const bg = isDelayed ? '#f59e0b' : '#06b6d4';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `<div style="background-color: ${bg}; width: 22px; height: 22px; border-radius: 6px; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${bg}; font-size: 11px; cursor: pointer;">🚌</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const createEmergencyIcon = (unitType: string, status: string) => {
  const isDispatched = status === 'Dispatched';
  const color = unitType === 'Fire' ? '#ef4444' : unitType === 'Police' ? '#3b82f6' : '#10b981';
  const emoji = unitType === 'Fire' ? '🚒' : unitType === 'Police' ? '🚓' : '🚑';
  return L.divIcon({
    className: 'custom-emergency-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${isDispatched ? `<div style="position: absolute; inset: -3px; border-radius: 50%; background-color: ${color}; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="position: relative; background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color}; font-size: 11px;">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createAlertIcon = (severity: string) => {
  const color = severity === 'Critical' ? '#f43f5e' : '#f59e0b';
  return L.divIcon({
    className: 'custom-alert-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${color}; font-size: 12px; cursor: pointer; animation: pulse 2s infinite;">⚠️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createInfraIcon = (type: string, risk: string) => {
  const color = risk === 'Critical' ? '#f43f5e' : risk === 'High' ? '#f97316' : risk === 'Medium' ? '#f59e0b' : '#10b981';
  const emoji = type === 'bridge' ? '🌉' : type === 'road' ? '🛣️' : type === 'building' ? '🏭' : '💡';
  return L.divIcon({
    className: 'custom-infra-marker',
    html: `<div style="background-color: #090d16; width: 24px; height: 24px; border-radius: 7px; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color}80; font-size: 11px; cursor: pointer;">${emoji}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface DistrictMapProps {
  districts: District[];
  alerts?: Alert[];
}

export const DistrictMap: React.FC<DistrictMapProps> = ({ districts, alerts = [] }) => {
  const { selectedDistrictId, setSelectedDistrictId, lastLiveEvent, userRole } = useApp();

  // Layer toggles
  const [showTransit, setShowTransit] = useState<boolean>(true);
  const [showEmergency, setShowEmergency] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showInfra, setShowInfra] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [basemapMode, setBasemapMode] = useState<'dark' | 'satellite'>('dark');
  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;

  // Live vehicles, emergency units, and infrastructure assets
  const [transitVehicles, setTransitVehicles] = useState<TransitVehicle[]>([]);
  const [emergencyUnits, setEmergencyUnits] = useState<EmergencyUnit[]>([]);
  const [infraAssets, setInfraAssets] = useState<InfrastructureAsset[]>([]);

  // Selected alert for Playbook modal from map
  const [mapPlaybookAlert, setMapPlaybookAlert] = useState<Alert | null>(null);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState<boolean>(false);

  const loadLiveTelemetry = async () => {
    try {
      const [tData, eData, iData] = await Promise.all([
        fetchTransitVehicles(selectedDistrictId || undefined),
        fetchEmergencyUnits(selectedDistrictId || undefined),
        fetchInfrastructureAssets(selectedDistrictId || undefined),
      ]);
      setTransitVehicles(tData);
      setEmergencyUnits(eData);
      setInfraAssets(iData);
    } catch (err) {
      console.error('Error loading map telemetry:', err);
    }
  };

  useEffect(() => {
    loadLiveTelemetry();
  }, [selectedDistrictId]);

  useEffect(() => {
    if (lastLiveEvent) {
      loadLiveTelemetry();
    }
  }, [lastLiveEvent]);

  const getDistrictColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return '#f43f5e';
      case 'Warning':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const handleToggleUnitStatus = async (unit: EmergencyUnit) => {
    try {
      if (unit.status === 'Dispatched') {
        await recallEmergencyUnit(unit.id);
      } else {
        await dispatchEmergencyUnit(unit.id);
      }
      loadLiveTelemetry();
    } catch (err) {
      console.error('Failed to toggle unit status:', err);
    }
  };

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden glass-card">
      {/* Top Right Map Layer Controls */}
      <div className="absolute top-3 right-3 z-10 glass-card bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-1 shadow-xl max-w-[95%]">
        <button
          onClick={() => setShowTransit(!showTransit)}
          className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            showTransit
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Transit Bus & Rail Markers"
        >
          <Bus className="w-3.5 h-3.5" />
          <span>Transit ({transitVehicles.length})</span>
        </button>

        <button
          onClick={() => setShowEmergency(!showEmergency)}
          className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            showEmergency
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Police, Fire & EMS Emergency Markers"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Emergency ({emergencyUnits.length})</span>
        </button>

        <button
          onClick={() => setShowIncidents(!showIncidents)}
          className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            showIncidents
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Active Incident Hotspots"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Incidents ({alerts.length})</span>
        </button>

        <button
          onClick={() => setShowInfra(!showInfra)}
          className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            showInfra
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Physical Infrastructure Assets (Bridges, Power, Water)"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Infra ({infraAssets.length})</span>
        </button>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            showHeatmap
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle District Sensor Strain Heatmap"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Strain Heatmap</span>
        </button>

        <button
          onClick={() => setBasemapMode(basemapMode === 'dark' ? 'satellite' : 'dark')}
          className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            basemapMode === 'satellite'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Satellite Imagery / Dark Gray GIS Basemap"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{basemapMode === 'dark' ? 'Satellite' : 'Dark Canvas'}</span>
        </button>
      </div>

      <MapContainer
        center={[30.2672, -97.7431]}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* Basemap Tile Layer */}
        {basemapMode === 'satellite' ? (
          <>
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
              url="https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </>
        ) : cartoApiKey ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`}
            maxZoom={19}
          />
        ) : (
          <>
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
              url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
              url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
          </>
        )}

        {/* 1. District Polygons & Strain Heatmaps */}
        {districts.map((district) => {
          const isSelected = selectedDistrictId === district.id;
          const color = getDistrictColor(district.status);

          return (
            <React.Fragment key={district.id}>
              {district.bounds && (
                <Polygon
                  positions={district.bounds as [number, number][]}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.35 : 0.15,
                    weight: isSelected ? 3 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => setSelectedDistrictId(district.id),
                  }}
                >
                  <Popup>
                    <div className="space-y-2 p-1 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-sm">{district.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          district.status === 'Critical' ? 'bg-rose-950 text-rose-400' :
                          district.status === 'Warning' ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'
                        }`}>
                          {district.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p>Code: <span className="font-mono text-cyan-400">{district.code}</span></p>
                        <p>Population: <span className="font-semibold text-slate-200">{district.population.toLocaleString()}</span></p>
                        <p>Active Alerts: <span className="font-semibold text-rose-400">{district.active_alert_count}</span></p>
                      </div>
                      <button
                        onClick={() => setSelectedDistrictId(district.id)}
                        className="w-full mt-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded transition-all"
                      >
                        Filter Operations View
                      </button>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* Strain Heatmap Overlay Circle */}
              {showHeatmap && (
                <Circle
                  center={[district.lat, district.lng]}
                  radius={district.status === 'Critical' ? 2400 : district.status === 'Warning' ? 1800 : 1200}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: district.status === 'Critical' ? 0.35 : 0.2,
                    weight: 1,
                  }}
                />
              )}

              {/* District Center Node */}
              <Marker
                position={[district.lat, district.lng]}
                icon={district.status === 'Critical' ? redIcon : district.status === 'Warning' ? yellowIcon : greenIcon}
              >
                <Popup>
                  <div className="text-xs font-semibold p-1">
                    <p className="font-bold text-slate-200">{district.name} Center Node</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Telemetry Hub & Municipal Gateway</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 2. Live Transit Vehicles Layer */}
        {showTransit && transitVehicles.map((vehicle) => {
          if (!vehicle.lat || !vehicle.lng) return null;
          return (
            <Marker
              key={`transit-${vehicle.id}`}
              position={[vehicle.lat, vehicle.lng]}
              icon={createVehicleIcon(vehicle.status)}
            >
              <Popup>
                <div className="space-y-1.5 p-1 min-w-[210px] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-cyan-400" />
                      {vehicle.vehicle_code}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      vehicle.status.toLowerCase().includes('delay')
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>
                  <div className="text-slate-300 space-y-1 text-[11px]">
                    <p>Route: <strong className="text-white">{vehicle.route_name}</strong></p>
                    <p>District: <span className="text-cyan-300">{vehicle.district_name}</span></p>
                    <p>Delay: <span className={vehicle.delay_minutes > 5 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{vehicle.delay_minutes.toFixed(1)} mins</span></p>
                    <p>Ridership: <span className="font-mono text-slate-200">{vehicle.ridership_count} passengers</span></p>
                    <p>Fleet Health: <span className="text-emerald-400 font-semibold">{vehicle.health_score.toFixed(1)}%</span></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Live Emergency Response Units Layer */}
        {showEmergency && emergencyUnits.map((unit) => {
          if (!unit.lat || !unit.lng) return null;
          return (
            <Marker
              key={`emergency-${unit.id}`}
              position={[unit.lat, unit.lng]}
              icon={createEmergencyIcon(unit.unit_type, unit.status)}
            >
              <Popup>
                <div className="space-y-2 p-1 min-w-[210px] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-rose-400" />
                      {unit.unit_code}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      unit.status === 'Dispatched'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {unit.status}
                    </span>
                  </div>
                  <div className="text-slate-300 space-y-1 text-[11px]">
                    <p>Unit Type: <strong className="text-white">{unit.unit_type}</strong></p>
                    <p>District: <span className="text-cyan-300">{unit.district_name}</span></p>
                    <p>Average ETA: <span className="font-mono text-emerald-400 font-bold">{unit.avg_response_time_min.toFixed(1)} mins</span></p>
                    <p>Active Incidents: <span className="font-semibold text-rose-400">{unit.active_incidents_count}</span></p>
                  </div>
                  {userRole !== 'viewer' && (
                    <button
                      onClick={() => handleToggleUnitStatus(unit)}
                      className={`w-full py-1.5 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        unit.status === 'Dispatched'
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      {unit.status === 'Dispatched' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Recall to Station
                        </>
                      ) : (
                        <>
                          <Radio className="w-3 h-3" />
                          Rapid Dispatch
                        </>
                      )}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Infrastructure Assets Layer */}
        {showInfra && infraAssets.map((asset) => {
          if (!asset.lat || !asset.lng) return null;
          return (
            <Marker
              key={`infra-${asset.id}`}
              position={[asset.lat, asset.lng]}
              icon={createInfraIcon(asset.asset_type, asset.risk_level)}
            >
              <Popup>
                <div className="space-y-1.5 p-1 min-w-[210px] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{asset.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      asset.risk_level === 'Critical'
                        ? 'bg-rose-950 text-rose-300'
                        : asset.risk_level === 'High'
                        ? 'bg-orange-950 text-orange-300'
                        : asset.risk_level === 'Medium'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {asset.risk_level} Risk
                    </span>
                  </div>
                  <div className="text-slate-300 space-y-1 text-[11px]">
                    <p>Type: <strong className="text-white uppercase">{asset.asset_type}</strong></p>
                    <p>District: <span className="text-cyan-300">{asset.district_name}</span></p>
                    <p>Condition Score: <strong className="text-emerald-400 font-mono">{asset.condition_score.toFixed(1)}/100</strong></p>
                    <p>Est Failure: <span className="font-mono text-amber-400 font-semibold">{asset.estimated_days_to_failure} days</span></p>
                    <p className="text-[10px] text-slate-400 italic pt-1">{asset.location_description}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 5. Incident Hotspots Layer */}
        {showIncidents && alerts.map((alert) => {
          const district = districts.find((d) => d.id === alert.district_id);
          if (!district) return null;
          const lat = district.lat + ((alert.id * 5) % 7 - 3) * 0.003;
          const lng = district.lng + ((alert.id * 11) % 7 - 3) * 0.003;
          return (
            <Marker
              key={`alert-${alert.id}`}
              position={[lat, lng]}
              icon={createAlertIcon(alert.severity)}
            >
              <Popup>
                <div className="space-y-2 p-1 min-w-[220px] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{alert.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      alert.severity === 'Critical'
                        ? 'bg-rose-950 text-rose-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{alert.description}</p>
                  {alert.root_cause_hint && (
                    <div className="p-1.5 bg-slate-900 rounded text-[10px] text-amber-300">
                      <strong>Hint:</strong> {alert.root_cause_hint}
                    </div>
                  )}
                  {userRole !== 'viewer' && (
                    <button
                      onClick={() => {
                        setMapPlaybookAlert(alert);
                        setIsPlaybookOpen(true);
                      }}
                      className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow"
                    >
                      <Zap className="w-3 h-3" />
                      Trigger Incident Playbook
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 glass-card bg-slate-950/90 p-2.5 rounded-xl text-xs space-y-1.5 border border-slate-800">
        <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Live Telemetry Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 text-[11px]">Normal Operations / EMS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-300 text-[11px]">Warning / Delayed Bus</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-slate-300 text-[11px]">Critical Incident / Fire Dept</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span className="text-slate-300 text-[11px]">Police Unit Patrol</span>
        </div>
      </div>

      {/* Map Incident Playbook Modal */}
      <IncidentPlaybookModal
        alert={mapPlaybookAlert}
        isOpen={isPlaybookOpen}
        onClose={() => {
          setIsPlaybookOpen(false);
          setMapPlaybookAlert(null);
        }}
        onExecuted={() => {
          loadLiveTelemetry();
        }}
      />
    </div>
  );
};
