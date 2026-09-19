import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'blue' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
