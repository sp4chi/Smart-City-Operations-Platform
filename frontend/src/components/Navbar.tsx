import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Bell,
  Sparkles,
  Activity,
  Radio,
  LogIn,
  LogOut,
  FileText,
  Zap,
  MapPin,
} from 'lucide-react';
import { ExportReportModal } from './ExportReportModal';
import { ScenarioInjectorModal } from './ScenarioInjectorModal';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  const {
    isAlertDrawerOpen,
    setIsAlertDrawerOpen,
    isChatDrawerOpen,
    setIsChatDrawerOpen,
    setIsLoginModalOpen,
    userRole,
    authToken,
    logout,
    wsConnected,
    selectedDistrictId,
    setSelectedDistrictId,
  } = useApp();

  const getRoleBadgeVariant = (role: UserRole): 'destructive' | 'info' | 'secondary' => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'operator':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'operator':
        return 'Operator';
      default:
        return 'Viewer';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Brand Identity & Environment Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-sky-400 shadow-inner">
            <Activity className="h-4 w-4 animate-pulse text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-zinc-100">
                CityPulse
              </span>
              <span className="hidden sm:inline-block rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] font-mono font-medium text-zinc-400 border border-zinc-700/60">
                v2.4
              </span>
            </div>
          </div>
        </div>

        {/* Live Simulation Pulse Indicator */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-zinc-800">
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  wsConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <Radio className="h-3 w-3 text-zinc-400 ml-0.5" />
            <span className="font-mono text-[10px] text-zinc-400">
              {wsConnected ? 'LIVE FEED (3s)' : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Municipal District Filter Selector */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 shadow-inner">
          <MapPin className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-zinc-500 font-medium text-[11px]">District:</span>
          <select
            value={selectedDistrictId || ''}
            onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : null)}
            className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-zinc-900 text-zinc-200">All Municipal Districts</option>
            <option value="1" className="bg-zinc-900 text-zinc-200">District 1 — Downtown Central</option>
            <option value="2" className="bg-zinc-900 text-zinc-200">District 2 — Northside Tech Corridor</option>
            <option value="3" className="bg-zinc-900 text-zinc-200">District 3 — East Riverfront</option>
            <option value="4" className="bg-zinc-900 text-zinc-200">District 4 — West Heights</option>
            <option value="5" className="bg-zinc-900 text-zinc-200">District 5 — South Suburbs</option>
          </select>
        </div>
      </div>

      {/* Right Controls: Actions & Role */}
      <div className="flex items-center gap-2">
        {/* Role Badge & Auth Switcher */}
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="cursor-pointer"
          title="Click to Switch User Role / Credentials"
        >
          <Badge
            variant={getRoleBadgeVariant(userRole)}
            className="cursor-pointer hover:opacity-80 transition-opacity gap-1"
          >
            <Shield className="h-3 w-3" />
            <span>{getRoleLabel(userRole)}</span>
          </Badge>
        </button>

        {/* Crisis Scenario Injector (Operators / Admins only) */}
        {userRole !== 'viewer' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScenarioModalOpen(true)}
            className="border-amber-500/30 text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 hover:text-amber-200"
            title="Inject Crisis Simulations"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden xl:inline">Crisis Sandbox</span>
          </Button>
        )}

        {/* Audit Report Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsReportModalOpen(true)}
          className="hidden sm:inline-flex text-zinc-300 border-zinc-800 hover:bg-zinc-800/80"
          title="Executive Operations & SLA Report"
        >
          <FileText className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden xl:inline">Audit Report</span>
        </Button>

        {/* Real-time Alerts Notification Bell */}
        <Button
          variant={isAlertDrawerOpen ? 'secondary' : 'outline'}
          size="icon"
          onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
          className="relative border-zinc-800 text-zinc-300 hover:text-white"
          title="Alert Feed"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-zinc-950 animate-pulse" />
        </Button>

        {/* AI Operations Assistant */}
        <Button
          variant={isChatDrawerOpen ? 'glow' : 'default'}
          size="sm"
          onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
          className={
            isChatDrawerOpen
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
              : 'bg-zinc-100 text-zinc-950 hover:bg-white font-semibold'
          }
        >
          <Sparkles className="h-3.5 w-3.5 text-sky-500" />
          <span className="hidden sm:inline">AI Copilot</span>
        </Button>

        {/* Sign In / Sign Out */}
        {authToken ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-zinc-400 hover:text-rose-400"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLoginModalOpen(true)}
            className="hidden md:inline-flex text-xs border-zinc-800 text-zinc-300"
          >
            <LogIn className="h-3.5 w-3.5 mr-1" />
            Sign In
          </Button>
        )}
      </div>

      {/* Modals */}
      <ExportReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <ScenarioInjectorModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
      />
    </header>
  );
};
