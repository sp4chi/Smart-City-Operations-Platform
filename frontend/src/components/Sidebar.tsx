import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Zap, Bus, Users, Wrench, TrendingUp, Bot, Cpu, Lightbulb } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, setIsChatDrawerOpen } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { id: 'utilities', label: 'Utilities', icon: Zap, badge: 'ML Forecast' },
    { id: 'transportation', label: 'Transportation', icon: Bus, badge: 'Corridors' },
    { id: 'public_services', label: 'Public Services', icon: Users, badge: '311 Intake' },
    { id: 'infrastructure', label: 'Infrastructure', icon: Wrench, badge: 'Predictive' },
  ];

  const aiCapabilities = [
    { label: 'Urban Trend Prediction', icon: TrendingUp, targetTab: 'utilities', badge: '24h ML' },
    { label: 'AI City Advisor', icon: Bot, isChat: true, badge: 'Gemini' },
    { label: 'Resource Optimization', icon: Cpu, targetTab: 'infrastructure', badge: 'Weibull' },
    { label: 'Operational Insights', icon: Lightbulb, targetTab: 'dashboard', badge: 'Root Cause' },
  ];

  return (
    <aside className="w-64 glass-header border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-5">
        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Domain Operations
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Core AI Engines Section */}
        <div className="pt-3 border-t border-slate-800/80 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-cyan-400/90 mb-2 flex items-center gap-1.5">
            Core AI Engines
          </p>
          <div className="space-y-1">
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-900/80 transition-all border border-transparent hover:border-slate-800 group text-left"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-[11px]">{ai.label}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
                    {ai.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer info card */}
      <div className="p-3 glass-card bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">City Scale:</span>
          <span className="text-slate-200 font-semibold">~500K Pop</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Districts:</span>
          <span className="text-cyan-400 font-semibold">5 Active</span>
        </div>
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center">
          CityPulse v2.5 • AI-Native Platform
        </div>
      </div>
    </aside>
  );
};
