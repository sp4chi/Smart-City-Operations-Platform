import React, { useState, useEffect } from 'react';
import type { Alert, EmergencyUnit, PlaybookExecutionResult } from '../types';
import { executeAlertPlaybook, fetchEmergencyUnits } from '../services/api';
import {
  ShieldAlert,
  Radio,
  Wrench,
  Navigation,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';

interface IncidentPlaybookModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onExecuted?: (result: PlaybookExecutionResult) => void;
}

export const IncidentPlaybookModal: React.FC<IncidentPlaybookModalProps> = ({
  alert,
  isOpen,
  onClose,
  onExecuted,
}) => {
  const [units, setUnits] = useState<EmergencyUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [autoResolve, setAutoResolve] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<PlaybookExecutionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && alert) {
      setLastResult(null);
      setErrorMsg(null);
      fetchEmergencyUnits(alert.district_id)
        .then((data) => {
          setUnits(data);
          const avail = data.find((u: EmergencyUnit) => u.status === 'Available');
          if (avail) setSelectedUnitId(avail.id);
        })
        .catch((err) => console.error('Error fetching emergency units:', err));

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, alert, onClose]);

  if (!isOpen || !alert) return null;

  const handleRunPlaybook = async (action: 'dispatch_emergency' | 'create_ticket' | 'traffic_reroute' | 'broadcast_advisory') => {
    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res: PlaybookExecutionResult = await executeAlertPlaybook(alert.id, {
        action,
        unit_id: selectedUnitId,
        notes,
        priority: alert.severity === 'Critical' ? 'Critical' : 'High',
        auto_resolve: autoResolve,
      });
      setLastResult(res);
      if (onExecuted) {
        onExecuted(res);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to execute incident response playbook.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl glass-card bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              alert.severity === 'Critical'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-950/50 shadow-lg'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400 font-semibold">{alert.code}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  alert.severity === 'Critical'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {alert.severity}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  District #{alert.district_id}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{alert.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Incident Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
            {alert.root_cause_hint && (
              <div className="flex items-center gap-2 text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span><strong>Root Cause Analysis:</strong> {alert.root_cause_hint}</span>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {lastResult && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-1.5 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Playbook Executed Successfully</span>
              </div>
              <p className="text-xs text-emerald-200/90">{lastResult.message}</p>
              {lastResult.ticket_code && (
                <div className="text-[11px] font-mono text-cyan-300 mt-1">
                  Ticket Generated: {lastResult.ticket_code}
                </div>
              )}
              {lastResult.alert_resolved && (
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  ✓ Alert state updated to RESOLVED in real-time operations engine
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Playbooks Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Automated Incident Playbook
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Playbook 1: Dispatch Emergency Unit */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Radio className="w-4 h-4" />
                    <span>Emergency Rapid Dispatch</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Deploy the nearest available police, fire, or EMS unit directly to the incident zone.
                  </p>
                  {units.length > 0 && (
                    <div className="pt-2">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                        Select Target Unit:
                      </label>
                      <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_code} ({u.unit_type}) - {u.status} [ETA ~{u.avg_response_time_min}m]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <button
                  disabled={isExecuting}
                  onClick={() => handleRunPlaybook('dispatch_emergency')}
                  className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Deploy Response Unit
                </button>
              </div>

              {/* Playbook 2: Priority Maintenance Work Order */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Wrench className="w-4 h-4" />
                    <span>Priority Work Order</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Issue an approved maintenance ticket with crew dispatch for municipal utilities or infrastructure.
                  </p>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                      Assigned Priority:
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Approved High/Critical SLA
                    </span>
                  </div>
                </div>
                <button
                  disabled={isExecuting}
                  onClick={() => handleRunPlaybook('create_ticket')}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Issue Maintenance Ticket
                </button>
              </div>

              {/* Playbook 3: Dynamic Traffic Rerouting */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Navigation className="w-4 h-4" />
                    <span>Adaptive Traffic Reroute</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Adjust arterial corridor traffic signal phase cycles to bypass bottleneck and restore throughput.
                  </p>
                </div>
                <button
                  disabled={isExecuting}
                  onClick={() => handleRunPlaybook('traffic_reroute')}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  Optimize Signal Timings
                </button>
              </div>

              {/* Playbook 4: Broadcast Public Advisory */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Radio className="w-4 h-4" />
                    <span>Broadcast Public Advisory</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Push urgent notification across 311 citizen mobile app, city portals, and municipal transit alerts.
                  </p>
                </div>
                <button
                  disabled={isExecuting}
                  onClick={() => handleRunPlaybook('broadcast_advisory')}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                  Broadcast Civic Alert
                </button>
              </div>
            </div>
          </div>

          {/* Operational Notes & Options */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              Dispatcher Operational Notes:
            </label>
            <input
              type="text"
              placeholder="e.g. Dispatched Engine 4; water valves shut off near Main St."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoResolve}
                onChange={(e) => setAutoResolve(e.target.checked)}
                className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
              />
              <span>Automatically resolve this alert in operations queue once playbook executes</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
