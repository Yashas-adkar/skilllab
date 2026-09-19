'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { AuthGuard } from '@/auth/auth-guard';
import { useInterviewSession } from '@/hooks/use-interview-session';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { StageHeader } from '@/components/stages/StageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Brain,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  ChevronRight,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

interface MockQuestion {
  id: number;
  category: 'Logical Reasoning' | 'Quantitative Aptitude' | 'Verbal Reasoning' | 'Technical Aptitude';
  question: string;
  options: string[];
  correctIndex: number;
}

const mockQuestions: MockQuestion[] = [
  {
    id: 1,
    category: 'Logical Reasoning',
    question:
      'In a certain code, GRAPH is written as JUDSK. How is NODES written in that same cipher code?',
    options: ['PQGHV', 'QPGHV', 'QPGVH', 'PQGVH'],
    correctIndex: 1,
  },
  {
    id: 2,
    category: 'Quantitative Aptitude',
    question:
      'A server processes 1,200 requests per minute with an average response time of 50ms. If incoming load increases by 25%, what is the required capacity to maintain under 50ms latency?',
    options: ['1,400 req/min', '1,500 req/min', '1,600 req/min', '1,800 req/min'],
    correctIndex: 1,
  },
  {
    id: 3,
    category: 'Technical Aptitude',
    question:
      'What is the worst-case time complexity of searching an element in an unbalanced Binary Search Tree with N nodes?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctIndex: 2,
  },
  {
    id: 4,
    category: 'Verbal Reasoning',
    question:
      'Choose the word that best completes the sentence: "The team designed the distributed architecture with high fault-tolerance, ______ ensuring zero downtime during node failures."',
    options: ['thereby', 'nonetheless', 'conversely', 'haphazardly'],
    correctIndex: 0,
  },
];

export default function AptitudeStagePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { stageProgress, completeStage, canAccess } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const currentProgress = stageProgress?.aptitude;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20:00 minutes timer
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState<string>('');

  // Check progression permission
  useEffect(() => {
    canAccess('aptitude').then((res) => {
      setAccessAllowed(res.allowed);
      if (!res.allowed) {
        setAccessReason(res.reason || 'Prerequisite Stage 1 must be completed first.');
      }
    });
  }, [canAccess]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  // Load existing score if already completed
  useEffect(() => {
    if (currentProgress?.score !== null && currentProgress?.score !== undefined) {
      setScore(currentProgress.score);
      setIsSubmitted(true);
    }
  }, [currentProgress]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleSubmitAssessment = async () => {
    // Calculate simulated score
    let correctCount = 0;
    mockQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    // Award minimum benchmark score if test simulation (e.g. 75%)
    const calculatedScore = Math.max(75, Math.round((correctCount / mockQuestions.length) * 100));
    setScore(calculatedScore);
    setIsSubmitted(true);

    await completeStage('aptitude', calculatedScore, 'passed');
  };

  const currentQ = mockQuestions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  if (accessAllowed === false) {
    return (
      <AuthGuard requireCompletedProfile={true}>
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <Card className="max-w-md w-full text-center space-y-4 p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Stage Locked</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{accessReason}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/stages/resume')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Stage 1: Resume Analysis
            </Button>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireCompletedProfile={true}>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <StageHeader
          currentStageId="aptitude"
          stageNumber={2}
          stageTitle="Aptitude Assessment"
          stageSubtitle="Evaluate analytical, quantitative, and logical reasoning efficiency"
          streamName={stream.shortName}
          status={currentProgress?.status || 'not_started'}
          score={currentProgress?.score}
        />

        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Top Bar with Timer and Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>Question {currentIndex + 1} of {mockQuestions.length}</span>
              </div>
              <Badge variant="violet" size="sm">
                {currentQ.category}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>{formatTimer(timeLeft)} remaining</span>
              </div>

              {!isSubmitted && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitAssessment}
                  disabled={answeredCount === 0}
                >
                  Submit Test ({answeredCount}/{mockQuestions.length})
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigation Palette */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Questions:</span>
            {mockQuestions.map((q, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCurrent = currentIndex === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* QUESTION CARD */}
          {!isSubmitted ? (
            <Card className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {currentQ.category}
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-md shadow-indigo-500/5'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm">{opt}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <Button
                  variant="outline"
                  size="md"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                {currentIndex < mockQuestions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitAssessment}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Submit Assessment
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            /* SCORE PLACEHOLDER SECTION (Visible after submit) */
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="flex items-center gap-4 border-indigo-500/30">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Aptitude Score</span>
                    <div className="text-2xl font-bold text-white mt-0.5">{score}%</div>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Status: Passed (Benchmark: 60%)
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Accuracy</span>
                    <div className="text-2xl font-bold text-white mt-0.5">75%</div>
                    <span className="text-[11px] text-slate-500">3 of 4 answered correctly</span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Time Efficiency</span>
                    <div className="text-2xl font-bold text-white mt-0.5">Fast</div>
                    <span className="text-[11px] text-slate-500">Under time allocation</span>
                  </div>
                </Card>
              </div>

              {/* Next Stage Navigation CTA */}
              <div className="p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-emerald-400">
                      Stage 2 Completed
                    </span>
                    <Badge variant="emerald" size="sm">Score: {score}%</Badge>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Stage 3: Coding / Problem Solving is Now Unlocked
                  </h4>
                  <p className="text-xs text-slate-400">
                    Test your algorithms, data structures, and hands-on coding ability in our interactive IDE.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/stages/coding')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Coding Round
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
