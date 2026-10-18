import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzeTweetPage } from './pages/AnalyzeTweetPage';
import { DatasetExplorerPage } from './pages/DatasetExplorerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import type { NavPage, HealthStatus } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Synchronize Dark / Light mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  // Initial and recurring health check
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealthStatus(data);
      setIsBackendOnline(true);
    } catch {
      setIsBackendOnline(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isModelReady = !!(healthStatus && healthStatus.model_loaded);
  const isDemoMode = !isModelReady || (healthStatus && healthStatus.model_mode === 'not_trained');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Ambient background glow accents */}
      <div className="glow-ambient hidden dark:block" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[450px] h-[450px] bg-brand-900/10 rounded-full blur-[80px] pointer-events-none hidden dark:block" />

      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        isModelReady={isModelReady}
        isDemoMode={Boolean(isDemoMode)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          currentPage={currentPage}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((d) => !d)}
          isBackendOnline={isBackendOnline}
          isModelReady={isModelReady}
          isDemoMode={Boolean(isDemoMode)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto" key={refreshKey}>
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentPage}
              isBackendOnline={isBackendOnline}
              isDemoMode={Boolean(isDemoMode)}
            />
          )}

          {currentPage === 'analyze' && <AnalyzeTweetPage />}

          {currentPage === 'dataset' && <DatasetExplorerPage />}

          {currentPage === 'analytics' && <AnalyticsPage />}

          {currentPage === 'model' && <ModelPerformancePage />}

          {currentPage === 'history' && <HistoryPage />}

          {currentPage === 'settings' && (
            <SettingsPage
              healthStatus={healthStatus}
              onRefreshHealth={checkHealth}
              isBackendOnline={isBackendOnline}
              isDemoMode={Boolean(isDemoMode)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
