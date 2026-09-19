import { StageId } from './auth.types';

export type StageWorkflowStatus =
  | 'not_started'
  | 'in_progress'
  | 'passed'
  | 'needs_improvement'
  | 'completed';

export type ProgressionPolicy = 'completion_based' | 'pass_based';

export interface InterviewSession {
  id: string;
  userId: string;
  streamId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentStage: StageId | 'evaluation';
  progressionPolicy: ProgressionPolicy;
  passingScoreThreshold: number; // default 60
  overallScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageProgressRecord {
  id: string;
  sessionId: string;
  userId: string;
  stageId: StageId;
  status: StageWorkflowStatus;
  progressPercent: number; // 0-100
  score: number | null;
  feedbackSummary: string | null;
  updatedAt: string;
}

export interface QuestionItem {
  id: string;
  stageId: StageId;
  streamId: string;
  category: string;
  title: string;
  content: string;
  options?: string[];
  correctOption?: number;
  sampleInput?: string;
  sampleOutput?: string;
  constraints?: string[];
  starterCode?: Record<string, string>; // language -> code
}

export interface AnswerRecord {
  id: string;
  sessionId: string;
  userId: string;
  stageId: StageId;
  questionId: string;
  selectedOption?: number;
  codeAnswer?: string;
  interviewTranscript?: string;
  submittedAt: string;
}

export interface ScoreRecord {
  id: string;
  sessionId: string;
  userId: string;
  stageId: StageId;
  score: number;
  passingScore: number;
  passed: boolean;
  breakdown?: Record<string, number>;
  createdAt: string;
}

export interface EvaluationReport {
  id: string;
  sessionId: string;
  userId: string;
  streamId: string;
  overallScore: number;
  preparationPercentage: number;
  stageScores: Record<StageId, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: string;
}
