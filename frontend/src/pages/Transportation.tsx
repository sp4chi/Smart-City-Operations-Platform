import React, { useState, useEffect } from 'react';
import { fetchTrafficCorridors, fetchTransitVehicles, fetchParkingOccupancy } from '../services/api';
import type { TrafficCorridor, TransitVehicle } from '../types';
import { KpiCard } from '../components/KpiCard';
import { useApp } from '../context/AppContext';
import { Bus, Car, ParkingSquare, AlertTriangle, Gauge } from 'lucide-react';

export const Transportation: React.FC = () => {
  const { selectedDistrictId } = useApp();
  const [corridors, setCorridors] = useState<TrafficCorridor[]>([]);
  const [transit, setTransit] = useState<TransitVehicle[]>([]);
  const [parking, setParking] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const corrData = await fetchTrafficCorridors(selectedDistrictId || undefined);
      const transitData = await fetchTransitVehicles(selectedDistrictId || undefined);
      const parkData = await fetchParkingOccupancy();
      setCorridors(corrData);
      setTransit(transitData);
      setParking(parkData);
    } catch (e) {
      console.error('Error loading transportation data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrictId]);

  const avgSpeed = corridors.length
    ? (corridors.reduce((acc, c) => acc + c.speed_mph, 0) / corridors.length).toFixed(1)
    : 36.2;
  const avgCongestion = corridors.length
    ? (corridors.reduce((acc, c) => acc + c.congestion_index, 0) / corridors.length).toFixed(1)
    : 28.0;

  return (
    <div className="p-6 space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-400" />
            Transportation & Public Transit Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Real-time traffic flow speeds, corridor bottlenecks, transit fleet delays, and garage parking occupancy
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Avg Corridor Speed"
          value={avgSpeed}
          unit="MPH"
          icon={Gauge}
          subtitle="Baseline arterial limit 45.0 MPH"
          colorScheme="emerald"
        />

        <KpiCard
          title="Congestion Index"
          value={avgCongestion}
          unit="%"
          icon={Car}
          status={Number(avgCongestion) > 50 ? 'Warning' : 'Normal'}
          subtitle="Rush hour volume multipliers active"
          colorScheme="amber"
        />

        <KpiCard
          title="Transit Fleet On-Time"
          value="94.2"
          unit="%"
          icon={Bus}
          subtitle={`${transit.length} active routes tracked`}
          colorScheme="cyan"
        />

        <KpiCard
          title="Parking Occupancy"
          value={parking.length ? (parking.reduce((acc, p) => acc + p.occupancy_pct, 0) / parking.length).toFixed(1) : 68.4}
          unit="%"
          icon={ParkingSquare}
          subtitle="5 Municipal Garages Monitored"
          colorScheme="indigo"
        />
      </div>

      {/* Traffic Corridors Grid */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
          <span>Arterial Traffic Corridors & Congestion Gauges</span>
          <span className="text-xs text-slate-400">{corridors.length} Major Corridors</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corridors.map((corridor) => (
            <div
              key={corridor.id}
              className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                corridor.incident_active
                  ? 'bg-rose-950/40 border-rose-500/40'
                  : corridor.congestion_index > 50
                  ? 'bg-amber-950/40 border-amber-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{corridor.name}</h4>
                  <p className="text-[11px] text-slate-400">District: {corridor.district_name}</p>
                </div>
                <span className={corridor.incident_active ? 'badge-critical' : corridor.congestion_index > 50 ? 'badge-warning' : 'badge-normal'}>
                  {corridor.incident_active ? 'Collision Incident' : corridor.congestion_index > 50 ? 'Heavy Congestion' : 'Flowing'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 bg-slate-950/80 rounded-lg p-2 text-center border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">Speed</span>
                  <span className="font-bold text-cyan-400 text-xs font-mono">{corridor.speed_mph} MPH</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Flow</span>
                  <span className="font-bold text-slate-200 text-xs font-mono">{corridor.flow_veh_hr} v/h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Congestion</span>
                  <span className={`font-bold text-xs font-mono ${corridor.congestion_index > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {corridor.congestion_index}%
                  </span>
                </div>
              </div>

              {corridor.incident_active && (
                <div className="p-2 bg-rose-950/80 rounded border border-rose-500/30 text-[11px] text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  Route Impact: Diverting traffic via parallel corridors.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transit Fleet & Parking Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transit Fleet Health */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span>Public Transit Performance & Delays</span>
            <span className="text-xs text-slate-400">{transit.length} Fleet Vehicles</span>
          </h3>

          <div className="space-y-2.5">
            {transit.map((t) => (
              <div key={t.id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">{t.route_name} ({t.vehicle_code})</div>
                  <div className="text-[11px] text-slate-400">Ridership: {t.ridership_count} passengers</div>
                </div>
                <div className="text-right space-y-0.5">
                  <span className={`font-mono font-bold text-xs ${t.delay_minutes > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    +{t.delay_minutes} mins delay
                  </span>
                  <div className="text-[10px] text-slate-400">Health: {t.health_score}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Garage Parking Occupancy */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span>Municipal Parking Occupancy</span>
            <span className="text-xs text-slate-400">Real-Time Sensor Feeds</span>
          </h3>

          <div className="space-y-3">
            {parking.map((p) => (
              <div key={p.garage_id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{p.name}</span>
                  <span className="font-mono text-cyan-400 font-bold">{p.occupied_spots} / {p.total_capacity} spots</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      p.occupancy_pct > 85 ? 'bg-rose-500' : p.occupancy_pct > 65 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${p.occupancy_pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
