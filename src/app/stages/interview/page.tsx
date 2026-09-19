'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Clock,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { EvaluationReport } from '@/types/workflow.types';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'candidate';
  text: string;
  timestamp: string;
}

export default function MockInterviewStagePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { session, stageProgress, completeStage, canAccess } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const currentProgress = stageProgress?.interview;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello ${user?.displayName || 'Candidate'}! Welcome to your AI Technical Mock Interview for ${stream.shortName}. I'll be assessing your architectural reasoning, domain depth, and technical communication. Let's begin!`,
      timestamp: '10:00 AM',
    },
    {
      id: 'm2',
      sender: 'ai',
      text: 'Question 1: In high-scale distributed systems, how would you design an API rate limiter? What tradeoffs exist between a Redis-backed Token Bucket versus a Sliding Window Counter approach?',
      timestamp: '10:01 AM',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isConcluding, setIsConcluding] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check progression permission
  useEffect(() => {
    canAccess('interview').then((res) => {
      setAccessAllowed(res.allowed);
      if (!res.allowed) {
        setAccessReason(res.reason || 'Prerequisite Stage 3 (Coding) must be completed first.');
      }
    });
  }, [canAccess]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: 'candidate',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulate AI response after 1.2s
    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: "That is a solid breakdown. You clearly identified that the Token Bucket allows bursts while Sliding Window Counter prevents boundary spikes. How would you handle synchronization when scaling across multiple regional datacenters?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1200);
  };

  const handleToggleMic = () => {
    setIsMicActive(!isMicActive);
    if (!isMicActive) {
      // Voice input simulation
      setTimeout(() => {
        setInputText((prev) =>
          prev
            ? `${prev} Using Redis with Lua scripts provides atomic increments and eliminates race conditions.`
            : 'Using Redis with Lua scripts provides atomic increments and eliminates race conditions.'
        );
        setIsMicActive(false);
      }, 2500);
    }
  };

  const handleConcludeInterview = async () => {
    if (!session || !user) return;
    setIsConcluding(true);

    const interviewScore = 88;
    await completeStage('interview', interviewScore, 'passed');

    // Generate and save final evaluation report
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
        interview: 88,
      },
      strengths: [
        'Exceptional algorithmic problem solving and time-complexity optimization.',
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
    };

    await WorkflowRepository.saveEvaluation(evaluationReport);
    setIsConcluding(false);
    router.push('/stages/evaluation');
  };

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
          stageSubtitle="Interactive technical & behavioral evaluation with conversational AI"
          streamName={stream.shortName}
          status={currentProgress?.status || 'not_started'}
          score={currentProgress?.score}
        />

        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 flex flex-col">
          {/* Top Session Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Dr. Elena Vance</span>
                  <Badge variant="indigo" size="sm">AI Interviewer</Badge>
                </h2>
                <p className="text-xs text-slate-400">Technical Round • {stream.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>{formatTimer(timeLeft)} remaining</span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleConcludeInterview}
                isLoading={isConcluding}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Conclude Interview & Evaluate
              </Button>
            </div>
          </div>

          {/* CURRENT QUESTION PROMPT BANNER */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                Active Question Prompt
              </span>
              <p className="text-white font-medium leading-relaxed">
                &quot;In high-scale distributed systems, how would you design an API rate limiter? What tradeoffs exist between a Redis-backed Token Bucket versus a Sliding Window Counter approach?&quot;
              </p>
            </div>
          </div>

          {/* CHAT & INTERACTION AREA */}
          <Card className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 min-h-[420px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[450px] pr-2">
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
                      className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm space-y-1.5 shadow-sm leading-relaxed ${
                        isAi
                          ? 'bg-slate-900 border border-slate-800 text-slate-200'
                          : 'bg-indigo-600 text-white shadow-indigo-600/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-70">
                        <span className="font-bold">{isAi ? 'AI Interviewer' : 'You'}</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p>{m.text}</p>
                    </div>

                    {!isAi && (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT CONTROLS */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex items-center gap-2">
              {/* Microphone Toggle */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isMicActive
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title={isMicActive ? 'Listening... click to stop' : 'Click to speak'}
              >
                {isMicActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isMicActive
                    ? 'Listening... speaking will append to your answer...'
                    : 'Type your technical answer here and press Enter...'
                }
                className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              />

              {/* Send Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputText.trim()}
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
