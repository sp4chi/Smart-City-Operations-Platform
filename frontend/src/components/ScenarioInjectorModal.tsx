import React, { useState } from 'react';
import { injectScenario, resetSimulationScenario } from '../services/api';
import {
  Zap,
  CloudLightning,
  Car,
  Droplets,
  Flame,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Play
} from 'lucide-react';

interface ScenarioInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioTriggered?: () => void;
}

export const ScenarioInjectorModal: React.FC<ScenarioInjectorModalProps> = ({
  isOpen,
  onClose,
  onScenarioTriggered,
}) => {
  const [injecting, setInjecting] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'storm_outage',
      title: 'Flash Flood & Power Substation Submersion',
      domain: 'Utilities & Public Safety',
      district: 'District 3 (East Riverfront)',
      severity: 'Critical',
      icon: CloudLightning,
      color: 'rose',
      description: 'Sudden 3.5 in/hr downpour submerges Riverfront substation perimeter. Drops water pressure to 18.5 PSI and mobilizes flood response units.',
    },
    {
      id: 'highway_pileup',
      title: 'I-35 Expressway 8-Car HAZMAT Collision',
      domain: 'Transportation',
      district: 'District 2 (Northside Corridor)',
      severity: 'Critical',
      icon: Car,
      color: 'amber',
      description: 'Major commercial collision blocks highway lanes. Congestion index spikes to 96.5% and average speed plummets to 4.2 MPH.',
    },
    {
      id: 'water_contamination',
      title: 'Central Reservoir Sensor Contamination',
      domain: 'Water Utilities',
      district: 'District 1 (Downtown Central)',
      severity: 'Critical',
      icon: Droplets,
      color: 'cyan',
      description: 'Spectrometric anomaly triggers water quality alarm. Initiates automated valve isolation and priority work orders.',
    },
    {
      id: 'heatwave_stress',
      title: 'City-Wide Heatwave Power Surge',
      domain: 'Energy Grid',
      district: 'All 5 Municipal Districts',
      severity: 'Warning',
      icon: Flame,
      color: 'orange',
      description: '104°F extreme heatwave causes city-wide HVAC peak demand to jump by 45%, testing grid transformer thresholds.',
    },
  ];

  const handleInject = async (scenarioId: string) => {
    setInjecting(scenarioId);
    setResultMsg(null);
    try {
      const res = await injectScenario(scenarioId);
      setResultMsg({
        type: 'success',
        text: res.message,
        details: res.impact,
      });
      if (onScenarioTriggered) {
        onScenarioTriggered();
      }
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to inject crisis scenario.',
      });
    } finally {
      setInjecting(null);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setResultMsg(null);
    try {
      const res = await resetSimulationScenario();
      setResultMsg({
        type: 'success',
        text: res.message,
        details: `Resolved ${res.resolved_alerts_count} active simulation crisis alerts.`,
      });
      if (onScenarioTriggered) {
        onScenarioTriggered();
      }
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: 'Failed to reset simulation state.',
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-card bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Crisis Sandbox & Scenario Injector</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Simulation Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trigger real-time stress scenarios to test anomaly alarms, telemetry feeds, and response playbooks
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {resultMsg && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 animate-in slide-in-from-top-2 ${
              resultMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {resultMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>{resultMsg.text}</span>
              </div>
              {resultMsg.details && (
                <p className="text-[11px] text-emerald-200/90 pl-6">{resultMsg.details}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              Select Crisis Scenario to Inject:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenarios.map((sc) => {
                const IconComponent = sc.icon;
                const isThisInjecting = injecting === sc.id;

                return (
                  <div
                    key={sc.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                          <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 group-hover:text-white transition">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span>{sc.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                          {sc.severity}
                        </span>
                        <span className="text-slate-400 font-mono">{sc.district}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                        {sc.description}
                      </p>
                    </div>

                    <button
                      disabled={Boolean(injecting) || resetting}
                      onClick={() => handleInject(sc.id)}
                      className="w-full py-2 px-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow"
                    >
                      {isThisInjecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      Inject Scenario
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            disabled={resetting || Boolean(injecting)}
            onClick={handleReset}
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reset City to Nominal State
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
