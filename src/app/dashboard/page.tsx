'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { AuthGuard } from '@/auth/auth-guard';
import { STAGES } from '@/config/site';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  Sparkles,
  Compass,
  FileText,
  Brain,
  Code,
  Mic,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';

const stageIcons: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Mic: <Mic className="w-5 h-5" />,
};

function DashboardContent() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const completedCount = profile?.interviewProgress?.completedStages?.length || 0;
  const readinessScore = profile?.interviewProgress?.overallScore ?? 0;

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
              Welcome back, {user?.displayName || 'Candidate'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your preparation pipeline is personalized for{' '}
              <strong className="text-white">{stream.shortName}</strong>. Progress through the 4 stages below to generate your final AI interview-readiness evaluation.
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

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Interview Readiness</div>
            <div className="text-2xl font-bold text-white mt-0.5">{readinessScore}%</div>
            <div className="text-[11px] text-slate-500">Evaluated post 4 stages</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Stages Completed</div>
            <div className="text-2xl font-bold text-white mt-0.5">{completedCount} / 4</div>
            <div className="text-[11px] text-slate-500">Pipeline in sequence</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Stream</div>
            <div className="text-lg font-bold text-white mt-0.5 truncate max-w-[160px]">
              {stream.shortName}
            </div>
            <div className="text-[11px] text-slate-500">{stream.recommendedSkills.length} Core Competencies</div>
          </div>
        </Card>
      </div>

      {/* Architectural Phase Notice */}
      <div className="p-4 bg-slate-900/90 border border-indigo-500/20 rounded-2xl flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-sm">
          <span className="font-semibold text-white">
            Architecture Step: Authentication & User Profile Foundation Ready
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            The authentication system, Firestore user document repository, stream configuration, and protected application boundaries are verified. Per specifications, the interactive stage engines (Resume Analysis, Aptitude Test, Coding Assessment, and AI Mock Interview) will be unlocked in the subsequent development step.
          </p>
        </div>
      </div>

      {/* Stages Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Interview Preparation Stages</h2>
            <p className="text-xs text-slate-400">
              Each stage assesses specific dimensions of technical readiness for {stream.name}.
            </p>
          </div>
        </div>

        {/* 4 Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAGES.map((stage, idx) => {
            const isFirst = idx === 0;
            const isCompleted = profile?.interviewProgress?.completedStages?.includes(stage.id);

            return (
              <Card
                key={stage.id}
                hoverable
                className="flex flex-col justify-between border-slate-800/90 hover:border-slate-700 space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar with Number and Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      Stage {stage.stageNumber}
                    </span>

                    {isCompleted ? (
                      <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                        Completed
                      </Badge>
                    ) : isFirst ? (
                      <Badge variant="blue" size="sm">
                        Ready to Start
                      </Badge>
                    ) : (
                      <Badge variant="slate" size="sm" icon={<Lock className="w-3 h-3" />}>
                        Pending Stage {idx}
                      </Badge>
                    )}
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
                      Key Criteria
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {stage.criteriaSummary}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Duration & Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{stage.durationMinutes} mins</span>
                  </div>

                  <Button
                    variant={isFirst ? 'primary' : 'outline'}
                    size="sm"
                    disabled={!isFirst}
                    onClick={() => {
                      alert(`Stage ${stage.stageNumber}: ${stage.title} will be implemented in the next step per instruction.`);
                    }}
                    rightIcon={isFirst ? <Play className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  >
                    {isCompleted ? 'Review' : isFirst ? 'Start Stage' : 'Locked'}
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
