'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export interface PasswordCriterion {
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string): {
  score: number; // 0 to 5
  criteria: PasswordCriterion[];
  label: string;
  colorClass: string;
} {
  const criteria: PasswordCriterion[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'Contains an uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Contains a number (0-9)', met: /[0-9]/.test(password) },
    { label: 'Contains a special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  let label = 'Very Weak';
  let colorClass = 'bg-red-500';

  if (score >= 5) {
    label = 'Strong';
    colorClass = 'bg-emerald-500';
  } else if (score >= 4) {
    label = 'Good';
    colorClass = 'bg-indigo-500';
  } else if (score >= 3) {
    label = 'Fair';
    colorClass = 'bg-amber-500';
  } else if (score >= 1) {
    label = 'Weak';
    colorClass = 'bg-red-400';
  }

  return { score, criteria, label, colorClass };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const { score, criteria, label, colorClass } = evaluatePassword(password);
  const percentage = Math.round((score / 5) * 100);

  return (
    <div className="w-full mt-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Password Strength</span>
        <span
          className={`font-semibold ${
            score >= 4
              ? 'text-emerald-400'
              : score >= 3
              ? 'text-amber-400'
              : 'text-red-400'
          }`}
        >
          {label}
        </span>
      </div>

      {/* Progress Bar Segments */}
      <div className="grid grid-cols-5 gap-1.5 h-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-full rounded-full transition-all duration-300 ${
              score >= level ? colorClass : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {criteria.map((c, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              c.met ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {c.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            )}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
