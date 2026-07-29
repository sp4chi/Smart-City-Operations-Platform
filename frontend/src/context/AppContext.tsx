import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../types';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDistrictId: number | null;
  setSelectedDistrictId: (id: number | null) => void;
  isAlertDrawerOpen: boolean;
  setIsAlertDrawerOpen: (open: boolean) => void;
  isChatDrawerOpen: boolean;
  setIsChatDrawerOpen: (open: boolean) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  wsConnected: boolean;
  lastLiveEvent: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [lastLiveEvent, setLastLiveEvent] = useState<any>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/live');
        
        ws.onopen = () => {
          setWsConnected(true);
          console.log('[WebSocket] Connected to live simulation metric stream.');
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
          console.log('[WebSocket] Connection closed. Reconnecting in 3s...');
          reconnectTimeout = setTimeout(connectWS, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[WebSocket] Connection error:', err);
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
        userRole,
        setUserRole,
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
