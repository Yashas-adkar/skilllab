export type InterviewPhase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type InterviewMode = 'text' | 'voice';

export interface TurnEvaluation {
  clarityScore: number;
  technicalDepthScore: number;
  feedback: string;
}

export interface InterviewTurn {
  id: string;
  sessionId: string;
  phase: InterviewPhase;
  phaseName: string;
  question: string;
  candidateAnswer?: string;
  timestamp: string;
  evaluation?: TurnEvaluation;
  isFollowUp?: boolean;
  topic: string;
}

export interface InterviewTurnRequest {
  sessionId: string;
  streamId: string;
  userMessage: string;
  currentPhase: InterviewPhase;
  mode?: InterviewMode;
}

export interface InterviewTurnResponse {
  reply: string;
  currentPhase: InterviewPhase;
  phaseName: string;
  isConcluded: boolean;
  evaluation?: TurnEvaluation;
  audioUrl?: string;
}

export const INTERVIEW_PHASE_NAMES: Record<InterviewPhase, string> = {
  1: 'Introduction & Framing',
  2: 'Background & Core Foundation',
  3: 'Resume & Projects Deep Dive',
  4: 'Technical Domain Principles',
  5: 'Problem Solving & Tricky Scenarios',
  6: 'Adaptive Technical Follow-Up',
  7: 'Behavioral & Leadership Scenarios',
  8: 'Closing Remarks & Wrap-Up',
};
