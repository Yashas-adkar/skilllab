'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { AuthGuard } from '@/auth/auth-guard';
import { useInterviewSession } from '@/hooks/use-interview-session';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileText,
  Brain,
  Code,
  Mic,
  LayoutDashboard,
  Target,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { EvaluationReport } from '@/types/workflow.types';

export default function FinalEvaluationPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { session } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      WorkflowRepository.getEvaluation(session.id).then((evalReport) => {
        if (evalReport) {
          setEvaluation(evalReport);
        } else {
          // Provide default initial structure if accessed directly
          setEvaluation({
            id: `eval_${session.id}`,
            sessionId: session.id,
            userId: user?.uid || '',
            streamId: stream.id,
            overallScore: 86,
            preparationPercentage: 100,
            stageScores: {
              resume: 84,
              aptitude: 75,
              coding: 90,
              interview: 88,
            },
            strengths: [
              'Strong algorithmic problem solving and time-complexity optimization.',
              'High technical fluency articulating distributed caching and rate-limiting tradeoffs.',
              'Structured communication with clear problem-solving frameworks.',
            ],
            weaknesses: [
              'Aptitude question speed on quantitative permutations was slightly below benchmark.',
              'Resume could emphasize quantified latency and scale metrics more prominently.',
            ],
            recommendations: [
              'Review multi-region distributed consensus algorithms (Raft, Paxos) for senior system design rounds.',
              'Practice 15-minute speed drills on probability and combinatorics aptitude.',
              'Incorporate quantifiable achievements in the resume project impact sections.',
            ],
            createdAt: new Date().toISOString(),
          });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [session, user, stream.id]);

  const handleRetake = async () => {
    if (!user) return;
    // Reset session for fresh run
    await WorkflowRepository.getOrCreateActiveSession(user.uid, stream.id, 'completion_based', true);
    router.push('/stages/resume');
  };

  return (
    <AuthGuard requireCompletedProfile={true}>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="w-full bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md sticky top-16 z-30 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Comprehensive Evaluation
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Interview Readiness Report
                </h1>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
            >
              Dashboard
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Top Score Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="indigo" size="sm">
                    {stream.name}
                  </Badge>
                  <Badge variant="emerald" size="sm">
                    Status: Interview Ready
                  </Badge>
                </div>

                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Congratulations, {user?.displayName || 'Candidate'}!
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  You have successfully completed all 4 stages of technical interview preparation. Below is your comprehensive assessment breakdown, strengths analysis, and target growth areas.
                </p>
              </div>

              {/* Overall Score Circle Card */}
              <div className="flex items-center gap-6 p-6 bg-slate-950/70 border border-slate-800/80 rounded-2xl shrink-0">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {evaluation?.overallScore ?? 86}%
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-1 block">
                    Overall Readiness
                  </span>
                </div>

                <div className="h-12 w-[1px] bg-slate-800" />

                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    {evaluation?.preparationPercentage ?? 100}%
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-1 block">
                    Pipeline Complete
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 STAGE SCORE BREAKDOWN CARDS */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>Stage-by-Stage Performance Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage 1 */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <Badge variant="emerald" size="sm">Passed</Badge>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Stage 1: Resume Analysis</span>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {evaluation?.stageScores.resume ?? 84}%
                  </div>
                  <span className="text-[11px] text-slate-500">ATS Keyword & Impact Alignment</span>
                </div>
              </Card>

              {/* Stage 2 */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <Badge variant="emerald" size="sm">Passed</Badge>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Stage 2: Aptitude Test</span>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {evaluation?.stageScores.aptitude ?? 75}%
                  </div>
                  <span className="text-[11px] text-slate-500">Analytical & Logic Efficiency</span>
                </div>
              </Card>

              {/* Stage 3 */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Code className="w-4 h-4" />
                  </div>
                  <Badge variant="emerald" size="sm">Passed</Badge>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Stage 3: Coding Assessment</span>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {evaluation?.stageScores.coding ?? 90}%
                  </div>
                  <span className="text-[11px] text-slate-500">Complexity & Test Cases Passed</span>
                </div>
              </Card>

              {/* Stage 4 */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <Badge variant="emerald" size="sm">Passed</Badge>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Stage 4: AI Mock Interview</span>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {evaluation?.stageScores.interview ?? 88}%
                  </div>
                  <span className="text-[11px] text-slate-500">System Design & Communication</span>
                </div>
              </Card>
            </div>
          </div>

          {/* STRENGTHS & WEAKNESSES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Identified Core Strengths</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                {evaluation?.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Weaknesses */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Identified Weaknesses & Growth Areas</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                {evaluation?.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-amber-400 font-bold mt-0.5">!</span>
                    <span className="leading-relaxed">{weak}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* ACTIONABLE RECOMMENDATIONS */}
          <Card className="space-y-4 border-indigo-500/30">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <TrendingUp className="w-5 h-5" />
              <span>Recommended Next Steps & Action Plan</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              {evaluation?.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5"
                >
                  <span className="text-xs font-bold text-indigo-400 uppercase">
                    Step {i + 1}
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              size="md"
              onClick={handleRetake}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retake Interview Pipeline
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/dashboard')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Back to Preparation Dashboard
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
