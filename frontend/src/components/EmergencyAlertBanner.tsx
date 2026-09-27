import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Alert } from '../types';
import { IncidentPlaybookModal } from './IncidentPlaybookModal';
import { ShieldAlert, Zap, X, Volume2, VolumeX } from 'lucide-react';

// Web Audio API synthesizer for clean sound notification without external asset dependencies
const playEmergencyChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Two-tone warning chime
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.setValueAtTime(660, now + 0.15); // E5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

export const EmergencyAlertBanner: React.FC = () => {
  const { lastLiveEvent } = useApp();
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const dismissTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!lastLiveEvent) return;

    // Check if live tick contains critical anomaly or new alert
    const criticalEvent = lastLiveEvent.events?.find(
      (ev: any) => ev.severity?.toLowerCase() === 'critical' || ev.is_anomaly
    );

    if (criticalEvent) {
      const mockAlert: Alert = {
        id: criticalEvent.alert_id || 1,
        code: criticalEvent.alert_code || criticalEvent.code || 'ALT-LIVE-001',
        domain: criticalEvent.domain || 'utilities',
        district_id: criticalEvent.district_id || 1,
        severity: 'Critical',
        title: criticalEvent.title || `Critical Anomaly Detected in District #${criticalEvent.district_id || 1}`,
        description: criticalEvent.description || criticalEvent.anomaly_reason || 'Automated sensor threshold breached.',
        root_cause_hint: criticalEvent.root_cause_hint || 'Real-time telemetry anomaly detected by CityPulse engine.',
        created_at: new Date().toISOString(),
      };

      setActiveAlert(mockAlert);

      if (soundEnabled) {
        playEmergencyChime();
      }

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setActiveAlert(null);
      }, 12000);
    }
  }, [lastLiveEvent, soundEnabled]);

  if (!activeAlert) return null;

  return (
    <>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in slide-in-from-top-4 duration-300">
        <div className="p-3.5 rounded-2xl glass-card bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-slate-950/95 border-2 border-rose-500/60 shadow-2xl shadow-rose-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500 text-white uppercase tracking-wider">
                  Critical Alarm
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-semibold truncate">
                  {activeAlert.code}
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {activeAlert.title}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {activeAlert.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsPlaybookOpen(true)}
              className="py-1.5 px-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-rose-900/40"
            >
              <Zap className="w-3.5 h-3.5" />
              Launch Playbook
            </button>

            <button
              onClick={() => setActiveAlert(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <IncidentPlaybookModal
        alert={activeAlert}
        isOpen={isPlaybookOpen}
        onClose={() => {
          setIsPlaybookOpen(false);
          setActiveAlert(null);
        }}
        onExecuted={() => {
          setActiveAlert(null);
        }}
      />
    </>
  );
};
