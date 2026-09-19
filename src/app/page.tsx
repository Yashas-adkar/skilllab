'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { STAGES } from '@/config/site';
import { CAREER_STREAMS } from '@/config/streams';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Brain,
  FileText,
  Code,
  Mic,
  Award,
  Terminal,
  Cpu,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

const streamIconMap: Record<string, React.ReactNode> = {
  Terminal: <Terminal className="w-5 h-5 text-blue-400" />,
  Cpu: <Cpu className="w-5 h-5 text-violet-400" />,
  BarChart3: <BarChart3 className="w-5 h-5 text-cyan-400" />,
};

const stageIcons: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Mic: <Mic className="w-5 h-5" />,
};

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured 4-Stage AI Interview Pipeline</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Master Technical Interviews with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
              AI-Powered Simulation
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Prepare for real-world technical roles across Software Engineering, AI/ML, and Data Science. Progress through structured resume analysis, aptitude, coding, and dynamic voice mock interviews.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CORE 4 STAGES SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="indigo" size="sm">
            Core Interview Pipeline
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Four Rigorous Evaluation Stages
          </h2>
          <p className="text-sm text-slate-400">
            A comprehensive sequential interview preparation flow simulating real employer hiring loops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAGES.map((stage) => (
            <Card key={stage.id} hoverable className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Stage {stage.stageNumber}
                </span>
                <span className="text-[11px] text-slate-400">~{stage.durationMinutes}m</span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                {stageIcons[stage.iconName]}
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{stage.title}</h3>
                <p className="text-xs text-indigo-400 font-medium">{stage.subtitle}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <strong className="text-slate-300">Focus:</strong> {stage.criteriaSummary}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SUPPORTED CAREER STREAMS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="cyan" size="sm">
              Extensible Career Streams
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Tailored Criteria for Every Domain
            </h2>
            <p className="text-sm text-slate-400">
              Each career stream features custom resume ATS weights, specialized questions, and stream-specific rubrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CAREER_STREAMS.map((stream) => (
              <Card key={stream.id} hoverable className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                    {streamIconMap[stream.icon]}
                  </div>
                  <Badge variant="slate" size="sm">
                    {stream.recommendedSkills.length} Core Skills
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">{stream.name}</h3>
                  <p className="text-xs text-indigo-400 mt-0.5">{stream.tagline}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {stream.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                    Key Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stream.recommendedSkills.slice(0, 4).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 text-center bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to begin your preparation?</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Create an account, select your career stream, and benchmark your technical interview readiness with structured AI evaluations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
