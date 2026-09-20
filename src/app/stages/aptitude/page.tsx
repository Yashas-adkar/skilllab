'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  BarChart2,
  RotateCcw,
  BookOpen,
  Check,
  X,
  History,
  ListOrdered,
  ChevronRight,
} from 'lucide-react';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { AptitudeAttemptRecord, AptitudeQuestionReviewItem } from '@/types/workflow.types';

interface CleanAptitudeQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
}

export default function AptitudeStagePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { session, stageProgress, completeStage, canAccess } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const currentProgress = stageProgress?.aptitude;

  // View state: 'test' | 'results' | 'review' | 'history'
  const [viewState, setViewState] = useState<'test' | 'results' | 'review' | 'history'>('test');
  const [questions, setQuestions] = useState<CleanAptitudeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20:00 minutes timer
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState<string>('');

  // Result state
  const [latestAttempt, setLatestAttempt] = useState<AptitudeAttemptRecord | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AptitudeAttemptRecord[]>([]);

  const isLoadedRef = useRef(false);

  // Check progression permission
  useEffect(() => {
    canAccess('aptitude').then((res) => {
      setAccessAllowed(res.allowed);
      if (!res.allowed) {
        setAccessReason(res.reason || 'Prerequisite Stage 1 must be completed first.');
      }
    });
  }, [canAccess]);

  // Load Attempt History & Latest Attempt
  const loadHistory = useCallback(async () => {
    if (!user) return;
    const history = await WorkflowRepository.getAptitudeAttempts(user.uid, stream.id);
    setAttemptHistory(history);
    if (history.length > 0 && !latestAttempt) {
      setLatestAttempt(history[0]);
    }
  }, [user, stream.id, latestAttempt]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Load 10 fresh questions
  const loadNewTest = useCallback(
    async (forceFresh: boolean = false) => {
      setIsLoadingQuestions(true);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setTimeLeft(20 * 60);

      try {
        // Collect question IDs from recent attempts to avoid repetition
        let excludedIds: string[] = [];
        if (user) {
          const past = await WorkflowRepository.getAptitudeAttempts(user.uid, stream.id);
          excludedIds = past.flatMap((a) => a.questions.map((q) => q.id));
        }

        const res = await fetch('/api/stages/aptitude/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: stream.id,
            count: 10,
            excludedIds,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setQuestions(data.questions);
            setViewState('test');
          }
        }
      } catch (err) {
        console.error('Failed to load aptitude questions:', err);
      } finally {
        setIsLoadingQuestions(false);
      }
    },
    [user, stream.id]
  );

  // Initial load
  useEffect(() => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    // Check if session already has a recorded attempt
    if (session) {
      WorkflowRepository.getLatestAptitudeAttempt(session.id).then((att) => {
        if (att) {
          setLatestAttempt(att);
          setViewState('results');
          setIsLoadingQuestions(false);
        } else {
          loadNewTest();
        }
      });
    } else {
      loadNewTest();
    }
  }, [session, loadNewTest]);

  // Timer countdown
  useEffect(() => {
    if (viewState !== 'test') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [viewState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQ || viewState !== 'test') return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleSubmitAssessment = async () => {
    if (questions.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        sessionId: session?.id || `session_${Date.now()}`,
        userId: user?.uid || '',
        streamId: stream.id,
        streamName: stream.shortName,
        answers: selectedAnswers,
        questionIds: questions.map((q) => q.id),
      };

      const res = await fetch('/api/stages/aptitude/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setLatestAttempt(result.attempt);
        setAttemptHistory((prev) => [result.attempt, ...prev]);

        // Complete stage in session progression
        const passedStatus = result.score >= 60 ? 'passed' : 'needs_improvement';
        await completeStage('aptitude', result.score, passedStatus);

        setViewState('results');
      } else {
        alert('Assessment submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error submitting assessment. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accessAllowed === false) {
    return (
      <AuthGuard requireCompletedProfile={true}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
          <Card className="max-w-md w-full text-center space-y-4 p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Stage Locked</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{accessReason}</p>
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

  const reviewQ: AptitudeQuestionReviewItem | undefined =
    latestAttempt?.questions?.[reviewIndex];

  return (
    <AuthGuard requireCompletedProfile={true}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <StageHeader
          currentStageId="aptitude"
          stageNumber={2}
          stageTitle="Aptitude Assessment"
          stageSubtitle="Evaluate analytical, quantitative, logical, and technical efficiency"
          streamName={stream.shortName}
          status={currentProgress?.status || 'not_started'}
          score={latestAttempt ? latestAttempt.score : currentProgress?.score}
        />

        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 flex flex-col">
          {/* Top Bar with Timer, Mode Switcher & Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {viewState === 'test' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                  </div>
                  {currentQ && (
                    <Badge variant="blue" size="sm">
                      {currentQ.category}
                    </Badge>
                  )}
                </>
              )}

              {viewState === 'results' && (
                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="md" icon={<CheckCircle2 className="w-4 h-4" />}>
                    Attempt Completed
                  </Badge>
                  <span className="text-xs text-slate-500">
                    Score: <strong>{latestAttempt?.score}%</strong>
                  </span>
                </div>
              )}

              {viewState === 'review' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      Reviewing: Question {reviewIndex + 1} of {latestAttempt?.questions.length || 10}
                    </span>
                  </div>
                  {reviewQ && (
                    <Badge variant="blue" size="sm">
                      {reviewQ.category}
                    </Badge>
                  )}
                </>
              )}

              {viewState === 'history' && (
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Aptitude Attempt History ({attemptHistory.length})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {viewState === 'test' && (
                <>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <span>{formatTimer(timeLeft)} remaining</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitAssessment}
                    isLoading={isSubmitting}
                    disabled={answeredCount === 0}
                  >
                    Submit ({answeredCount}/{questions.length})
                  </Button>
                </>
              )}

              {viewState !== 'test' && (
                <div className="flex items-center gap-2">
                  {latestAttempt && (
                    <Button
                      variant={viewState === 'results' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setViewState('results')}
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                    >
                      Summary
                    </Button>
                  )}

                  {latestAttempt && (
                    <Button
                      variant={viewState === 'review' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setReviewIndex(0);
                        setViewState('review');
                      }}
                      leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                    >
                      Review All 10
                    </Button>
                  )}

                  <Button
                    variant={viewState === 'history' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewState('history')}
                    leftIcon={<History className="w-3.5 h-3.5" />}
                  >
                    History
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadNewTest(true)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    New Test Attempt
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ================= MODE 1: ACTIVE TEST (10 QUESTIONS) ================= */}
          {viewState === 'test' && (
            <div className="space-y-6">
              {isLoadingQuestions ? (
                <Card className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Loading 10 personalized aptitude questions for {stream.shortName}...
                  </p>
                </Card>
              ) : questions.length === 0 ? (
                <Card className="py-12 text-center space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    No questions could be loaded. Please try again.
                  </p>
                  <Button variant="primary" onClick={() => loadNewTest(true)}>
                    Retry Loading
                  </Button>
                </Card>
              ) : (
                <>
                  {/* Question Navigation Palette (1-10) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1 shrink-0">
                      Questions (1-10):
                    </span>
                    {questions.map((q, idx) => {
                      const isAnswered = selectedAnswers[q.id] !== undefined;
                      const isCurrent = currentIndex === idx;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            isCurrent
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400'
                              : isAnswered
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* QUESTION CARD */}
                  <Card className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {currentQ.category} • Question {currentIndex + 1} of {questions.length}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                          Difficulty: {currentQ.difficulty}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {currentQ.question}
                      </h3>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-3">
                      {currentQ.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[currentQ.id] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx)}
                            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-600 dark:border-indigo-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-indigo-500'
                                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                  isSelected
                                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="text-sm">{opt}</span>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-600 dark:bg-indigo-500 text-white'
                                  : 'border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/80">
                      <Button
                        variant="outline"
                        size="md"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((prev) => prev - 1)}
                        leftIcon={<ArrowLeft className="w-4 h-4" />}
                      >
                        Previous
                      </Button>

                      <div className="text-xs text-slate-500">
                        {answeredCount} of {questions.length} answered
                      </div>

                      {currentIndex < questions.length - 1 ? (
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
                          isLoading={isSubmitting}
                          rightIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                          Submit Assessment ({answeredCount}/10)
                        </Button>
                      )}
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* ================= MODE 2: RESULTS SUMMARY ================= */}
          {viewState === 'results' && latestAttempt && (
            <div className="space-y-6 animate-fadeIn">
              {/* Score metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="flex items-center gap-4 border-indigo-200 dark:border-indigo-500/30">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aptitude Score</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {latestAttempt.score}%
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        latestAttempt.score >= 60
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {latestAttempt.score >= 60 ? 'Status: Passed' : 'Needs Practice (Benchmark: 60%)'}
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Correct</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {latestAttempt.correctCount} / {latestAttempt.totalQuestions}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Accuracy: {Math.round((latestAttempt.correctCount / latestAttempt.totalQuestions) * 100)}%
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Incorrect / Skipped</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {latestAttempt.incorrectCount} / {latestAttempt.unansweredCount}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {latestAttempt.unansweredCount} unanswered
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Evaluated</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                      10 Questions
                    </div>
                    <span className="text-[11px] text-slate-500">Across 5 Categories</span>
                  </div>
                </Card>
              </div>

              {/* Category-Wise Performance Breakdown */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Category-Wise Performance Breakdown
                  </h4>
                  <span className="text-xs text-slate-500">Benchmark: 60%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(latestAttempt.categoryPerformance || {}).map(([cat, stat]) => (
                    <div
                      key={cat}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{cat}</span>
                        <Badge
                          variant={stat.percentage >= 60 ? 'emerald' : 'amber'}
                          size="sm"
                        >
                          {stat.percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            stat.percentage >= 60 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {stat.correct} of {stat.total} answered correctly
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Review CTA & Next Stage Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 flex flex-col justify-between space-y-4 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Review All 10 Questions & Explanations
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Inspect your selected answers, view the correct answers, and learn from detailed explanations
                      for every question.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setReviewIndex(0);
                      setViewState('review');
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Open Question Review
                  </Button>
                </Card>

                <Card className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                        Stage 2 Complete
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Stage 3: Coding & Problem Solving
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Advance to the interactive IDE to solve 5 curated coding problems with live compilation and unit tests.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => router.push('/stages/coding')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to Coding Round
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* ================= MODE 3: REVIEW COMPLETED QUESTIONS (10 QUESTIONS WITH EXPLANATIONS) ================= */}
          {viewState === 'review' && latestAttempt && reviewQ && (
            <div className="space-y-6 animate-fadeIn">
              {/* Question Navigation Palette for Review */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1 shrink-0">
                  Review Question:
                </span>
                {latestAttempt.questions.map((q, idx) => {
                  const isCurrent = reviewIndex === idx;
                  const isAnswered = q.userAnswer !== undefined;
                  const isCorrect = q.isCorrect;

                  let colorClasses = '';
                  if (isCurrent) {
                    colorClasses = 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400';
                  } else if (isCorrect) {
                    colorClasses =
                      'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40';
                  } else if (isAnswered) {
                    colorClasses =
                      'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40';
                  } else {
                    colorClasses =
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setReviewIndex(idx)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-0.5 ${colorClasses}`}
                    >
                      {idx + 1}
                      {isCorrect ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : isAnswered ? (
                        <X className="w-2.5 h-2.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* REVIEW QUESTION CARD */}
              <Card className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {reviewQ.category} • Question {reviewIndex + 1} of {latestAttempt.questions.length}
                    </span>

                    {/* Correctness banner badge */}
                    {reviewQ.isCorrect ? (
                      <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                        Correct (+10%)
                      </Badge>
                    ) : reviewQ.userAnswer !== undefined ? (
                      <Badge variant="rose" size="sm" icon={<XCircle className="w-3.5 h-3.5" />}>
                        Incorrect
                      </Badge>
                    ) : (
                      <Badge variant="slate" size="sm" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                        Unanswered
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {reviewQ.question}
                  </h3>
                </div>

                {/* Options Review with Visual Indicators */}
                <div className="grid grid-cols-1 gap-3">
                  {reviewQ.options.map((opt, optIdx) => {
                    const isUserChoice = reviewQ.userAnswer === optIdx;
                    const isTrueCorrect = reviewQ.correctIndex === optIdx;

                    let borderClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60';
                    if (isTrueCorrect) {
                      borderClass = 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30';
                    } else if (isUserChoice && !isTrueCorrect) {
                      borderClass = 'border-rose-500 dark:border-rose-400 bg-rose-50/60 dark:bg-rose-950/30';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between ${borderClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isTrueCorrect
                                ? 'bg-emerald-600 text-white'
                                : isUserChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm text-slate-800 dark:text-slate-200">{opt}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isTrueCorrect && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Correct Answer
                            </span>
                          )}
                          {isUserChoice && !isTrueCorrect && (
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> Your Selection
                            </span>
                          )}
                          {isUserChoice && isTrueCorrect && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              (Your Pick)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* COMPREHENSIVE EXPLANATION CARD */}
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                    <span>Explanation & Core Concept</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {reviewQ.explanation}
                  </p>
                </div>

                {/* Review Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <Button
                    variant="outline"
                    size="md"
                    disabled={reviewIndex === 0}
                    onClick={() => setReviewIndex((prev) => prev - 1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Previous Question
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewState('results')}
                  >
                    Back to Summary
                  </Button>

                  {reviewIndex < latestAttempt.questions.length - 1 ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setReviewIndex((prev) => prev + 1)}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => router.push('/stages/coding')}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Proceed to Coding
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ================= MODE 4: ATTEMPT HISTORY ================= */}
          {viewState === 'history' && (
            <Card className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Past Aptitude Test Attempts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your complete history of completed aptitude rounds.
                  </p>
                </div>

                <Button variant="primary" size="sm" onClick={() => loadNewTest(true)}>
                  Start New Attempt
                </Button>
              </div>

              {attemptHistory.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No previous attempts recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {attemptHistory.map((att, i) => (
                    <div
                      key={att.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={att.score >= 60 ? 'emerald' : 'amber'} size="sm">
                            Score: {att.score}%
                          </Badge>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {att.streamName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Completed on {new Date(att.submittedAt).toLocaleDateString()} at{' '}
                          {new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {att.correctCount}/{att.totalQuestions} questions correct
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLatestAttempt(att);
                            setReviewIndex(0);
                            setViewState('review');
                          }}
                          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        >
                          Review Attempt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
