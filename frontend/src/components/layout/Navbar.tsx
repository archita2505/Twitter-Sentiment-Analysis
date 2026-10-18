import React from 'react';
import { Sun, Moon, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { NavPage } from '../../types';
import { Badge } from '../common/Badge';

interface NavbarProps {
  currentPage: NavPage;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isBackendOnline: boolean;
  isModelReady: boolean;
  isDemoMode: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  isDarkMode,
  onToggleTheme,
  isBackendOnline,
  isModelReady,
  isDemoMode,
  onRefresh,
  isRefreshing = false,
}) => {
  const pageTitles: Record<NavPage, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Global sentiment metrics and overview' },
    analyze: { title: 'Analyze Tweet', subtitle: 'Real-time NLP sentiment inference' },
    dataset: { title: 'Dataset Explorer', subtitle: 'Inspect, filter, and batch classify tweets' },
    analytics: { title: 'Analytics', subtitle: 'Deep dive sentiment trends and distributions' },
    model: { title: 'Model Performance', subtitle: 'Held-out test set metrics and confusion matrix' },
    history: { title: 'Analysis History', subtitle: 'Persistent SQLite analysis archive' },
    settings: { title: 'Settings', subtitle: 'Platform configuration, API endpoints & model controls' },
  };

  const currentInfo = pageTitles[currentPage];

  return (
    <header className="sticky top-0 z-30 h-18 px-6 glass-panel border-b border-white/5 flex items-center justify-between">
      {/* Breadcrumbs & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>PulseSentiment</span>
          <span>/</span>
          <span className="text-brand-400 capitalize">{currentPage}</span>
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {currentInfo.title}
        </h1>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-3">
        {/* Backend Online / Offline indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-white/5 text-xs font-medium">
          {isBackendOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">API Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400">API Offline</span>
            </>
          )}
        </div>

        {/* Model Mode Badge */}
        {isDemoMode ? (
          <Badge variant="demo" size="md" dot>
            Model Unavailable
          </Badge>
        ) : isModelReady ? (
          <Badge variant="positive" size="md" dot>
            Trained Model Active
          </Badge>
        ) : (
          <Badge variant="neutral" size="md" dot>
            Model Not Trained
          </Badge>
        )}

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            title="Refresh current data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            AI
          </div>
        </div>
      </div>
    </header>
  );
};
