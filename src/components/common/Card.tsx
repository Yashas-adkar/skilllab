import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  glow = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 transition-all duration-300
        ${
          hoverable
            ? 'hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5'
            : ''
        }
        ${glow ? 'shadow-lg shadow-indigo-500/10 border-indigo-500/30' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
