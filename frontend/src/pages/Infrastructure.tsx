import React, { useState, useEffect } from 'react';
import { fetchInfrastructureAssets, scheduleInfrastructureMaintenance } from '../services/api';
import type { InfrastructureAsset } from '../types';
import { KpiCard } from '../components/KpiCard';
import { useApp } from '../context/AppContext';
import { Wrench, ShieldAlert, Calendar, CheckCircle2 } from 'lucide-react';

export const Infrastructure: React.FC = () => {
  const { selectedDistrictId, userRole } = useApp();
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchInfrastructureAssets();
      setAssets(data);
    } catch (e) {
      console.error('Error loading infrastructure assets:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrictId]);

  const highRiskCount = assets.filter((a) => a.risk_level === 'High' || a.risk_level === 'Critical').length;
  const avgCondition = assets.length
    ? (assets.reduce((acc, a) => acc + a.condition_score, 0) / assets.length).toFixed(1)
    : 72.4;

  const handleScheduleTicket = async (asset: InfrastructureAsset) => {
    if (userRole === 'viewer') {
      alert('Viewers have read-only access. Switch role to Operator or Admin to schedule maintenance.');
      return;
    }
    setSelectedAsset(asset);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            Infrastructure Asset Registry & Predictive Maintenance
          </h2>
          <p className="text-xs text-slate-400">
            Sensor telemetry degradation curves, failure probability scoring, and automated maintenance ticket scheduling
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Avg Condition Score"
          value={avgCondition}
          unit="/ 100"
          icon={CheckCircle2}
          status={Number(avgCondition) < 70 ? 'Warning' : 'Normal'}
          subtitle="Structural integrity threshold 60.0"
          colorScheme="emerald"
        />

        <KpiCard
          title="High Risk Assets"
          value={highRiskCount}
          unit="flagged"
          icon={ShieldAlert}
          status={highRiskCount > 0 ? 'Critical' : 'Normal'}
          subtitle="Est failure window <= 60 days"
          colorScheme="rose"
        />

        <KpiCard
          title="Monitored Structures"
          value={assets.length}
          unit="assets"
          icon={Wrench}
          subtitle="Bridges, Roads, Buildings, Grid"
          colorScheme="cyan"
        />

        <KpiCard
          title="Scheduled Work Orders"
          value="4"
          unit="tickets active"
          icon={Calendar}
          subtitle="Budget Impact: $18,500 total"
          colorScheme="indigo"
        />
      </div>

      {/* Asset Registry Table with ML Predictive Risk Badges */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
          <span>Asset Integrity & Predictive Failure Risk Ranking</span>
          <span className="text-xs text-slate-400">{assets.length} Registered Infrastructure Assets</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Asset Name & Type</th>
                <th className="py-2.5 px-3">District Location</th>
                <th className="py-2.5 px-3">Condition Score</th>
                <th className="py-2.5 px-3">Failure Prob %</th>
                <th className="py-2.5 px-3">Est Failure Window</th>
                <th className="py-2.5 px-3">Risk Category</th>
                <th className="py-2.5 px-3">Maintenance Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-200">{asset.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{asset.asset_type}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {asset.district_name}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${asset.condition_score < 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {asset.condition_score.toFixed(1)} / 100
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                    {asset.ml_risk_eval?.failure_probability_pct || 22.5}%
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {asset.estimated_days_to_failure} days
                  </td>
                  <td className="py-3 px-3">
                    <span className={asset.risk_level === 'Critical' ? 'badge-critical' : asset.risk_level === 'High' ? 'badge-warning' : 'badge-normal'}>
                      {asset.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-medium">
                    {asset.maintenance_status}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleScheduleTicket(asset)}
                      className="px-3 py-1 bg-slate-800 hover:bg-emerald-900 border border-slate-700 hover:border-emerald-500 text-emerald-300 rounded font-semibold text-[11px] flex items-center gap-1 ml-auto transition-all"
                    >
                      <Calendar className="w-3 h-3" /> Schedule Work
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Work Order Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md bg-slate-900 border border-slate-800 p-6 space-y-4 rounded-2xl shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              Schedule Maintenance: {selectedAsset.name}
            </h3>
            <p className="text-xs text-slate-300">
              {selectedAsset.ml_risk_eval?.recommended_action || 'Issue a work order to perform structural repair.'}
            </p>
            <div className="p-3 bg-slate-950 rounded-lg text-xs space-y-1 font-mono text-emerald-400 border border-slate-800">
              <div>Condition Score: {selectedAsset.condition_score.toFixed(1)} / 100</div>
              <div>Estimated Failure Window: {selectedAsset.estimated_days_to_failure} days</div>
              <div>Estimated Cost: $3,500.00</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await scheduleInfrastructureMaintenance({
                    asset_id: selectedAsset.id,
                    title: `Preventative Maintenance Work Order for ${selectedAsset.name}`,
                    priority: selectedAsset.risk_level === 'Critical' ? 'Urgent' : 'High',
                    estimated_cost: 3500.0
                  });
                  alert('Work order scheduled successfully!');
                  setSelectedAsset(null);
                  loadData();
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-semibold"
              >
                Confirm Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
