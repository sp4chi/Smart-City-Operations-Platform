import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
  trendUpIsGood = true,
  status,
  subtitle,
  colorScheme = 'cyan',
}) => {
  const accentStyles = {
    cyan: {
      icon: 'text-sky-400 bg-sky-950/40 border-sky-800/40',
      bottomLine: 'from-sky-500/40 to-transparent',
    },
    emerald: {
      icon: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
      bottomLine: 'from-emerald-500/40 to-transparent',
    },
    amber: {
      icon: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
      bottomLine: 'from-amber-500/40 to-transparent',
    },
    rose: {
      icon: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
      bottomLine: 'from-rose-500/40 to-transparent',
    },
    indigo: {
      icon: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40',
      bottomLine: 'from-indigo-500/40 to-transparent',
    },
  };

  const currentAccent = accentStyles[colorScheme] || accentStyles.cyan;

  const isTrendPositive = trend ? !trend.startsWith('-') : null;
  const isTrendGood = isTrendPositive !== null ? (isTrendPositive ? trendUpIsGood : !trendUpIsGood) : null;

  return (
    <Card className="relative overflow-hidden group hover:border-zinc-700/80 transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Top Header: Title and Icon */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {title}
          </span>
          <div className={`p-2 rounded-lg border ${currentAccent.icon} transition-transform group-hover:scale-105 duration-200`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Value Display */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-zinc-100">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-zinc-400">
              {unit}
            </span>
          )}
        </div>

        {/* Footer Meta Row */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            {trend ? (
              <span
                className={`inline-flex items-center text-[11px] font-semibold ${
                  isTrendGood ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isTrendPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" />
                )}
                {trend}
              </span>
            ) : subtitle ? (
              <span className="text-zinc-400 text-[11px] truncate" title={subtitle}>
                {subtitle}
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px]">Real-time telemetry</span>
            )}
          </div>

          {status && (
            <Badge
              variant={
                status === 'Critical'
                  ? 'destructive'
                  : status === 'Warning'
                  ? 'warning'
                  : 'success'
              }
              className="text-[10px] px-2 py-0"
            >
              {status}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Subtle Bottom Accent Gradient */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${currentAccent.bottomLine}`} />
    </Card>
  );
};
