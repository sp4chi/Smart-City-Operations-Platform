import React, { useState, useEffect } from 'react';
import { fetch311Requests, fetchEmergencyUnits } from '../services/api';
import type { ServiceRequest311, EmergencyUnit } from '../types';
import { KpiCard } from '../components/KpiCard';
import { Create311Modal } from '../components/Create311Modal';
import { useApp } from '../context/AppContext';
import { Users, PhoneCall, ShieldAlert, Plus, CheckCircle2 } from 'lucide-react';

export const PublicServices: React.FC = () => {
  const { selectedDistrictId, userRole } = useApp();
  const [requests, setRequests] = useState<ServiceRequest311[]>([]);
  const [emergencyUnits, setEmergencyUnits] = useState<EmergencyUnit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      const reqData = await fetch311Requests(
        statusFilter !== 'ALL' ? statusFilter : undefined,
        selectedDistrictId || undefined
      );
      const unitData = await fetchEmergencyUnits(selectedDistrictId || undefined);
      setRequests(reqData);
      setEmergencyUnits(unitData);
    } catch (e) {
      console.error('Error loading public services data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrictId, statusFilter]);

  const openCount = requests.filter((r) => r.status === 'Open').length;
  const avgResponse = emergencyUnits.length
    ? (emergencyUnits.reduce((acc, u) => acc + u.avg_response_time_min, 0) / emergencyUnits.length).toFixed(1)
    : 4.5;

  return (
    <div className="p-6 space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Public Services & Emergency Dispatch Operations
          </h2>
          <p className="text-xs text-slate-400">
            311 citizen intake ticketing, SLA backlog tracking, and Emergency unit (Police, Fire, EMS) response times
          </p>
        </div>

        <button
          onClick={() => {
            if (userRole === 'viewer') {
              alert('Viewers have read-only access. Switch role to Operator or Admin to create 311 tickets.');
              return;
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Submit 311 Request
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Open 311 Tickets"
          value={openCount}
          unit="pending"
          icon={Users}
          status={openCount > 10 ? 'Warning' : 'Normal'}
          subtitle="Top: Potholes, Streetlights, Water Leaks"
          colorScheme="indigo"
        />

        <KpiCard
          title="Emergency Response"
          value={avgResponse}
          unit="mins avg"
          icon={PhoneCall}
          subtitle="EMS SLA target <= 5.0 mins"
          colorScheme="emerald"
        />

        <KpiCard
          title="Active Field Units"
          value={emergencyUnits.length}
          unit="dispatched"
          icon={ShieldAlert}
          subtitle="Police, Fire, EMS Unit Coverage"
          colorScheme="cyan"
        />

        <KpiCard
          title="SLA Compliance Rate"
          value="92.8"
          unit="%"
          icon={CheckCircle2}
          subtitle="Target threshold 90.0%"
          colorScheme="cyan"
        />
      </div>

      {/* Emergency Units Telemetry */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
          <span>Emergency Dispatch Fleet SLA Telemetry</span>
          <span className="text-xs text-slate-400">{emergencyUnits.length} Active Units</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyUnits.map((unit) => (
            <div key={unit.id} className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{unit.unit_code} ({unit.unit_type})</span>
                <span className={unit.status === 'Available' ? 'badge-normal' : 'badge-warning'}>
                  {unit.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">District: {unit.district_name}</div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Avg Response:</span>
                <span className="font-mono text-emerald-400 font-bold">{unit.avg_response_time_min} mins</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 311 Service Requests Backlog Table */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-100">
            311 Citizen Service Requests Backlog
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status Filter:</span>
            {['ALL', 'Open', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === st ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Ticket #</th>
                <th className="py-2.5 px-3">Title & Category</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">SLA Limit</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                    {req.request_number}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">{req.title}</div>
                    <div className="text-[10px] text-slate-400">{req.category}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {req.district_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      req.priority === 'Urgent' || req.priority === 'High' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={req.status === 'Open' ? 'badge-warning' : req.status === 'In Progress' ? 'badge-warning' : 'badge-normal'}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {req.sla_hours} hrs
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intake Simulator Modal */}
      <Create311Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
