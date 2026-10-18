import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div
      className={`glass-card rounded-2xl p-6 relative overflow-hidden ${
        glow ? 'border-brand-500/30 shadow-glass-glow' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className = '' }) => {
  return (
    <div className={`flex items-start justify-between pb-4 border-b border-white/5 dark:border-white/5 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
