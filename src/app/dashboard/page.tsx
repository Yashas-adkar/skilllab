'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { AuthGuard } from '@/auth/auth-guard';
import { useInterviewSession } from '@/hooks/use-interview-session';
import { STAGES } from '@/config/site';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { StageId } from '@/types/auth.types';
import {
  Sparkles,
  Compass,
  FileText,
  Brain,
  Code,
  Mic,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  Award,
  Layers,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

const stageIcons: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Mic: <Mic className="w-5 h-5" />,
};

const stageRouteMap: Record<StageId, string> = {
  resume: '/stages/resume',
  aptitude: '/stages/aptitude',
  coding: '/stages/coding',
  interview: '/stages/interview',
};

function DashboardContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { session, stageProgress, scores } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  // Count completed stages
  const completedCount = ['resume', 'aptitude', 'coding', 'interview'].filter(
    (s) =>
      stageProgress?.[s as StageId]?.status === 'passed' ||
      stageProgress?.[s as StageId]?.status === 'completed'
  ).length;

  const isAllComplete = completedCount === 4;

  const getStageStatusInfo = (stageId: StageId, idx: number) => {
    const progress = stageProgress?.[stageId];
    const status = progress?.status || 'not_started';
    const score = progress?.score;

    if (status === 'passed') {
      return {
        badge: (
          <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
            Passed ({score}%)
          </Badge>
        ),
        buttonText: 'Review Stage',
        buttonVariant: 'outline' as const,
        isLocked: false,
      };
    }

    if (status === 'needs_improvement') {
      return {
        badge: (
          <Badge variant="amber" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>
            Needs Improvement ({score}%)
          </Badge>
        ),
        buttonText: 'Re-Attempt',
        buttonVariant: 'primary' as const,
        isLocked: false,
      };
    }

    if (status === 'in_progress') {
      return {
        badge: (
          <Badge variant="blue" size="sm" icon={<Clock className="w-3 h-3" />}>
            In Progress
          </Badge>
        ),
        buttonText: 'Continue Stage',
        buttonVariant: 'primary' as const,
        isLocked: false,
      };
    }

    // Check if previous stage is finished
    if (idx === 0) {
      return {
        badge: <Badge variant="blue" size="sm">Ready to Start</Badge>,
        buttonText: 'Start Stage',
        buttonVariant: 'primary' as const,
        isLocked: false,
      };
    }

    const prevStageId = ['resume', 'aptitude', 'coding', 'interview'][idx - 1] as StageId;
    const prevStatus = stageProgress?.[prevStageId]?.status;
    const prevCompleted = prevStatus === 'passed' || prevStatus === 'completed';

    if (prevCompleted) {
      return {
        badge: <Badge variant="indigo" size="sm">Unlocked</Badge>,
        buttonText: 'Start Stage',
        buttonVariant: 'primary' as const,
        isLocked: false,
      };
    }

    return {
      badge: (
        <Badge variant="slate" size="sm" icon={<Lock className="w-3 h-3" />}>
          Locked (Pending Stage {idx})
        </Badge>
      ),
      buttonText: 'Locked',
      buttonVariant: 'outline' as const,
      isLocked: true,
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" size="sm" icon={<Compass className="w-3.5 h-3.5" />}>
                Track: {stream.name}
              </Badge>
              {profile?.profileInformation?.headline && (
                <span className="text-xs text-slate-400 border-l border-slate-700 pl-2">
                  Target: {profile.profileInformation.headline}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hi, {user?.displayName || 'Candidate'} 👋
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ready to prepare for your next interview? The platform contains four progressive preparation stages designed to measure and elevate your readiness for <strong className="text-white">{stream.shortName}</strong> roles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href="/profile">
              <Button variant="outline" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                Change Stream / Profile
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* COMPLETED PIPELINE BANNER (If all 4 stages finished) */}
      {isAllComplete && (
        <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn shadow-xl shadow-emerald-500/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                All 4 Stages Completed
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-white">
              Your AI Interview Readiness Report is Ready
            </h3>
            <p className="text-xs text-slate-400">
              View your overall score, category breakdown, identified strengths, and improvement plan.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/stages/evaluation')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            View Evaluation Report
          </Button>
        </div>
      )}

      {/* Progress & Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Preparation Progress</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {Math.round((completedCount / 4) * 100)}%
            </div>
            <div className="text-[11px] text-slate-500">{completedCount} of 4 stages complete</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Pipeline Progression</div>
            <div className="text-2xl font-bold text-white mt-0.5">{completedCount} / 4</div>
            <div className="text-[11px] text-slate-500">Sequential advancement</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Track</div>
            <div className="text-lg font-bold text-white mt-0.5 truncate max-w-[160px]">
              {stream.shortName}
            </div>
            <div className="text-[11px] text-slate-500">
              {stream.recommendedSkills.length} Core Competencies
            </div>
          </div>
        </Card>
      </div>

      {/* 4 STAGES PIPELINE SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interview Preparation Stages
            </h2>
            <p className="text-xs text-slate-400">
              Advance through each stage to simulate a full real-world hiring loop.
            </p>
          </div>
        </div>

        {/* 4 Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAGES.map((stage, idx) => {
            const statusInfo = getStageStatusInfo(stage.id, idx);
            const targetRoute = stageRouteMap[stage.id];

            return (
              <Card
                key={stage.id}
                hoverable
                className="flex flex-col justify-between border-slate-800/90 hover:border-slate-700 space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar with Stage Number and Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      Stage {stage.stageNumber}
                    </span>
                    {statusInfo.badge}
                  </div>

                  {/* Icon & Title */}
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 text-indigo-400 flex items-center justify-center">
                      {stageIcons[stage.iconName]}
                    </div>
                    <h3 className="font-bold text-base text-white">{stage.title}</h3>
                    <p className="text-xs font-medium text-indigo-400">{stage.subtitle}</p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {stage.description}
                  </p>

                  {/* Criteria Focus */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                      Evaluation Focus
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {stage.criteriaSummary}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Duration & Action Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{stage.durationMinutes} mins</span>
                  </div>

                  <Button
                    variant={statusInfo.buttonVariant}
                    size="sm"
                    disabled={statusInfo.isLocked}
                    onClick={() => router.push(targetRoute)}
                    rightIcon={
                      statusInfo.isLocked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <ArrowRight className="w-3 h-3" />
                      )
                    }
                  >
                    {statusInfo.buttonText}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireCompletedProfile={true}>
      <DashboardContent />
    </AuthGuard>
  );
}
