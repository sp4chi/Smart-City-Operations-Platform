import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Zap,
  Bus,
  Users,
  Wrench,
  TrendingUp,
  Bot,
  Cpu,
  Lightbulb,
  Radio,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, setIsChatDrawerOpen } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { id: 'utilities', label: 'Utilities & Grid', icon: Zap, badge: 'ML Forecast' },
    { id: 'transportation', label: 'Transportation', icon: Bus, badge: 'Corridors' },
    { id: 'public_services', label: 'Public Services', icon: Users, badge: '311 Intake' },
    { id: 'infrastructure', label: 'Infrastructure', icon: Wrench, badge: 'Predictive' },
  ];

  const aiCapabilities = [
    { label: 'Urban Demand Forecast', icon: TrendingUp, targetTab: 'utilities', badge: 'ARIMA' },
    { label: 'AI Operations Copilot', icon: Bot, isChat: true, badge: 'RAG' },
    { label: 'Asset Failure Risk', icon: Cpu, targetTab: 'infrastructure', badge: 'Weibull' },
    { label: 'Incident Clustering', icon: Lightbulb, targetTab: 'dashboard', badge: 'K-Means' },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md flex flex-col justify-between p-3.5 shrink-0 hidden md:flex">
      <div className="space-y-4">
        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
            Operational Domains
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all relative group cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800/90 text-zinc-100 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-sky-500" />
                  )}

                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    />
                    <span className="text-xs">{item.label}</span>
                  </div>

                  {item.badge && (
                    <Badge
                      variant={isActive ? 'default' : 'outline'}
                      className="text-[9px] px-1.5 py-0 h-4 font-mono font-normal border-zinc-700/60"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <Separator className="bg-zinc-800/80 my-2" />

        {/* AI & ML Models Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
            AI Analytics Engines
          </p>
          <div className="space-y-0.5">
            {aiCapabilities.map((ai, idx) => {
              const Icon = ai.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (ai.isChat) {
                      setIsChatDrawerOpen(true);
                    } else if (ai.targetTab) {
                      setActiveTab(ai.targetTab);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 transition-colors" />
                    <span className="text-[11px] font-normal">{ai.label}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                    {ai.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Telemetry Footer Status Card */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 text-[11px] font-medium">Engine Status</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            Active (200 OK)
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Coverage</span>
          <span className="font-mono text-zinc-300">5 Districts • 500K</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Socket Latency</span>
          <span className="font-mono text-sky-400">&lt; 38 ms</span>
        </div>
      </div>
    </aside>
  );
};
