import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button
          type="button"
          aria-label="More information"
          className="text-slate-400 hover:text-brand-400 transition-colors cursor-help focus:outline-none"
        >
          <HelpCircle className="w-3.5 h-3.5 ml-1" />
        </button>
      )}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 w-64 p-2.5 text-xs text-slate-200 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md pointer-events-none transition-all duration-150 ${
            position === 'top'
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              : 'top-full mt-2 left-1/2 -translate-x-1/2'
          }`}
        >
          {content}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-slate-700/80 rotate-45 ${
              position === 'top'
                ? 'top-full -mt-1 border-r border-b'
                : 'bottom-full -mb-1 border-l border-t'
            }`}
          />
        </div>
      )}
    </div>
  );
};
