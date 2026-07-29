import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { District, Alert } from '../types';
import { useApp } from '../context/AppContext';

// Custom Leaflet Icons using SVG Data URIs
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

interface DistrictMapProps {
  districts: District[];
  alerts?: Alert[];
}

export const DistrictMap: React.FC<DistrictMapProps> = ({ districts }) => {
  const { selectedDistrictId, setSelectedDistrictId } = useApp();

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

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden glass-card">
      <MapContainer
        center={[30.2672, -97.7431]}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {districts.map((district) => {
          const isSelected = selectedDistrictId === district.id;
          const color = getDistrictColor(district.status);

          return (
            <React.Fragment key={district.id}>
              {/* Polygon Boundary */}
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

              {/* Center Marker */}
              <Marker
                position={[district.lat, district.lng]}
                icon={district.status === 'Critical' ? redIcon : district.status === 'Warning' ? yellowIcon : greenIcon}
              >
                <Popup>
                  <div className="text-xs font-semibold">{district.name} Center Node</div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 glass-card bg-slate-950/90 p-2.5 rounded-lg text-xs space-y-1.5 border border-slate-800">
        <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1">
          District Status Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 text-[11px]">Normal Operations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-300 text-[11px]">Warning / Alert Flags</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-slate-300 text-[11px]">Critical Anomaly Event</span>
        </div>
      </div>
    </div>
  );
};
