import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Alert } from '../types';
import { fetchAlertsFeed } from '../services/api';
import { X, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const LiveAlertFeed: React.FC = () => {
  const { isAlertDrawerOpen, setIsAlertDrawerOpen, lastLiveEvent } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchAlertsFeed();
      setAlerts(data);
    } catch (e) {
      console.error('Error fetching alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAlertDrawerOpen) {
      loadAlerts();
    }
  }, [isAlertDrawerOpen]);

  useEffect(() => {
    if (lastLiveEvent && lastLiveEvent.events && lastLiveEvent.events.length > 0) {
      loadAlerts();
    }
  }, [lastLiveEvent]);

  if (!isAlertDrawerOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity === 'ALL') return true;
    return a.severity.toUpperCase() === selectedSeverity;
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-header border-l border-slate-800 shadow-2xl flex flex-col justify-between transition-transform duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100">Live Operations Feed</h2>
            <p className="text-[11px] text-slate-400">{alerts.length} active operational alerts</p>
          </div>
        </div>
        <button
          onClick={() => setIsAlertDrawerOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Severity Filter */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5">
        {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(sev)}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
              selectedSeverity === sev
                ? 'bg-cyan-500 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Alert Cards Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            Loading real-time alert stream...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-slate-300 font-semibold text-xs">No active alerts matching filter.</p>
            <p className="text-slate-400 text-[11px]">All district streams are nominal.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                alert.severity === 'Critical'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : alert.severity === 'Warning'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-cyan-400">{alert.code}</span>
                  • {alert.title}
                </span>
                <span
                  className={
                    alert.severity === 'Critical'
                      ? 'badge-critical'
                      : alert.severity === 'Warning'
                      ? 'badge-warning'
                      : 'badge-normal'
                  }
                >
                  {alert.severity}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">{alert.description}</p>

              {alert.root_cause_hint && (
                <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                  <span className="font-semibold text-cyan-400 uppercase tracking-wider">Root Cause Hint:</span>
                  <p className="text-slate-300">{alert.root_cause_hint}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Domain: <span className="uppercase text-cyan-400 font-semibold">{alert.domain}</span></span>
                <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 text-center">
        Alerts stream refreshed live via WebSockets
      </div>
    </div>
  );
};
