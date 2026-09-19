'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StageId } from '@/types/auth.types';
import { StageWorkflowStatus } from '@/types/workflow.types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  FileText,
  Brain,
  Code,
  Mic,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StageHeaderProps {
  currentStageId: StageId | 'evaluation';
  stageNumber: number;
  stageTitle: string;
  stageSubtitle: string;
  streamName: string;
  status: StageWorkflowStatus;
  score?: number | null;
}

const stagesList: { id: StageId | 'evaluation'; label: string; number: number }[] = [
  { id: 'resume', label: 'Resume', number: 1 },
  { id: 'aptitude', label: 'Aptitude', number: 2 },
  { id: 'coding', label: 'Coding', number: 3 },
  { id: 'interview', label: 'AI Interview', number: 4 },
];

export const StageHeader: React.FC<StageHeaderProps> = ({
  currentStageId,
  stageNumber,
  stageTitle,
  stageSubtitle,
  streamName,
  status,
  score,
}) => {
  const router = useRouter();

  const getStatusBadge = () => {
    switch (status) {
      case 'passed':
        return (
          <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
            Passed {score !== undefined && score !== null ? `(${score}%)` : ''}
          </Badge>
        );
      case 'needs_improvement':
        return (
          <Badge variant="amber" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>
            Needs Improvement {score !== undefined && score !== null ? `(${score}%)` : ''}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="blue" size="sm" icon={<Clock className="w-3 h-3" />}>
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="indigo" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
            Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="slate" size="sm">
            Not Started
          </Badge>
        );
    }
  };

  return (
    <div className="w-full bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md sticky top-16 z-30 py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back button & Stage Title */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Dashboard
            </Button>
          </Link>
          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Stage {stageNumber}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">{streamName}</span>
              {getStatusBadge()}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {stageTitle}
            </h1>
          </div>
        </div>

        {/* Right: Pipeline Stepper */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {stagesList.map((stg, idx) => {
            const isCurrent = currentStageId === stg.id;
            const isPast = stageNumber > stg.number;
            return (
              <div key={stg.id} className="flex items-center">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : isPast
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-500 bg-slate-900/50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-indigo-500 text-white'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : stg.number}
                  </span>
                  <span className="hidden sm:inline">{stg.label}</span>
                </div>
                {idx < stagesList.length - 1 && (
                  <span className="text-slate-700 px-1">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
