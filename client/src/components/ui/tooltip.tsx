
import React, { useState } from 'react';

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-block">{children}</div>
);

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === TooltipTrigger) return child;
          if (child.type === TooltipContent && isVisible) return child;
        }
        return null;
      })}
    </div>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode, asChild?: boolean }> = ({ children }) => (
  <>{children}</>
);

export const TooltipContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded shadow-lg z-[100] min-w-[200px] ${className}`}>
    {children}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
  </div>
);
