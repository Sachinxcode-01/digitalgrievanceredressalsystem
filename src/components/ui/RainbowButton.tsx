import React from 'react';
import { cn } from '@/lib/utils';

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const RainbowButton = ({ children, className, ...props }: RainbowButtonProps) => {
  return (
    <button 
      className={cn(
        "rainbow-border relative flex items-center justify-center gap-2 px-6 py-2 bg-[#0b1120] rounded-xl border-none text-white cursor-pointer font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
