import React, { useState, useEffect } from 'react';
import { fetchDashboardOverview } from '../services/api';
import type { OverviewKPIs } from '../types';
import { useApp } from '../context/AppContext';
import { KpiCard } from '../components/KpiCard';
import { DistrictMap } from '../components/DistrictMap';
import { Activity, ShieldAlert, Zap, Bus, Users, Wrench, Clock, ArrowRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { setActiveTab, selectedDistrictId, lastLiveEvent } = useApp();
  const [data, setData] = useState<OverviewKPIs | null>(null);

  const loadData = async () => {
    try {
      const overview = await fetchDashboardOverview();
      setData(overview);
    } catch (e) {
      console.error('Error fetching dashboard overview:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (lastLiveEvent) {
      loadData();
    }
  }, [lastLiveEvent]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm gap-2">
        <Activity className="w-5 h-5 animate-spin text-cyan-400" />
        Connecting to CityPulse Centralized Operations Engine...
      </div>
    );
  }

  const filteredDistricts = selectedDistrictId
    ? data.districts.filter((d) => d.id === selectedDistrictId)
    : data.districts;

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950/40">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            City-Wide Operational Command Center
            {selectedDistrictId && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Filtered: District #{selectedDistrictId}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            Real-time IoT telemetry, ML anomaly scoring, and public safety monitoring across 5 municipal districts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">City Health Score</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {data.city_health_pct}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-950/40 text-emerald-400 font-bold text-xs">
            Nominal
          </div>
        </div>
      </div>

      {/* Primary Cross-Domain KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Alerts"
          value={data.active_alerts_count}
          unit="unresolved"
          icon={ShieldAlert}
          status={data.critical_alerts_count > 0 ? 'Critical' : 'Normal'}
          subtitle={`${data.critical_alerts_count} Critical, ${data.active_alerts_count - data.critical_alerts_count} Warning`}
          colorScheme={data.critical_alerts_count > 0 ? 'rose' : 'emerald'}
        />

        <KpiCard
          title="Power Grid Demand"
          value={data.total_power_mw}
          unit="MW"
          icon={Zap}
          subtitle={`Avg Water Pressure: ${data.avg_water_psi} PSI`}
          colorScheme="cyan"
        />

        <KpiCard
          title="Traffic Congestion"
          value={data.avg_traffic_congestion_pct}
          unit="%"
          icon={Bus}
          subtitle="City-wide corridor average speed 36.2 MPH"
          colorScheme="amber"
        />

        <KpiCard
          title="Emergency Response"
          value={data.avg_emergency_response_min}
          unit="mins avg"
          icon={Clock}
          subtitle={`${data.open_311_requests} open 311 citizen tickets`}
          colorScheme="indigo"
        />
      </div>

      {/* Main Grid: Leaflet Map (Left) + Domain Modules & Quick Feeds (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[550px]">
        {/* District GIS Map View */}
        <div className="lg:col-span-8 h-full space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Municipal District GIS Telemetry Map
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              5 Districts • Real-Time Spatial Heatmap
            </span>
          </div>
          <div className="flex-1 h-full min-h-[480px]">
            <DistrictMap districts={filteredDistricts} alerts={data.recent_alerts} />
          </div>
        </div>

        {/* Domain Navigation & Recent Alerts Drawer */}
        <div className="lg:col-span-4 h-full flex flex-col space-y-4">
          {/* Domain Quick Launch Cards */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Core Municipal Domains
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('utilities')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 group transition-all"
              >
                <div className="flex items-center justify-between text-cyan-400">
                  <Zap className="w-4 h-4" />
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-bold text-xs text-slate-200">Utilities</div>
                <div className="text-[10px] text-slate-400">{data.total_power_mw} MW Load</div>
              </button>

              <button
                onClick={() => setActiveTab('transportation')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 group transition-all"
              >
                <div className="flex items-center justify-between text-amber-400">
                  <Bus className="w-4 h-4" />
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-bold text-xs text-slate-200">Transportation</div>
                <div className="text-[10px] text-slate-400">{data.avg_traffic_congestion_pct}% Congestion</div>
              </button>

              <button
                onClick={() => setActiveTab('public_services')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 group transition-all"
              >
                <div className="flex items-center justify-between text-indigo-400">
                  <Users className="w-4 h-4" />
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-bold text-xs text-slate-200">Public Services</div>
                <div className="text-[10px] text-slate-400">{data.open_311_requests} Open 311</div>
              </button>

              <button
                onClick={() => setActiveTab('infrastructure')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 group transition-all"
              >
                <div className="flex items-center justify-between text-emerald-400">
                  <Wrench className="w-4 h-4" />
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-bold text-xs text-slate-200">Infrastructure</div>
                <div className="text-[10px] text-slate-400">{data.high_risk_infra_count} High Risk</div>
              </button>
            </div>
          </div>

          {/* Active Alerts Panel */}
          <div className="glass-card p-4 flex-1 flex flex-col justify-between space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Recent Alerts Feed
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono font-bold">
                {data.recent_alerts.length} Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {data.recent_alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">{alert.title}</span>
                    <span className={alert.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{alert.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('utilities')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              View Full Domain Diagnostics
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
