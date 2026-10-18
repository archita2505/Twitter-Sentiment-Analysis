import React from 'react';

interface BadgeProps {
  variant?: 'positive' | 'negative' | 'neutral' | 'brand' | 'demo' | 'outline' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'brand',
  size = 'md',
  children,
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    positive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    negative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    neutral: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    brand: 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30',
    demo: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40 animate-pulse',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
    slate: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  };

  const dotColors = {
    positive: 'bg-emerald-500',
    negative: 'bg-rose-500',
    neutral: 'bg-amber-500',
    brand: 'bg-brand-500',
    demo: 'bg-orange-500',
    outline: 'bg-slate-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full tracking-wide transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
