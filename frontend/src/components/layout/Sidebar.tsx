import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  BarChart3,
  Cpu,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Radio,
} from 'lucide-react';
import type { NavPage } from '../../types';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isModelReady: boolean;
  isDemoMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
  isModelReady,
  isDemoMode,
}) => {
  const menuItems: { id: NavPage; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'analyze', label: 'Analyze Tweet', icon: <Sparkles className="w-5 h-5 text-brand-400" /> },
    { id: 'dataset', label: 'Dataset Explorer', icon: <Database className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'model', label: 'Model Performance', icon: <Cpu className="w-5 h-5" /> },
    { id: 'history', label: 'Analysis History', icon: <History className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out glass-panel border-r border-white/5 dark:border-white/5 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between h-18 px-5 border-b border-white/5">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
                  PulseSentiment
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20">
                    NLP Engine
                  </span>
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 rounded-xl mx-auto bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/30 to-indigo-600/20 text-white border border-brand-500/40 shadow-sm shadow-brand-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <div
                  className={`transition-colors ${
                    isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                </div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-5 rounded-full bg-brand-500 shadow-sm" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Model Status Widget */}
      <div className="p-3 border-t border-white/5">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Model Status</span>
              <div className="flex items-center gap-1.5">
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isModelReady ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                  }`}
                />
                <span
                  className={`text-[11px] font-semibold ${
                    isModelReady ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isDemoMode ? 'Model Unavailable' : isModelReady ? 'Trained Model' : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {isDemoMode
                ? 'Predictions disabled until a model is loaded'
                : 'Word/Character/Negation TF-IDF v2.0'}
            </p>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:bg-white/5"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
