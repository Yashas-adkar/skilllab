import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, Lock, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-300">SkillLab AI Mock Interview Platform</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Production Architecture Foundation</span>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400/80" />
            <span>Firebase Security Rules Active</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400/80" />
            <span>Strict Auth Provider</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
