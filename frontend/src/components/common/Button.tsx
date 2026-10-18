import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20 active:scale-[0.98]',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-slate-800/40 text-slate-300 border border-slate-700 hover:border-slate-600 active:scale-[0.98]',
    danger:
      'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 active:scale-[0.98]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg font-medium gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl font-medium gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl font-semibold gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
      <span>{children}</span>
    </button>
  );
};
