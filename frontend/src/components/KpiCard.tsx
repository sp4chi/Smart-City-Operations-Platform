import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  trendUpIsGood?: boolean;
  status?: 'Normal' | 'Warning' | 'Critical';
  subtitle?: string;
  colorScheme?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  status,
  subtitle,
  colorScheme = 'cyan',
}) => {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
    indigo: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400',
  };

  return (
    <div className={`glass-card glass-card-hover p-4 bg-gradient-to-br ${colorMap[colorScheme]} space-y-3 relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg bg-slate-900/80 border border-slate-800 ${colorMap[colorScheme]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
        {subtitle ? (
          <span className="text-slate-400 text-[11px]">{subtitle}</span>
        ) : trend ? (
          <span className="text-emerald-400 font-medium text-[11px]">{trend}</span>
        ) : (
          <span className="text-slate-400 text-[11px]">Real-time telemetry</span>
        )}

        {status && (
          <span
            className={
              status === 'Critical'
                ? 'badge-critical'
                : status === 'Warning'
                ? 'badge-warning'
                : 'badge-normal'
            }
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
};
