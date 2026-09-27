import React, { useState, useEffect } from 'react';
import { fetchReportsSummary, downloadReportsCSV } from '../services/api';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Radio,
  Clock,
  Activity,
  Loader2
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchReportsSummary()
        .then((res) => setData(res))
        .catch((err) => console.error('Error loading report summary:', err))
        .finally(() => setLoading(false));

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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      await downloadReportsCSV();
    } catch (e) {
      console.error('Failed to download CSV:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl glass-card bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">CityPulse Executive Operations & Audit Report</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Certified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited municipal SLA compliance, incident resolution, utility demand, and emergency readiness
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {loading || !data ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              Generating comprehensive operations audit metrics...
            </div>
          ) : (
            <>
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-cyan-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase text-slate-400">Composite</span>
                  </div>
                  <div className="text-xl font-bold text-white">{data.city_health_score}%</div>
                  <div className="text-[11px] text-slate-400">Overall City Health Score</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase text-slate-400">SLA Rate</span>
                  </div>
                  <div className="text-xl font-bold text-white">{data.sla_compliance.adherence_rate_pct}%</div>
                  <div className="text-[11px] text-slate-400">311 Resolution Rate</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-amber-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase text-slate-400">Grid Load</span>
                  </div>
                  <div className="text-xl font-bold text-white">{data.utilities_overview.total_power_mw} <span className="text-xs font-normal">MW</span></div>
                  <div className="text-[11px] text-slate-400">Active Peak Demand</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-indigo-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase text-slate-400">Dispatch</span>
                  </div>
                  <div className="text-xl font-bold text-white">{data.emergency_readiness.avg_response_time_min} <span className="text-xs font-normal">min</span></div>
                  <div className="text-[11px] text-slate-400">Avg Emergency Response</div>
                </div>
              </div>

              {/* SLA & Service Request Performance */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  311 Citizen Request SLA Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Total Citizen Requests:</span>
                    <p className="text-sm font-bold text-white mt-0.5">{data.sla_compliance.total_311_requests}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Resolved SLA Tickets:</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{data.sla_compliance.resolved_requests}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Active Pending Backlog:</span>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">{data.sla_compliance.open_backlog}</p>
                  </div>
                </div>

                {data.sla_compliance.category_breakdown && (
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">Volume by Service Category:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(data.sla_compliance.category_breakdown).map(([cat, count]: any) => (
                        <span key={cat} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          {cat}: <strong className="text-cyan-300 font-mono">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Incidents & Emergency Readiness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Alerts & Incident Resolution
                  </h3>
                  <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Alerts Logged:</span>
                      <span className="font-mono font-bold text-white">{data.alerts_summary.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Unresolved Alerts:</span>
                      <span className="font-mono font-bold text-rose-400">{data.alerts_summary.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Incident Resolution Rate:</span>
                      <span className="font-mono font-bold text-emerald-400">{data.alerts_summary.resolution_rate_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Approved Work Orders:</span>
                      <span className="font-mono font-bold text-cyan-400">{data.work_orders_count}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-indigo-400" />
                    Emergency Fleet Readiness
                  </h3>
                  <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Emergency Fleet:</span>
                      <span className="font-mono font-bold text-white">{data.emergency_readiness.total_units} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available at Station:</span>
                      <span className="font-mono font-bold text-emerald-400">{data.emergency_readiness.available_units} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dispatched / En Route:</span>
                      <span className="font-mono font-bold text-amber-400">{data.emergency_readiness.dispatched_units} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monitored Districts:</span>
                      <span className="font-mono font-bold text-cyan-300">{data.total_districts} Municipal Districts</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-mono">
            Certified timestamp: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              disabled={downloading || loading}
              onClick={handleDownloadCSV}
              className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/20 cursor-pointer"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download Audit CSV
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
