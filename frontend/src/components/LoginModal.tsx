import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginUser, registerUser } from '../services/api';
import { Shield, Lock, Mail, Key, X, UserPlus, LogIn, UserCheck } from 'lucide-react';
import type { UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setUserRole, setUserEmail, setUserName, setAuthToken } = useApp();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign In Form state
  const [email, setEmail] = useState('operator@citypulse.gov');
  const [password, setPassword] = useState('operator123');

  // Sign Up Form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('operator');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, demoEmail?: string, demoPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = demoEmail || email;
    const loginPass = demoPass || password;

    try {
      setLoading(true);
      setError(null);
      const data = await loginUser(loginEmail, loginPass);
      
      setAuthToken(data.access_token);
      setUserRole(data.role as UserRole);
      setUserEmail(data.email);
      setUserName(data.full_name);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const data = await registerUser({
        email: regEmail,
        full_name: regFullName,
        password: regPassword,
        role: regRole,
      });

      setAuthToken(data.access_token);
      setUserRole(data.role as UserRole);
      setUserEmail(data.email);
      setUserName(data.full_name);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Check details and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md bg-slate-900 border border-slate-800 p-6 space-y-5 rounded-2xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20 text-white mb-1">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wider">CityPulse Operations Authentication</h2>
          <p className="text-xs text-slate-400">Access role-based smart city management features</p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signin' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {activeTab === 'signin' && (
          <div className="space-y-4">
            {/* 1-Click Quick Demo Shortcuts */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                One-Click Quick Demo Sign In
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'admin@citypulse.gov', 'admin123')}
                  className="p-2 bg-slate-950 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-center transition-all group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 block">👑 Admin</span>
                  <span className="text-[9px] text-slate-400 block">Full Control</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'operator@citypulse.gov', 'operator123')}
                  className="p-2 bg-slate-950 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-center transition-all group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 block">⚡ Operator</span>
                  <span className="text-[9px] text-slate-400 block">Write Access</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'viewer@citypulse.gov', 'viewer123')}
                  className="p-2 bg-slate-950 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-center transition-all group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 block">👁️ Viewer</span>
                  <span className="text-[9px] text-slate-400 block">Read Only</span>
                </button>
              </div>
            </div>

            <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5 text-xs pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                {loading ? 'Authenticating...' : 'Sign In to CityPulse'}
              </button>
            </form>
          </div>
        )}

        {/* Sign Up Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" /> Work Email
              </label>
              <input
                type="email"
                required
                placeholder="alex@citypulse.gov"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Password
              </label>
              <input
                type="password"
                required
                placeholder="Choose a strong password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> System Role
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="operator">Operator (Field Write & Dispatch Access)</option>
                <option value="admin">Administrator (Full System Control)</option>
                <option value="viewer">Public Inspector (Read-Only Access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Account...' : 'Register New Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
