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
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Award,
  ListChecks,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function ResumeStagePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { session, stageProgress, completeStage, updateStage } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const currentProgress = stageProgress?.resume;

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');

  // Load existing analysis state from repository if available
  useEffect(() => {
    if (currentProgress?.score !== null && currentProgress?.score !== undefined) {
      setAnalysisStatus('done');
    }
  }, [currentProgress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setAnalysisStatus('idle');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setAnalysisStatus('idle');
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file && !profile?.resumeUrl) {
      // Use fallback default sample if user just clicks analyze
    }

    setIsUploading(true);
    setAnalysisStatus('uploading');
    setUploadProgress(15);

    // Update status to in_progress
    await updateStage('resume', { status: 'in_progress', progressPercent: 30 });

    // Simulate upload & analysis progress
    const timer1 = setTimeout(() => {
      setUploadProgress(65);
      setAnalysisStatus('analyzing');
    }, 800);

    const timer2 = setTimeout(async () => {
      setUploadProgress(100);
      setIsUploading(false);
      setAnalysisStatus('done');

      // Realistic score (84% - Passed)
      const simulatedScore = 84;
      await completeStage('resume', simulatedScore, 'passed');
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const isCompleted = currentProgress?.status === 'passed' || currentProgress?.status === 'needs_improvement';
  const score = currentProgress?.score ?? 84;

  return (
    <AuthGuard requireCompletedProfile={true}>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <StageHeader
          currentStageId="resume"
          stageNumber={1}
          stageTitle="Resume Analysis"
          stageSubtitle="Evaluate resume alignment against your chosen career stream"
          streamName={stream.shortName}
          status={currentProgress?.status || 'not_started'}
          score={currentProgress?.score}
        />

        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Stage Overview Banner */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Evaluation Purpose
              </span>
              <h2 className="text-xl font-bold text-white">Target Track: {stream.name}</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                The AI Resume Evaluator inspects technical keyword density, production project impact metrics, core competencies, and ATS formatting specifically calibrated for {stream.shortName}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Badge variant="blue" size="sm">Passing Score: 60%</Badge>
              <Badge variant="slate" size="sm">Stage 1 of 4</Badge>
            </div>
          </div>

          {/* UPLOAD SECTION */}
          <Card className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Upload Your Resume</h3>
                <p className="text-xs text-slate-400">
                  Supported file types: <strong className="text-slate-200">.PDF, .DOCX, .TXT</strong> (Max 10MB)
                </p>
              </div>
              {file && (
                <Badge variant="indigo" size="sm" icon={<FileCheck className="w-3.5 h-3.5" />}>
                  {file.name}
                </Badge>
              )}
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 cursor-pointer ${
                file
                  ? 'border-indigo-500/50 bg-indigo-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
              onClick={() => document.getElementById('resume-file-input')?.click()}
            >
              <input
                id="resume-file-input"
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {file ? file.name : 'Click to select or drag & drop your resume file'}
                </p>
                <p className="text-xs text-slate-400">
                  {file
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for parsing`
                    : 'PDF, Word, or plain text formats accepted'}
                </p>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {analysisStatus === 'uploading' ? 'Uploading document...' : 'Parsing technical depth & ATS metrics...'}
                  </span>
                  <span className="text-indigo-400 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload & Analyze Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-500">
                {isCompleted
                  ? 'Resume parsed and verified against current track.'
                  : 'Analysis evaluates against track rubrics: Algorithms, Architecture, Tech Stack & Impact.'}
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleUploadAndAnalyze}
                isLoading={isUploading}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isCompleted ? 'Re-Analyze Resume' : 'Upload & Analyze Resume'}
              </Button>
            </div>
          </Card>

          {/* ANALYSIS RESULTS & FEEDBACK PLACEHOLDER (Visible when analyzed) */}
          {analysisStatus === 'done' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Score Placeholder Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="flex items-center gap-4 border-indigo-500/30">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Overall ATS Match</span>
                    <div className="text-2xl font-bold text-white mt-0.5">{score}%</div>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Status: {score >= 60 ? 'Passed' : 'Needs Improvement'}
                    </span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Technical Competency</span>
                    <div className="text-2xl font-bold text-white mt-0.5">88%</div>
                    <span className="text-[11px] text-slate-500">Core skills verified</span>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                    <ListChecks className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Keywords Coverage</span>
                    <div className="text-2xl font-bold text-white mt-0.5">82%</div>
                    <span className="text-[11px] text-slate-500">{stream.shortName} taxonomy</span>
                  </div>
                </Card>
              </div>

              {/* Feedback Placeholder Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Identified Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Strong demonstration of production web architecture and database design.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Clear enumeration of programming languages and full-stack frameworks.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Project descriptions effectively highlight modern CI/CD and deployment tooling.</span>
                    </li>
                  </ul>
                </Card>

                <Card className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Actionable Improvement Areas</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>Quantify project achievements using metrics (e.g. latency reduced by 30%, 10k DAU).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>Explicitly mention unit testing coverage and distributed caching strategies.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>Ensure ATS readability by using standard section headings.</span>
                    </li>
                  </ul>
                </Card>
              </div>

              {/* Next Stage Navigation CTA */}
              <div className="p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-emerald-400">
                      Stage 1 Completed
                    </span>
                    <Badge variant="emerald" size="sm">Score: {score}%</Badge>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Stage 2: Aptitude Test is Now Unlocked
                  </h4>
                  <p className="text-xs text-slate-400">
                    Assess logical reasoning, quantitative analysis, and technical problem solving.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/stages/aptitude')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Aptitude Test
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
