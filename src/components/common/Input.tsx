'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-300 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-slate-900/80 border text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 outline-none
              ${leftIcon ? 'pl-10' : ''}
              ${rightElement ? 'pr-11' : ''}
              ${
                error
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-red-400 flex items-center gap-1 mt-0.5 animate-fadeIn">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
