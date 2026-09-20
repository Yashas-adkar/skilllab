'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Code,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Terminal,
  Clock,
  Layers,
  Check,
  X,
  History,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  getCodingProblemsForStream,
  CodingProblem,
} from '@/services/questions/coding-bank';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { CodingAttemptRecord } from '@/types/workflow.types';

type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'cpp' | 'java';

interface ExecutionResponse {
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded';
  passedAll: boolean;
  passedTestCases: number;
  totalTestCases: number;
  runtimeMs: number;
  memoryMb: string;
  stdout: string;
  errorMessage?: string;
  testCaseResults: Array<{
    testCaseNumber: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    errorMessage?: string;
    isHidden?: boolean;
  }>;
}

export default function CodingStagePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { session, stageProgress, completeStage, canAccess } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const currentProgress = stageProgress?.coding;

  // View state: 'editor' | 'summary' | 'history'
  const [viewState, setViewState] = useState<'editor' | 'summary' | 'history'>('editor');

  // Load 5 problems for stream
  const problems = useMemo(() => getCodingProblemsForStream(stream.id), [stream.id]);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const currentProblem: CodingProblem = problems[currentProblemIdx] || problems[0];

  const [language, setLanguage] = useState<SupportedLanguage>('python');

  // User code storage per problem & language: problemId -> language -> code
  const [userCodes, setUserCodes] = useState<Record<string, Record<string, string>>>({});

  // Submission results per problem: problemId -> ExecutionResponse
  const [problemResults, setProblemResults] = useState<Record<string, ExecutionResponse>>({});

  // Active Output Panel state
  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);
  const [isFinalizingAssessment, setIsFinalizingAssessment] = useState(false);

  // Latest run or submit result for current active problem
  const [activeExecutionResult, setActiveExecutionResult] = useState<ExecutionResponse | null>(null);

  // Completed assessment attempts
  const [latestAttempt, setLatestAttempt] = useState<CodingAttemptRecord | null>(null);
  const [codingHistory, setCodingHistory] = useState<CodingAttemptRecord[]>([]);

  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState<string>('');

  // Check progression permission
  useEffect(() => {
    canAccess('coding').then((res) => {
      setAccessAllowed(res.allowed);
      if (!res.allowed) {
        setAccessReason(res.reason || 'Prerequisite Stage 2 (Aptitude) must be completed first.');
      }
    });
  }, [canAccess]);

  // Load draft codes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('skilllab_coding_drafts_v1');
      if (stored) {
        setUserCodes(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
  }, []);

  // Persist draft codes to localStorage
  const updateCodeForCurrentProblem = (newCode: string) => {
    setUserCodes((prev) => {
      const updated = {
        ...prev,
        [currentProblem.id]: {
          ...(prev[currentProblem.id] || {}),
          [language]: newCode,
        },
      };
      try {
        localStorage.setItem('skilllab_coding_drafts_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Get current active code (defaults to minimal starter template without solution)
  const currentCode =
    userCodes[currentProblem.id]?.[language] ??
    currentProblem.starterTemplates[language] ??
    '';

  // Load latest coding attempt
  const loadCodingHistory = useCallback(async () => {
    if (!user) return;
    const history = await WorkflowRepository.getCodingAttempts(user.uid, stream.id);
    setCodingHistory(history);
    if (history.length > 0 && !latestAttempt) {
      setLatestAttempt(history[0]);
    }
  }, [user, stream.id, latestAttempt]);

  useEffect(() => {
    loadCodingHistory();
  }, [loadCodingHistory]);

  // Load existing session attempt if present
  useEffect(() => {
    if (session) {
      WorkflowRepository.getLatestCodingAttempt(session.id).then((att) => {
        if (att) {
          setLatestAttempt(att);
        }
      });
    }
  }, [session]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setLanguage(newLang);
    setActiveExecutionResult(null);
  };

  // RUN CODE (against sample test cases)
  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('tests');
    try {
      const res = await fetch('/api/stages/coding/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: currentProblem.id,
          language,
          code: currentCode,
          mode: 'run',
        }),
      });

      if (res.ok) {
        const data: ExecutionResponse = await res.json();
        setActiveExecutionResult(data);
      } else {
        const err = await res.json();
        setActiveExecutionResult({
          status: 'Runtime Error',
          passedAll: false,
          passedTestCases: 0,
          totalTestCases: currentProblem.sampleTestCases.length,
          runtimeMs: 0,
          memoryMb: '0 MB',
          stdout: '',
          errorMessage: err.details || err.error || 'Execution failed.',
          testCaseResults: [],
        });
      }
    } catch (err: any) {
      setActiveExecutionResult({
        status: 'Runtime Error',
        passedAll: false,
        passedTestCases: 0,
        totalTestCases: currentProblem.sampleTestCases.length,
        runtimeMs: 0,
        memoryMb: '0 MB',
        stdout: '',
        errorMessage: err.message || 'Execution failed.',
        testCaseResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  // SUBMIT SOLUTION (against sample + hidden test cases for current problem)
  const handleSubmitProblem = async () => {
    setIsSubmittingProblem(true);
    setActiveTab('tests');
    try {
      const res = await fetch('/api/stages/coding/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: currentProblem.id,
          language,
          code: currentCode,
          mode: 'submit',
        }),
      });

      if (res.ok) {
        const data: ExecutionResponse = await res.json();
        setActiveExecutionResult(data);
        setProblemResults((prev) => ({
          ...prev,
          [currentProblem.id]: data,
        }));
      }
    } catch (err) {
      console.error('Submit problem error:', err);
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  // FINALIZE FULL ASSESSMENT (All 5 problems evaluated)
  const handleFinalizeAssessment = async () => {
    setIsFinalizingAssessment(true);
    try {
      let solvedCount = 0;
      let totalTestCasesPassed = 0;
      let totalTestCasesAll = 0;
      const topicStats: Record<string, { total: number; solved: number }> = {};
      const difficultyStats: Record<string, { total: number; solved: number }> = {};

      const problemReviews = problems.map((p) => {
        const res = problemResults[p.id];
        const isPassed = res?.passedAll === true;
        if (isPassed) solvedCount++;

        const passedTC = res?.passedTestCases || 0;
        const totalTC = p.sampleTestCases.length + p.hiddenTestCases.length;
        totalTestCasesPassed += passedTC;
        totalTestCasesAll += totalTC;

        // Topic stats
        if (!topicStats[p.topic]) topicStats[p.topic] = { total: 0, solved: 0 };
        topicStats[p.topic].total += 1;
        if (isPassed) topicStats[p.topic].solved += 1;

        // Difficulty stats
        if (!difficultyStats[p.difficulty]) difficultyStats[p.difficulty] = { total: 0, solved: 0 };
        difficultyStats[p.difficulty].total += 1;
        if (isPassed) difficultyStats[p.difficulty].solved += 1;

        return {
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic,
          language,
          userCode: userCodes[p.id]?.[language] || '',
          passed: isPassed,
          passedTestCases: passedTC,
          totalTestCases: totalTC,
        };
      });

      const calculatedScore = Math.round((solvedCount / problems.length) * 100);

      const attemptRecord: CodingAttemptRecord = {
        id: `coding_attempt_${session?.id || 'demo'}_${Date.now()}`,
        sessionId: session?.id || `session_${Date.now()}`,
        userId: user?.uid || '',
        streamId: stream.id,
        streamName: stream.shortName,
        score: calculatedScore,
        problemsAttempted: Object.keys(problemResults).length,
        problemsSolved: solvedCount,
        testCasesPassed: totalTestCasesPassed,
        totalTestCases: totalTestCasesAll,
        topicPerformance: topicStats,
        difficultyPerformance: difficultyStats,
        problems: problemReviews,
        submittedAt: new Date().toISOString(),
      };

      await WorkflowRepository.saveCodingAttempt(attemptRecord);
      setLatestAttempt(attemptRecord);
      setCodingHistory((prev) => [attemptRecord, ...prev]);

      // Complete stage in workflow session
      const status = calculatedScore >= 60 ? 'passed' : 'needs_improvement';
      await completeStage('coding', calculatedScore, status);

      setViewState('summary');
    } catch (err) {
      console.error('Finalize coding assessment error:', err);
    } finally {
      setIsFinalizingAssessment(false);
    }
  };

  const solvedProblemsCount = problems.filter((p) => problemResults[p.id]?.passedAll === true).length;
  const attemptedProblemsCount = Object.keys(problemResults).length;

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
              onClick={() => router.push('/stages/aptitude')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Stage 2: Aptitude Test
            </Button>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireCompletedProfile={true}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <StageHeader
          currentStageId="coding"
          stageNumber={3}
          stageTitle="Coding & Problem Solving"
          stageSubtitle="Evaluate algorithmic correctness, complexity, and hands-on coding ability"
          streamName={stream.shortName}
          status={currentProgress?.status || 'not_started'}
          score={latestAttempt ? latestAttempt.score : currentProgress?.score}
        />

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 flex-1 flex flex-col">
          {/* Top Bar: Problem Selection (1 of 5), Mode Switcher & Assessment Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Code className="w-4 h-4" />
                <span>Problem {currentProblemIdx + 1} of {problems.length}</span>
              </div>

              {/* Problem Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {problems.map((p, idx) => {
                  const isCurrent = currentProblemIdx === idx;
                  const res = problemResults[p.id];
                  const isSolved = res?.passedAll === true;
                  const isAttempted = res !== undefined;

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentProblemIdx(idx);
                        setActiveExecutionResult(problemResults[p.id] || null);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400'
                          : isSolved
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                          : isAttempted
                          ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>P{idx + 1}</span>
                      {isSolved ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : isAttempted ? (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden md:inline">
                Solved: <strong>{solvedProblemsCount}/5</strong>
              </span>

              {viewState === 'editor' ? (
                <>
                  {latestAttempt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewState('summary')}
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                    >
                      Summary
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFinalizeAssessment}
                    isLoading={isFinalizingAssessment}
                    rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Finish Assessment ({solvedProblemsCount}/5)
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setViewState('editor')}
                  leftIcon={<Code className="w-3.5 h-3.5" />}
                >
                  Return to Code Editor
                </Button>
              )}

              <Button
                variant={viewState === 'history' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewState(viewState === 'history' ? 'editor' : 'history')}
                leftIcon={<History className="w-3.5 h-3.5" />}
              >
                History
              </Button>
            </div>
          </div>

          {/* ================= VIEW 1: IDE (PROBLEM STATEMENT + BLANK CODE EDITOR + OUTPUT) ================= */}
          {viewState === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
              {/* LEFT PANEL: Problem Description, Examples & Constraints */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <Card className="flex-1 space-y-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
                  <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          currentProblem.difficulty === 'Easy'
                            ? 'emerald'
                            : currentProblem.difficulty === 'Medium'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {currentProblem.difficulty}
                      </Badge>
                      <Badge variant="blue" size="sm">
                        {currentProblem.topic}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentProblemIdx + 1}. {currentProblem.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Problem {currentProblemIdx + 1} of {problems.length} • Track: {stream.shortName}
                    </p>
                  </div>

                  {/* Problem Statement */}
                  <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <p>{currentProblem.description}</p>
                  </div>

                  {/* Examples */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Examples
                    </span>

                    {currentProblem.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5 text-xs font-mono"
                      >
                        <div className="text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-slate-200">Input:</strong> {ex.input}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-slate-200">Output:</strong> {ex.output}
                        </div>
                        {ex.explanation && (
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                            Explanation: {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Constraints */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                      Constraints
                    </span>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {currentProblem.constraints.map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Problem Navigation Buttons (Previous / Next) */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentProblemIdx === 0}
                      onClick={() => {
                        const newIdx = currentProblemIdx - 1;
                        setCurrentProblemIdx(newIdx);
                        setActiveExecutionResult(problemResults[problems[newIdx].id] || null);
                      }}
                      leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                      Previous Problem
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentProblemIdx === problems.length - 1}
                      onClick={() => {
                        const newIdx = currentProblemIdx + 1;
                        setCurrentProblemIdx(newIdx);
                        setActiveExecutionResult(problemResults[problems[newIdx].id] || null);
                      }}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Next Problem
                    </Button>
                  </div>
                </Card>
              </div>

              {/* RIGHT PANEL: Code Editor & Execution Results Panel */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {/* Editor Header */}
                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Code Editor (Problem {currentProblemIdx + 1} of 5)
                    </span>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Language:</span>
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript (Node.js)</option>
                      <option value="typescript">TypeScript</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                    </select>
                  </div>
                </div>

                {/* BLANK CODE AREA: Solution removed, minimal template only */}
                <div className="relative bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-slate-800 p-3 font-mono text-xs text-slate-900 dark:text-slate-200 min-h-[320px] flex-1 flex">
                  <textarea
                    value={currentCode}
                    onChange={(e) => updateCodeForCurrentProblem(e.target.value)}
                    spellCheck={false}
                    placeholder="Write your algorithmic solution here..."
                    className="w-full h-full bg-transparent resize-none outline-none font-mono text-xs leading-relaxed text-slate-900 dark:text-indigo-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                {/* Action Bar (Run Code vs Submit Solution) */}
                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRunCode}
                      isLoading={isRunning}
                      leftIcon={<Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    >
                      Run Code
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitProblem}
                      isLoading={isSubmittingProblem}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Submit Problem {currentProblemIdx + 1}
                    </Button>
                  </div>
                </div>

                {/* OUTPUT / RESULT PANEL AT BOTTOM OF EDITOR */}
                <Card className="space-y-3 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab('tests')}
                        className={`text-xs font-semibold pb-1 cursor-pointer transition-colors ${
                          activeTab === 'tests'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Test Case Results
                      </button>
                      <button
                        onClick={() => setActiveTab('console')}
                        className={`text-xs font-semibold pb-1 cursor-pointer transition-colors ${
                          activeTab === 'console'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Console Output
                      </button>
                    </div>

                    {activeExecutionResult && (
                      <Badge
                        variant={
                          activeExecutionResult.status === 'Accepted'
                            ? 'emerald'
                            : activeExecutionResult.status === 'Compilation Error'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {activeExecutionResult.status}
                      </Badge>
                    )}
                  </div>

                  {activeExecutionResult ? (
                    <div className="space-y-2 text-xs font-mono">
                      {/* Metrics bar */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          Test Cases:{' '}
                          <strong
                            className={
                              activeExecutionResult.passedAll
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {activeExecutionResult.passedTestCases} / {activeExecutionResult.totalTestCases} Passed
                          </strong>
                        </span>
                        <span>
                          Runtime:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {activeExecutionResult.runtimeMs} ms
                          </strong>
                        </span>
                        <span>
                          Memory:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {activeExecutionResult.memoryMb}
                          </strong>
                        </span>
                      </div>

                      {/* Compilation or Runtime Error Display */}
                      {activeExecutionResult.errorMessage && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1 text-rose-700 dark:text-rose-300">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {activeExecutionResult.status}
                          </div>
                          <pre className="text-[11px] whitespace-pre-wrap font-mono">
                            {activeExecutionResult.errorMessage}
                          </pre>
                        </div>
                      )}

                      {/* Content based on active tab */}
                      <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300">
                        {activeTab === 'tests' ? (
                          <div className="space-y-2">
                            {activeExecutionResult.testCaseResults.length === 0 ? (
                              <div className="text-slate-500 text-xs py-2">
                                No test case outputs generated. Check for compilation or syntax errors above.
                              </div>
                            ) : (
                              activeExecutionResult.testCaseResults.map((tc) => (
                                <div
                                  key={tc.testCaseNumber}
                                  className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                                    tc.passed
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="flex items-center gap-1.5">
                                      {tc.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                      Test Case {tc.testCaseNumber}: {tc.passed ? 'Passed' : 'Failed'}
                                      {tc.isHidden && ' (Hidden)'}
                                    </span>
                                  </div>

                                  {!tc.isHidden && (
                                    <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                      <div>Input: {tc.input}</div>
                                      <div>Expected: {tc.expectedOutput}</div>
                                      <div>Actual: {tc.actualOutput}</div>
                                    </div>
                                  )}

                                  {tc.errorMessage && (
                                    <div className="text-rose-600 dark:text-rose-400 text-[11px]">
                                      Error: {tc.errorMessage}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <pre className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                            {activeExecutionResult.stdout || 'No console output logged.'}
                          </pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                      Click &quot;Run Code&quot; to test your algorithm against sample test cases or &quot;Submit Problem {currentProblemIdx + 1}&quot; to evaluate against the full test suite.
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: CODING ASSESSMENT SUMMARY ================= */}
          {viewState === 'summary' && latestAttempt && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="flex items-center gap-4 border-indigo-200 dark:border-indigo-500/30">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Coding Score</span>
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
                      {latestAttempt.score >= 60 ? 'Status: Passed (Benchmark: 60%)' : 'Needs Practice'}
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Problems Solved</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {latestAttempt.problemsSolved} / 5
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {latestAttempt.problemsAttempted} Attempted
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Test Cases Passed</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {latestAttempt.testCasesPassed} / {latestAttempt.totalTestCases}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {latestAttempt.totalTestCases > 0
                        ? `${Math.round((latestAttempt.testCasesPassed / latestAttempt.totalTestCases) * 100)}% Pass Rate`
                        : 'N/A'}
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Execution Engine</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                      Sandboxed
                    </div>
                    <span className="text-[11px] text-slate-500">Python / Node.js VM</span>
                  </div>
                </Card>
              </div>

              {/* Problem by Problem Review List */}
              <Card className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                  5 Problem Breakdown & Test Case Performance
                </h4>

                <div className="space-y-3">
                  {latestAttempt.problems.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={p.passed ? 'emerald' : 'rose'} size="sm">
                            {p.passed ? 'Accepted' : 'Incomplete'}
                          </Badge>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            Problem {idx + 1}: {p.title}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Topic: {p.topic}</span>
                          <span>Difficulty: {p.difficulty}</span>
                          <span>Test Cases: {p.passedTestCases}/{p.totalTestCases}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentProblemIdx(idx);
                          setViewState('editor');
                        }}
                      >
                        Edit / Retest Problem
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Next Stage Navigation CTA */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      Stage 3 Completed
                    </span>
                    <Badge variant="emerald" size="sm">Score: {latestAttempt.score}%</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Stage 4: AI Mock Technical Interview is Ready
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Converse with Dr. Elena Vance in an interactive voice & text technical interview assessing your reasoning.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/stages/interview')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to AI Mock Interview
                </Button>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: ATTEMPT HISTORY ================= */}
          {viewState === 'history' && (
            <Card className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Coding Assessment History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review past coding rounds, solved problems, and test metrics.
                  </p>
                </div>

                <Button variant="primary" size="sm" onClick={() => setViewState('editor')}>
                  Back to Editor
                </Button>
              </div>

              {codingHistory.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No previous coding assessment attempts found.
                </div>
              ) : (
                <div className="space-y-3">
                  {codingHistory.map((att) => (
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
                          Completed on {new Date(att.submittedAt).toLocaleDateString()} •{' '}
                          {att.problemsSolved}/5 Problems Solved ({att.testCasesPassed}/{att.totalTestCases} Test Cases)
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLatestAttempt(att);
                          setViewState('summary');
                        }}
                      >
                        View Summary
                      </Button>
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
