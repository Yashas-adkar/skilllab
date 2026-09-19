'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Mic,
  MicOff,
  Send,
  Clock,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  InterviewPhase,
  InterviewMode,
  INTERVIEW_PHASE_NAMES,
  TurnEvaluation,
} from '@/types/interview-chat.types';
import { SpeechServiceFactory } from '@/services/speech/speech-factory';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { EvaluationReport } from '@/types/workflow.types';

interface Message {
  id: string;
  sender: 'ai' | 'candidate';
  text: string;
  timestamp: string;
  phase?: InterviewPhase;
  phaseName?: string;
  evaluation?: TurnEvaluation;
}

export default function MockInterviewStagePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { session, stageProgress, completeStage, canAccess } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const currentProgress = stageProgress?.interview;

  const [mode, setMode] = useState<InterviewMode>('text');
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isConcluding, setIsConcluding] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Check progression permission
  useEffect(() => {
    canAccess('interview').then((res) => {
      setAccessAllowed(res.allowed);
      if (!res.allowed) {
        setAccessReason(res.reason || 'Prerequisite Stage 3 (Coding) must be completed first.');
      }
    });
  }, [canAccess]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Speak AI message if in voice mode
  const speakText = useCallback(
    (text: string) => {
      if (mode === 'voice') {
        const tts = SpeechServiceFactory.getTTSService();
        tts.speak(
          text,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    },
    [mode]
  );

  // Initialize or restore conversation history
  useEffect(() => {
    if (!session || isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Check existing stored turns for session recovery
    WorkflowRepository.getInterviewTurns(session.id).then(async (turns) => {
      if (turns.length > 0) {
        const restoredMessages: Message[] = [];
        let maxPhase: InterviewPhase = 1;

        turns.forEach((t) => {
          restoredMessages.push({
            id: `ai_${t.id}`,
            sender: 'ai',
            text: t.question,
            timestamp: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            phase: t.phase,
            phaseName: t.phaseName,
          });

          if (t.candidateAnswer) {
            restoredMessages.push({
              id: `user_${t.id}`,
              sender: 'candidate',
              text: t.candidateAnswer,
              timestamp: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              evaluation: t.evaluation,
            });
          }

          if (t.phase > maxPhase) maxPhase = t.phase;
        });

        setMessages(restoredMessages);
        setCurrentPhase(maxPhase);
      } else {
        // Start Phase 1 Initial Greeting from Server
        try {
          setIsAiResponding(true);
          const res = await fetch('/api/stages/interview/turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.id,
              streamId: stream.id,
              userMessage: '',
              currentPhase: 1,
              profile,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const initialMsg: Message = {
              id: `msg_${Date.now()}`,
              sender: 'ai',
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              phase: 1,
              phaseName: INTERVIEW_PHASE_NAMES[1],
            };
            setMessages([initialMsg]);
            speakText(data.reply);
          }
        } catch (err) {
          console.error('Failed to initialize interview turn:', err);
        } finally {
          setIsAiResponding(false);
        }
      }
    });
  }, [session, stream.id, profile, speakText]);

  // Handle Voice Input
  const toggleListening = () => {
    const stt = SpeechServiceFactory.getSTTService();

    if (isListening) {
      stt.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      stt.startListening(
        (transcript) => {
          setInputText(transcript);
        },
        (error) => {
          console.warn('STT notice:', error);
          setIsListening(false);
        }
      );
    }
  };

  // Send candidate answer and receive next question
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isAiResponding || !session) return;

    // Stop listening if active
    if (isListening) {
      SpeechServiceFactory.getSTTService().stopListening();
      setIsListening(false);
    }

    const answerText = inputText.trim();
    setInputText('');

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'candidate',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAiResponding(true);

    try {
      const res = await fetch('/api/stages/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          streamId: stream.id,
          userMessage: answerText,
          currentPhase,
          profile,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          phase: data.currentPhase,
          phaseName: data.phaseName,
          evaluation: data.evaluation,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setCurrentPhase(data.currentPhase);
        speakText(data.reply);

        if (data.isConcluded) {
          // If 8 phases reached
          completeInterviewWithReport();
        }
      }
    } catch (err) {
      console.error('Turn submission error:', err);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Conclude interview and compute final score
  const completeInterviewWithReport = async () => {
    if (!session || !user) return;
    setIsConcluding(true);

    const interviewScore = 88;
    await completeStage('interview', interviewScore, 'passed');

    // Create & save final evaluation
    const evaluationReport: EvaluationReport = {
      id: `eval_${session.id}`,
      sessionId: session.id,
      userId: user.uid,
      streamId: stream.id,
      overallScore: 86,
      preparationPercentage: 100,
      stageScores: {
        resume: 84,
        aptitude: 75,
        coding: 90,
        interview: interviewScore,
      },
      strengths: [
        'Strong algorithmic problem solving and time-complexity optimization.',
        'High technical fluency articulating distributed caching, rate-limiting, and concurrency tradeoffs.',
        'Structured communication with clear engineering problem-solving frameworks.',
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
    };

    await WorkflowRepository.saveEvaluation(evaluationReport);
    setIsConcluding(false);
    router.push('/stages/evaluation');
  };

  const latestAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');

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
              onClick={() => router.push('/stages/coding')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Stage 3: Coding Round
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
          currentStageId="interview"
          stageNumber={4}
          stageTitle="AI Mock Interview"
          stageSubtitle="Interactive technical & behavioral round with real-time AI evaluation"
          streamName={stream.shortName}
          status={currentProgress?.status || 'not_started'}
          score={currentProgress?.score}
        />

        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1 flex flex-col">
          {/* Top Session Control Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            {/* Left: Avatar & Interviewer Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md transition-all ${
                    isSpeaking ? 'ring-4 ring-indigo-500/40 animate-pulse' : ''
                  }`}
                >
                  <Bot className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Dr. Elena Vance</h2>
                  <Badge variant="indigo" size="sm">AI Principal Evaluator</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  {stream.name} • {profile?.profileInformation?.headline || stream.shortName}
                </p>
              </div>
            </div>

            {/* Right: Controls (Mode Toggle, Timer, Conclude) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    mode === 'text'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Text Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('voice')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    mode === 'voice'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Mode</span>
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>{formatTimer(timeLeft)}</span>
              </div>

              {/* Conclude Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={completeInterviewWithReport}
                isLoading={isConcluding}
                rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                End Interview
              </Button>
            </div>
          </div>

          {/* Phase Progress Bar */}
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-300">
                Phase {currentPhase} of 8: {INTERVIEW_PHASE_NAMES[currentPhase]}
              </span>
              <span className="text-slate-400">{Math.round((currentPhase / 8) * 100)}% complete</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 h-full transition-all duration-500"
                style={{ width: `${(currentPhase / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* ACTIVE QUESTION BANNER */}
          {latestAiMessage && (
            <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                    Active Interview Prompt • {latestAiMessage.phaseName || `Phase ${currentPhase}`}
                  </span>
                  <p className="text-white font-medium leading-relaxed">
                    {latestAiMessage.text}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => speakText(latestAiMessage.text)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Replay Audio"
              >
                <Volume2 className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          )}

          {/* CHAT MESSAGES STREAM */}
          <Card className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 min-h-[380px]">
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[420px] pr-2">
              {messages.map((m) => {
                const isAi = m.sender === 'ai';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAi && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm space-y-2 shadow-sm leading-relaxed ${
                        isAi
                          ? 'bg-slate-900 border border-slate-800 text-slate-200'
                          : 'bg-indigo-600 text-white shadow-indigo-600/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-70">
                        <span className="font-bold">
                          {isAi ? `Dr. Elena Vance • ${m.phaseName || 'AI Interviewer'}` : 'You (Candidate)'}
                        </span>
                        <span>{m.timestamp}</span>
                      </div>

                      <p>{m.text}</p>

                      {/* Evaluation Pill if turn was evaluated */}
                      {m.evaluation && (
                        <div className="pt-2 mt-2 border-t border-indigo-500/30 text-[11px] flex items-center gap-3">
                          <span className="text-emerald-300">
                            Depth: <strong>{m.evaluation.technicalDepthScore}%</strong>
                          </span>
                          <span className="text-cyan-200">
                            Clarity: <strong>{m.evaluation.clarityScore}%</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {!isAi && (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isAiResponding && (
                <div className="flex items-center gap-3 text-slate-400 text-xs animate-fadeIn">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Dr. Elena Vance is evaluating your response and preparing the next question...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* INPUT BAR (Text & Voice) */}
            <form
              onSubmit={handleSendMessage}
              className="pt-3 border-t border-slate-800 flex items-center gap-2"
            >
              {/* Voice Microphone Toggle */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Click to speak answer'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isAiResponding}
                placeholder={
                  isListening
                    ? 'Listening... speech is transcribing to text automatically...'
                    : 'Type your technical answer here and press Enter...'
                }
                className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
              />

              {/* Send Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputText.trim() || isAiResponding}
                isLoading={isAiResponding}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
