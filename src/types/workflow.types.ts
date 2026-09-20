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

export interface AptitudeQuestionReviewItem {
  id: string;
  category: string;
  question: string;
  options: string[];
  userAnswer?: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface AptitudeAttemptRecord {
  id: string;
  sessionId: string;
  userId: string;
  streamId: string;
  streamName: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  categoryPerformance: Record<string, { total: number; correct: number; percentage: number }>;
  questions: AptitudeQuestionReviewItem[];
  submittedAt: string;
}

export interface CodingProblemReviewItem {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  language: string;
  userCode: string;
  passed: boolean;
  passedTestCases: number;
  totalTestCases: number;
}

export interface CodingAttemptRecord {
  id: string;
  sessionId: string;
  userId: string;
  streamId: string;
  streamName: string;
  score: number;
  problemsAttempted: number;
  problemsSolved: number;
  testCasesPassed: number;
  totalTestCases: number;
  topicPerformance: Record<string, { total: number; solved: number }>;
  difficultyPerformance: Record<string, { total: number; solved: number }>;
  problems: CodingProblemReviewItem[];
  submittedAt: string;
}

