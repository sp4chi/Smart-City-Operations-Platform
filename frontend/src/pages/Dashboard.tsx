import React, { useState, useEffect } from 'react';
import { fetchDashboardOverview } from '../services/api';
import type { OverviewKPIs, Alert } from '../types';
import { useApp } from '../context/AppContext';
import { KpiCard } from '../components/KpiCard';
import { DistrictMap } from '../components/DistrictMap';
import { IncidentPlaybookModal } from '../components/IncidentPlaybookModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  Activity,
  ShieldAlert,
  Zap,
  Bus,
  Users,
  Wrench,
  Clock,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { setActiveTab, selectedDistrictId, setSelectedDistrictId, lastLiveEvent } = useApp();
  const [data, setData] = useState<OverviewKPIs | null>(null);
  const [selectedPlaybookAlert, setSelectedPlaybookAlert] = useState<Alert | null>(null);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadData = async () => {
    try {
      const overview = await fetchDashboardOverview();
      setData(overview);
      setLastRefreshed(new Date().toLocaleTimeString());
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
      <div className="flex flex-col items-center justify-center h-[500px] text-zinc-400 text-sm gap-3">
        <Activity className="w-6 h-6 animate-spin text-sky-400" />
        <span className="font-mono text-xs text-zinc-500">
          INITIALIZING CITY TELEMETRY FEED...
        </span>
      </div>
    );
  }

  const filteredDistricts = selectedDistrictId
    ? data.districts.filter((d) => d.id === selectedDistrictId)
    : data.districts;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Operations Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-zinc-100">
              Operations Command Center
            </h2>
            {selectedDistrictId ? (
              <Badge variant="info" className="gap-1">
                District #{selectedDistrictId}
                <button
                  onClick={() => setSelectedDistrictId(null)}
                  className="ml-1 hover:text-white"
                  title="Clear district filter"
                >
                  ×
                </button>
              </Badge>
            ) : (
              <Badge variant="outline" className="font-mono text-[10px]">
                City-wide (5 Sectors)
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Real-time IoT telemetry, AI anomaly scoring, and municipal dispatch across ~500,000 residents.
          </p>
        </div>

        {/* Header Right: Health Score & Live Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-inner">
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                City Health Index
              </span>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-xl font-bold font-mono text-emerald-400 leading-none">
                  {data.city_health_pct}%
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">Nominal</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full border-2 border-emerald-500/40 bg-emerald-950/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Refresh Telemetry"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span className="font-mono text-[11px]">{lastRefreshed || 'Sync'}</span>
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active System Incidents"
          value={data.active_alerts_count}
          unit="unresolved"
          icon={ShieldAlert}
          status={data.critical_alerts_count > 0 ? 'Critical' : 'Normal'}
          subtitle={`${data.critical_alerts_count} Critical, ${data.active_alerts_count - data.critical_alerts_count} Warning`}
          colorScheme={data.critical_alerts_count > 0 ? 'rose' : 'emerald'}
        />

        <KpiCard
          title="Electric Grid Demand"
          value={data.total_power_mw}
          unit="MW"
          icon={Zap}
          subtitle={`Water Pressure: ${data.avg_water_psi} PSI`}
          colorScheme="cyan"
          trend="+1.8%"
          trendUpIsGood={false}
        />

        <KpiCard
          title="Corridor Congestion"
          value={data.avg_traffic_congestion_pct}
          unit="%"
          icon={Bus}
          subtitle="Expressway avg speed 36.4 MPH"
          colorScheme="amber"
          trend="-3.2%"
          trendUpIsGood={true}
        />

        <KpiCard
          title="Emergency Response SLA"
          value={data.avg_emergency_response_min}
          unit="mins"
          icon={Clock}
          subtitle={`${data.open_311_requests} open 311 citizen requests`}
          colorScheme="indigo"
          trend="99.2% SLA"
        />
      </div>

      {/* Main Command Center Layout: Map (Left 8 cols) + Triage Feeds (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* District GIS Map Card */}
        <div className="lg:col-span-8 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden border-zinc-800/80 bg-zinc-900/50">
            <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-950/50 border border-sky-800/50 text-sky-400">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <CardTitle className="text-sm">Municipal GIS Spatial Map</CardTitle>
                  <CardDescription className="text-[11px]">
                    Interactive district boundaries, emergency vehicle vectors & infrastructure status
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] text-zinc-400 border-zinc-700">
                ESRI DARK CANVAS
              </Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[460px] relative">
              <DistrictMap districts={filteredDistricts} alerts={data.recent_alerts} />
            </CardContent>
          </Card>
        </div>

        {/* Right Rail: Domain Shortcuts & Live Incident Triage */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Quick Domain Metrics Bar */}
          <Card className="border-zinc-800/80 bg-zinc-900/50">
            <CardHeader className="py-2.5 px-4 border-b border-zinc-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-400">
                  Municipal Subsystems
                </CardTitle>
                <span className="text-[10px] font-mono text-zinc-500">4 DEPARTMENTS</span>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('utilities')}
                  className="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-left space-y-1 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-sky-400">
                    <Zap className="w-3.5 h-3.5" />
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-semibold text-xs text-zinc-200">Utilities</div>
                  <div className="text-[10px] font-mono text-zinc-400">{data.total_power_mw} MW</div>
                </button>

                <button
                  onClick={() => setActiveTab('transportation')}
                  className="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-left space-y-1 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-amber-400">
                    <Bus className="w-3.5 h-3.5" />
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-semibold text-xs text-zinc-200">Transit</div>
                  <div className="text-[10px] font-mono text-zinc-400">{data.avg_traffic_congestion_pct}% Flow</div>
                </button>

                <button
                  onClick={() => setActiveTab('public_services')}
                  className="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-left space-y-1 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-indigo-400">
                    <Users className="w-3.5 h-3.5" />
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-semibold text-xs text-zinc-200">Public 311</div>
                  <div className="text-[10px] font-mono text-zinc-400">{data.open_311_requests} Open</div>
                </button>

                <button
                  onClick={() => setActiveTab('infrastructure')}
                  className="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-left space-y-1 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-emerald-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-semibold text-xs text-zinc-200">Infrastructure</div>
                  <div className="text-[10px] font-mono text-zinc-400">{data.high_risk_infra_count} Risk Assets</div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Incident Triage & Playbook Feed */}
          <Card className="flex-1 flex flex-col border-zinc-800/80 bg-zinc-900/50 overflow-hidden">
            <CardHeader className="py-2.5 px-4 flex-row items-center justify-between space-y-0 border-b border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-300">
                  Incident Triage Queue
                </CardTitle>
              </div>
              <Badge variant="destructive" className="font-mono text-[10px] px-1.5 py-0">
                {data.recent_alerts.length} ALERTS
              </Badge>
            </CardHeader>

            <CardContent className="p-3 flex-1 overflow-y-auto space-y-2.5 max-h-[340px]">
              {data.recent_alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2" />
                  All municipal districts operating nominally.
                </div>
              ) : (
                data.recent_alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/90 space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-zinc-200 line-clamp-1">
                          {alert.title}
                        </span>
                        <span className="font-mono text-[10px] text-sky-400">
                          {alert.code}
                        </span>
                      </div>
                      <Badge
                        variant={alert.severity === 'Critical' ? 'destructive' : 'warning'}
                        className="text-[9px] px-1.5 py-0 uppercase shrink-0"
                      >
                        {alert.severity}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px]">
                      <span className="text-zinc-500 font-mono">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedPlaybookAlert(alert);
                          setIsPlaybookOpen(true);
                        }}
                        className="h-6 px-2 text-[10px] bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-800/40"
                      >
                        <Play className="w-2.5 h-2.5 mr-1 text-sky-400" />
                        Playbook
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('utilities')}
                className="w-full text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              >
                Inspect All Domain Telemetry
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-zinc-400" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* District Operations Health Leaderboard Table */}
      <Card className="border-zinc-800/80 bg-zinc-900/50">
        <CardHeader className="py-3 px-4 border-b border-zinc-800/80 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm">Municipal Sector Health & Telemetry Grid</CardTitle>
            <CardDescription className="text-xs">
              District population allocation, real-time alert status and operational telemetry nodes
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            5 / 5 ONLINE
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                <th className="py-2.5 px-4">District</th>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Population</th>
                <th className="py-2.5 px-4">Operational Status</th>
                <th className="py-2.5 px-4">Active Alerts</th>
                <th className="py-2.5 px-4">Health Index</th>
                <th className="py-2.5 px-4 text-right">Quick Filter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
              {data.districts.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-zinc-200">
                    {d.name}
                  </td>
                  <td className="py-3 px-4 text-sky-400">{d.code}</td>
                  <td className="py-3 px-4 text-zinc-300">
                    {d.population.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <Badge
                      variant={
                        d.status === 'Critical'
                          ? 'destructive'
                          : d.status === 'Warning'
                          ? 'warning'
                          : 'success'
                      }
                      className="text-[10px] px-2 py-0"
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className={d.active_alert_count > 0 ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                      {d.active_alert_count} active
                    </span>
                  </td>
                  <td className="py-3 px-4 w-48">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={d.status === 'Critical' ? 45 : d.status === 'Warning' ? 75 : 98}
                        indicatorClassName={
                          d.status === 'Critical'
                            ? 'bg-rose-500'
                            : d.status === 'Warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }
                      />
                      <span className="text-[10px] text-zinc-400">
                        {d.status === 'Critical' ? '45%' : d.status === 'Warning' ? '75%' : '98%'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDistrictId(selectedDistrictId === d.id ? null : d.id)}
                      className="h-6 px-2 text-[10px] text-sky-400 hover:text-sky-300 hover:bg-sky-950/40"
                    >
                      {selectedDistrictId === d.id ? 'Reset' : 'Filter View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Incident Playbook Execution Modal */}
      <IncidentPlaybookModal
        alert={selectedPlaybookAlert}
        isOpen={isPlaybookOpen}
        onClose={() => {
          setIsPlaybookOpen(false);
          setSelectedPlaybookAlert(null);
        }}
        onExecuted={(res) => {
          if (res.alert_resolved) {
            loadData();
          }
        }}
      />
    </div>
  );
};
