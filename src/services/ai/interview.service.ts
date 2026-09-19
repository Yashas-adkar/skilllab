import { UserProfile } from '@/types/auth.types';

export interface InterviewMessage {
  id: string;
  sender: 'ai' | 'candidate';
  text: string;
  timestamp: string;
}

export interface InterviewTurnResponse {
  message: string;
  isConcluded: boolean;
  stageProgressPercent: number;
}

export interface InterviewService {
  startSession(streamId: string, profile: UserProfile): Promise<InterviewTurnResponse>;
  submitAnswer(sessionId: string, transcript: string): Promise<InterviewTurnResponse>;
}
