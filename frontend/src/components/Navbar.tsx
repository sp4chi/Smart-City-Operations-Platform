import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Bell, Sparkles, Activity, Radio } from 'lucide-react';
import type { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const {
    isAlertDrawerOpen,
    setIsAlertDrawerOpen,
    isChatDrawerOpen,
    setIsChatDrawerOpen,
    userRole,
    setUserRole,
    wsConnected,
    selectedDistrictId,
    setSelectedDistrictId,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 glass-header px-6 py-3 flex items-center justify-between shadow-xl">
      {/* Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              CityPulse
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              AI-Native Smart City Platform
            </p>
          </div>
        </div>

        {/* Live WebSocket Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-xs">
          <span className="pulse-dot">
            <span className={`pulse-dot-inner ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`pulse-dot-core ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            {wsConnected ? 'Live IoT Stream (3s)' : 'Simulation Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Center / District Switcher */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">District View:</span>
        <select
          value={selectedDistrictId || ''}
          onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : null)}
          className="bg-slate-900 border border-slate-700/70 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="">All Municipal Districts (City-wide)</option>
          <option value="1">District 1 — Downtown Central</option>
          <option value="2">District 2 — Northside Tech Corridor</option>
          <option value="3">District 3 — East Riverfront</option>
          <option value="4">District 4 — West Heights</option>
          <option value="5">District 5 — South Suburbs</option>
        </select>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="bg-transparent text-slate-300 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="admin" className="bg-slate-900">Admin</option>
            <option value="operator" className="bg-slate-900">Operator</option>
            <option value="viewer" className="bg-slate-900">Viewer</option>
          </select>
        </div>

        {/* Real-Time Alert Feed Trigger */}
        <button
          onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
          className={`relative p-2 rounded-lg border transition-all ${
            isAlertDrawerOpen
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          title="Real-Time Alerts Feed"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
        </button>

        {/* AI Operations Assistant Launcher */}
        <button
          onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-lg ${
            isChatDrawerOpen
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-cyan-500/25 ring-2 ring-cyan-400'
              : 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/10'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
          <span>Ops Assistant</span>
        </button>
      </div>
    </header>
  );
};
