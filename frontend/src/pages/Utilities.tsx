import React, { useState, useEffect } from 'react';
import { fetchUtilitiesStatus, fetchUtilitiesForecast, createUtilityTicket } from '../services/api';
import type { UtilityAsset, ForecastResponse } from '../types';
import { KpiCard } from '../components/KpiCard';
import { useApp } from '../context/AppContext';
import { Zap, Droplets, Flame, Trash2, TrendingUp, Wrench } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

export const Utilities: React.FC = () => {
  const { selectedDistrictId, userRole } = useApp();
  const [assets, setAssets] = useState<UtilityAsset[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('electricity_mw');
  const [ticketModalAsset, setTicketModalAsset] = useState<UtilityAsset | null>(null);

  const isElectricity = selectedMetric === 'electricity_mw';
  const unitStr = isElectricity ? 'MW' : 'PSI';
  const metricLabel = isElectricity ? 'Electricity Grid Load' : 'Water Main Pressure';
  const nominalThreshold = isElectricity ? 150 : 60; // Nominal operating baseline reference

  const loadData = async () => {
    try {
      const distId = selectedDistrictId || 1;
      const statusData = await fetchUtilitiesStatus(selectedDistrictId || undefined);
      setAssets(statusData);

      const forecastData = await fetchUtilitiesForecast(selectedMetric, distId, 24);
      setForecast(forecastData);
    } catch (e) {
      console.error('Error loading utilities data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrictId, selectedMetric]);

  const handleCreateTicket = async (asset: UtilityAsset) => {
    if (userRole === 'viewer') {
      alert('Viewers have read-only access. Switch role to Operator or Admin to dispatch maintenance tickets.');
      return;
    }
    setTicketModalAsset(asset);
  };

  const chartData = forecast
    ? forecast.timestamps.map((ts, idx) => ({
        time: ts,
        forecast: Number(forecast.forecast[idx]?.toFixed(1)),
        lower: Number(forecast.lower_bound[idx]?.toFixed(1)),
        upper: Number(forecast.upper_bound[idx]?.toFixed(1)),
        baseline: nominalThreshold,
      }))
    : [];

  // Custom Rich Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const forecastVal = payload.find((p: any) => p.dataKey === 'forecast')?.value;
      const upperVal = payload.find((p: any) => p.dataKey === 'upper')?.value;
      const lowerVal = payload.find((p: any) => p.dataKey === 'lower')?.value;

      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl space-y-2 backdrop-blur-md text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-4">
            <span className="font-bold text-slate-200">Time Window: {label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/30">
              {unitStr}
            </span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between gap-4 text-cyan-300 font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Predicted {metricLabel}:
              </span>
              <span>{forecastVal} {unitStr}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-blue-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> Upper Bound (95% CI):
              </span>
              <span>{upperVal} {unitStr}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-blue-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400/60"></span> Lower Bound (95% CI):
              </span>
              <span>{lowerVal} {unitStr}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-amber-300/80 pt-1 border-t border-slate-800 text-[10px]">
              <span>Nominal Operating Baseline:</span>
              <span>{nominalThreshold} {unitStr}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Utilities Management & Demand Forecasting
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry for Electricity (MW), Water (PSI/GPM), Gas Pressure, Waste Fill %, and Holt-Winters ML forecasting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer shadow-lg"
          >
            <option value="electricity_mw">⚡ Electricity Grid Load (MW)</option>
            <option value="water_pressure_psi">💧 Water Main Pressure (PSI)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Avg Electricity Load"
          value={assets.length ? (assets.reduce((acc, a) => acc + a.electricity_mw, 0) / assets.length).toFixed(1) : 145}
          unit="MW per district"
          icon={Zap}
          subtitle="Peak demand window 14:00 - 18:00"
          colorScheme="cyan"
        />

        <KpiCard
          title="Avg Water Pressure"
          value={assets.length ? (assets.reduce((acc, a) => acc + a.water_pressure_psi, 0) / assets.length).toFixed(1) : 62.5}
          unit="PSI"
          icon={Droplets}
          status={assets.some((a) => a.water_pressure_psi < 40) ? 'Warning' : 'Normal'}
          subtitle="Main distribution nominal range 50-75 PSI"
          colorScheme="emerald"
        />

        <KpiCard
          title="Gas Flow Pressure"
          value={assets.length ? (assets.reduce((acc, a) => acc + a.gas_pressure_bar, 0) / assets.length).toFixed(2) : 4.15}
          unit="bar"
          icon={Flame}
          subtitle="High pressure transmission active"
          colorScheme="amber"
        />

        <KpiCard
          title="Waste Bin Fill Level"
          value={assets.length ? (assets.reduce((acc, a) => acc + a.waste_fill_pct, 0) / assets.length).toFixed(1) : 45}
          unit="%"
          icon={Trash2}
          subtitle="Automated collection route dispatch threshold 85%"
          colorScheme="indigo"
        />
      </div>

      {/* Intuitive ML 24-Hour Demand Forecast Chart */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              24-Hour {metricLabel} Predictive Forecast
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                Unit: {unitStr}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                {forecast?.method || 'Holt-Winters Exponential Smoothing'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Predicted demand trend line (cyan) with 95% statistical confidence interval band (blue) & nominal capacity baseline (amber)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Predicted Trend
            </span>
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500/40"></span> 95% Confidence Band
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-3 h-0.5 bg-amber-400"></span> Nominal Baseline
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorBounds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickMargin={8} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => `${val} ${unitStr}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={nominalThreshold}
                stroke="#fbbf24"
                strokeDasharray="4 4"
                label={{ value: `Nominal Baseline (${nominalThreshold} ${unitStr})`, fill: '#fbbf24', fontSize: 10, position: 'insideTopRight' }}
              />
              <Area type="monotone" dataKey="upper" stroke="#3b82f6" strokeDasharray="3 3" fillOpacity={1} fill="url(#colorBounds)" name="Upper Bound (95% CI)" />
              <Area type="monotone" dataKey="forecast" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" name={`Predicted ${unitStr}`} />
              <Area type="monotone" dataKey="lower" stroke="#3b82f6" strokeDasharray="3 3" fillOpacity={0} name="Lower Bound (95% CI)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Utility Telemetry Table & Dispatch Action Workflow */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
          <span>District Utilities Asset Status & Anomaly Flags</span>
          <span className="text-xs text-slate-400">{assets.length} Regional Hubs Monitored</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">District Hub</th>
                <th className="py-2.5 px-3">Electricity MW</th>
                <th className="py-2.5 px-3">Water Pressure</th>
                <th className="py-2.5 px-3">Water Flow GPM</th>
                <th className="py-2.5 px-3">Gas Pressure</th>
                <th className="py-2.5 px-3">Waste Fill</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {asset.district_name}
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400 font-bold">
                    {asset.electricity_mw} MW
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={asset.water_pressure_psi < 45 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {asset.water_pressure_psi} PSI
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {asset.water_flow_gpm} GPM
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {asset.gas_pressure_bar} bar
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={asset.waste_fill_pct > 85 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {asset.waste_fill_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={asset.status === 'Critical' ? 'badge-critical' : 'badge-normal'}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleCreateTicket(asset)}
                      className="px-3 py-1 bg-slate-800 hover:bg-cyan-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 rounded font-semibold text-[11px] flex items-center gap-1 ml-auto transition-all"
                    >
                      <Wrench className="w-3 h-3" /> Dispatch Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal Confirmation */}
      {ticketModalAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md bg-slate-900 border border-slate-800 p-6 space-y-4 rounded-2xl shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              Dispatch Maintenance Ticket: {ticketModalAsset.district_name}
            </h3>
            <p className="text-xs text-slate-300">
              Create an automated work order ticket for field crews to inspect sensor anomaly parameters.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg text-xs space-y-1 font-mono text-cyan-400 border border-slate-800">
              <div>Electricity: {ticketModalAsset.electricity_mw} MW</div>
              <div>Water Pressure: {ticketModalAsset.water_pressure_psi} PSI</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTicketModalAsset(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await createUtilityTicket({
                    asset_id: ticketModalAsset.id,
                    district_id: ticketModalAsset.district_id,
                    title: `Emergency Repair Order for ${ticketModalAsset.name}`,
                    description: 'Automated dispatch ticket triggered from live utilities anomaly threshold.',
                    priority: 'High'
                  });
                  alert('Ticket created successfully!');
                  setTicketModalAsset(null);
                }}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded font-semibold"
              >
                Confirm Dispatch Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
