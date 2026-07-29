import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Zap, Bus, Users, Wrench } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { id: 'utilities', label: 'Utilities', icon: Zap, badge: 'ML Forecast' },
    { id: 'transportation', label: 'Transportation', icon: Bus, badge: 'Corridors' },
    { id: 'public_services', label: 'Public Services', icon: Users, badge: '311 Intake' },
    { id: 'infrastructure', label: 'Infrastructure', icon: Wrench, badge: 'Predictive' },
  ];

  return (
    <aside className="w-64 glass-header border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Domain Operations
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
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

      {/* Footer info card */}
      <div className="p-3.5 glass-card bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
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
