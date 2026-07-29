import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LiveAlertFeed } from './components/LiveAlertFeed';
import { OperationsChat } from './components/OperationsChat';
import { Dashboard } from './pages/Dashboard';
import { Utilities } from './pages/Utilities';
import { Transportation } from './pages/Transportation';
import { PublicServices } from './pages/PublicServices';
import { Infrastructure } from './pages/Infrastructure';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 overflow-y-auto bg-slate-950">
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'utilities' && <Utilities />}
      {activeTab === 'transportation' && <Transportation />}
      {activeTab === 'public_services' && <PublicServices />}
      {activeTab === 'infrastructure' && <Infrastructure />}
    </main>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />
          <MainContent />
          <LiveAlertFeed />
          <OperationsChat />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
