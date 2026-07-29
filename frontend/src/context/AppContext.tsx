import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../types';
import { API_BASE_URL } from '../services/api';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDistrictId: number | null;
  setSelectedDistrictId: (id: number | null) => void;
  isAlertDrawerOpen: boolean;
  setIsAlertDrawerOpen: (open: boolean) => void;
  isChatDrawerOpen: boolean;
  setIsChatDrawerOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  logout: () => void;
  wsConnected: boolean;
  lastLiveEvent: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [userRole, setUserRole] = useState<UserRole>(
    (localStorage.getItem('citypulse_role') as UserRole) || 'operator'
  );
  const [userEmail, setUserEmail] = useState<string>(
    localStorage.getItem('citypulse_email') || 'operator@citypulse.gov'
  );
  const [userName, setUserName] = useState<string>(
    localStorage.getItem('citypulse_name') || 'Ops Lead Specialist'
  );
  const [authToken, setAuthTokenState] = useState<string | null>(
    localStorage.getItem('citypulse_token') || null
  );

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [lastLiveEvent, setLastLiveEvent] = useState<any>(null);

  const setAuthToken = (token: string | null) => {
    setAuthTokenState(token);
    if (token) {
      localStorage.setItem('citypulse_token', token);
    } else {
      localStorage.removeItem('citypulse_token');
    }
  };

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('citypulse_role', role);
  };

  const handleSetUserEmail = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('citypulse_email', email);
  };

  const handleSetUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem('citypulse_name', name);
  };

  const logout = () => {
    setAuthToken(null);
    handleSetUserRole('viewer');
    handleSetUserEmail('viewer@citypulse.gov');
    handleSetUserName('Public Viewer');
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      try {
        // Derive WS URL dynamically from API_BASE_URL if VITE_WS_BASE_URL is not set
        let wsUrl = import.meta.env.VITE_WS_BASE_URL;
        if (!wsUrl) {
          const httpUrl = API_BASE_URL.replace('/api', '');
          wsUrl = httpUrl.replace(/^http/, 'ws') + '/ws/live';
        }

        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastLiveEvent(data);
          } catch (e) {
            console.error('[WebSocket] Message parse error:', e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        setWsConnected(false);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedDistrictId,
        setSelectedDistrictId,
        isAlertDrawerOpen,
        setIsAlertDrawerOpen,
        isChatDrawerOpen,
        setIsChatDrawerOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        userRole,
        setUserRole: handleSetUserRole,
        userEmail,
        setUserEmail: handleSetUserEmail,
        userName,
        setUserName: handleSetUserName,
        authToken,
        setAuthToken,
        logout,
        wsConnected,
        lastLiveEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
