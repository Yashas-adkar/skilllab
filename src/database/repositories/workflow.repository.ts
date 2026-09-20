import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { StageId } from '@/types/auth.types';
import {
  InterviewSession,
  StageProgressRecord,
  StageWorkflowStatus,
  ProgressionPolicy,
  AnswerRecord,
  ScoreRecord,
  EvaluationReport,
  AptitudeAttemptRecord,
  CodingAttemptRecord,
} from '@/types/workflow.types';
import { InterviewTurn } from '@/types/interview-chat.types';

const STORAGE_KEYS = {
  SESSIONS: 'skilllab_sessions_v1',
  STAGE_PROGRESS: 'skilllab_stage_progress_v1',
  ANSWERS: 'skilllab_answers_v1',
  SCORES: 'skilllab_scores_v1',
  EVALUATIONS: 'skilllab_evaluations_v1',
  INTERVIEW_TURNS: 'skilllab_interview_turns_v1',
  APTITUDE_ATTEMPTS: 'skilllab_aptitude_attempts_v1',
  CODING_ATTEMPTS: 'skilllab_coding_attempts_v1',
};


// Local storage helpers for offline/demo resilience
function getLocalStorageMap<T>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalStorageItem<T>(key: string, id: string, item: T): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalStorageMap<T>(key);
    map[id] = item;
    localStorage.setItem(key, JSON.stringify(map));
  } catch (err) {
    console.error(`Failed to store item in ${key}`, err);
  }
}

export class WorkflowRepository {
  /**
   * Get or initialize an active interview session for the candidate
   */
  static async getOrCreateActiveSession(
    userId: string,
    streamId: string,
    policy: ProgressionPolicy = 'completion_based',
    forceNew: boolean = false
  ): Promise<InterviewSession> {
    const now = new Date().toISOString();

    const localSessions = getLocalStorageMap<InterviewSession>(STORAGE_KEYS.SESSIONS);
    if (!forceNew) {
      // Find latest session for this user and stream
      const userSessions = Object.values(localSessions)
        .filter((s) => s.userId === userId && s.streamId === streamId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Prefer in_progress or latest completed session
      const existing = userSessions.find((s) => s.status === 'in_progress') || userSessions[0];
      if (existing) {
        return existing;
      }
    }

    // Create new session
    const sessionId = `session_${userId}_${streamId}_${Date.now()}`;
    const newSession: InterviewSession = {
      id: sessionId,
      userId,
      streamId,
      status: 'in_progress',
      currentStage: 'resume',
      progressionPolicy: policy,
      passingScoreThreshold: 60,
      overallScore: null,
      createdAt: now,
      updatedAt: now,
    };

    setLocalStorageItem(STORAGE_KEYS.SESSIONS, newSession.id, newSession);

    // Initialize all 4 stage progress records
    const stageIds: StageId[] = ['resume', 'aptitude', 'coding', 'interview'];
    for (const stg of stageIds) {
      const initialStatus: StageWorkflowStatus = stg === 'resume' ? 'in_progress' : 'not_started';
      const progressRecord: StageProgressRecord = {
        id: `${sessionId}_${stg}`,
        sessionId,
        userId,
        stageId: stg,
        status: initialStatus,
        progressPercent: 0,
        score: null,
        feedbackSummary: null,
        updatedAt: now,
      };
      setLocalStorageItem(STORAGE_KEYS.STAGE_PROGRESS, progressRecord.id, progressRecord);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'interview_sessions', newSession.id), newSession);
      } catch (e) {
        console.warn('Firestore session create fallback', e);
      }
    }

    return newSession;
  }

  /**
   * Retrieve stage progress for a specific session and stage
   */
  static async getStageProgress(sessionId: string, stageId: StageId): Promise<StageProgressRecord | null> {
    const key = `${sessionId}_${stageId}`;
    const map = getLocalStorageMap<StageProgressRecord>(STORAGE_KEYS.STAGE_PROGRESS);
    return map[key] || null;
  }

  /**
   * Retrieve all stage progress records for a session
   */
  static async getAllStageProgress(sessionId: string): Promise<Record<StageId, StageProgressRecord>> {
    const map = getLocalStorageMap<StageProgressRecord>(STORAGE_KEYS.STAGE_PROGRESS);
    const result: Partial<Record<StageId, StageProgressRecord>> = {};
    const stages: StageId[] = ['resume', 'aptitude', 'coding', 'interview'];

    for (const stg of stages) {
      const rec = map[`${sessionId}_${stg}`];
      if (rec) {
        result[stg] = rec;
      } else {
        result[stg] = {
          id: `${sessionId}_${stg}`,
          sessionId,
          userId: '',
          stageId: stg,
          status: stg === 'resume' ? 'in_progress' : 'not_started',
          progressPercent: 0,
          score: null,
          feedbackSummary: null,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    return result as Record<StageId, StageProgressRecord>;
  }

  /**
   * Update stage progress and status
   */
  static async updateStageProgress(
    sessionId: string,
    stageId: StageId,
    updates: Partial<StageProgressRecord>
  ): Promise<StageProgressRecord> {
    const key = `${sessionId}_${stageId}`;
    const map = getLocalStorageMap<StageProgressRecord>(STORAGE_KEYS.STAGE_PROGRESS);
    const existing = map[key] || {
      id: key,
      sessionId,
      userId: updates.userId || '',
      stageId,
      status: 'in_progress',
      progressPercent: 0,
      score: null,
      feedbackSummary: null,
      updatedAt: new Date().toISOString(),
    };

    const updated: StageProgressRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setLocalStorageItem(STORAGE_KEYS.STAGE_PROGRESS, key, updated);

    // Also update session currentStage if relevant
    const sessions = getLocalStorageMap<InterviewSession>(STORAGE_KEYS.SESSIONS);
    if (sessions[sessionId]) {
      sessions[sessionId].updatedAt = new Date().toISOString();
      setLocalStorageItem(STORAGE_KEYS.SESSIONS, sessionId, sessions[sessionId]);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'stage_progress', key), updated);
      } catch (e) {
        console.warn('Firestore stage progress update fallback', e);
      }
    }

    return updated;
  }

  /**
   * Save candidate answer
   */
  static async saveAnswer(answer: AnswerRecord): Promise<void> {
    const key = `${answer.sessionId}_${answer.stageId}_${answer.questionId}`;
    setLocalStorageItem(STORAGE_KEYS.ANSWERS, key, answer);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'answers', key), answer);
      } catch (e) {
        console.warn('Firestore answer save fallback', e);
      }
    }
  }

  /**
   * Get all answers submitted for a stage
   */
  static async getAnswersForStage(sessionId: string, stageId: StageId): Promise<AnswerRecord[]> {
    const map = getLocalStorageMap<AnswerRecord>(STORAGE_KEYS.ANSWERS);
    return Object.values(map).filter(
      (ans) => ans.sessionId === sessionId && ans.stageId === stageId
    );
  }

  /**
   * Save stage official score
   */
  static async saveScore(scoreRecord: ScoreRecord): Promise<void> {
    const key = `${scoreRecord.sessionId}_${scoreRecord.stageId}`;
    setLocalStorageItem(STORAGE_KEYS.SCORES, key, scoreRecord);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'scores', key), scoreRecord);
      } catch (e) {
        console.warn('Firestore score save fallback', e);
      }
    }
  }

  /**
   * Get all scores for a session
   */
  static async getAllScores(sessionId: string): Promise<Record<StageId, ScoreRecord | null>> {
    const map = getLocalStorageMap<ScoreRecord>(STORAGE_KEYS.SCORES);
    const stages: StageId[] = ['resume', 'aptitude', 'coding', 'interview'];
    const result: Record<string, ScoreRecord | null> = {};

    for (const stg of stages) {
      result[stg] = map[`${sessionId}_${stg}`] || null;
    }

    return result as Record<StageId, ScoreRecord | null>;
  }

  /**
   * Save final evaluation report
   */
  static async saveEvaluation(report: EvaluationReport): Promise<void> {
    setLocalStorageItem(STORAGE_KEYS.EVALUATIONS, report.sessionId, report);

    // Mark session completed
    const sessions = getLocalStorageMap<InterviewSession>(STORAGE_KEYS.SESSIONS);
    if (sessions[report.sessionId]) {
      sessions[report.sessionId].status = 'completed';
      sessions[report.sessionId].overallScore = report.overallScore;
      sessions[report.sessionId].currentStage = 'evaluation';
      sessions[report.sessionId].updatedAt = new Date().toISOString();
      setLocalStorageItem(STORAGE_KEYS.SESSIONS, report.sessionId, sessions[report.sessionId]);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'evaluations', report.sessionId), report);
      } catch (e) {
        console.warn('Firestore evaluation save fallback', e);
      }
    }
  }

  /**
   * Get final evaluation report
   */
  static async getEvaluation(sessionId: string): Promise<EvaluationReport | null> {
    const map = getLocalStorageMap<EvaluationReport>(STORAGE_KEYS.EVALUATIONS);
    return map[sessionId] || null;
  }

  /**
   * Save interview conversational turn
   */
  static async saveInterviewTurn(turn: InterviewTurn): Promise<void> {
    const key = `${turn.sessionId}_${turn.id}`;
    setLocalStorageItem(STORAGE_KEYS.INTERVIEW_TURNS, key, turn);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'interview_turns', key), turn);
      } catch (e) {
        console.warn('Firestore interview turn save fallback', e);
      }
    }
  }

  /**
   * Get all conversation turns for a session
   */
  static async getInterviewTurns(sessionId: string): Promise<InterviewTurn[]> {
    const map = getLocalStorageMap<InterviewTurn>(STORAGE_KEYS.INTERVIEW_TURNS);
    return Object.values(map)
      .filter((t) => t.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Evaluates if a target stage can be accessed according to progression policy
   */
  static async canAccessStage(
    session: InterviewSession,
    targetStageId: StageId | 'evaluation'
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (targetStageId === 'resume') {
      return { allowed: true };
    }

    const previousStageMap: Record<string, StageId> = {
      aptitude: 'resume',
      coding: 'aptitude',
      interview: 'coding',
      evaluation: 'interview',
    };

    const prevStage = previousStageMap[targetStageId];
    if (!prevStage) return { allowed: true };

    const prevProgress = await this.getStageProgress(session.id, prevStage);

    if (!prevProgress) {
      return {
        allowed: false,
        reason: `You must begin with Stage 1: Resume Analysis before accessing ${targetStageId}.`,
      };
    }

    const isPolicyPassBased = session.progressionPolicy === 'pass_based';

    if (isPolicyPassBased) {
      if (prevProgress.status !== 'passed') {
        return {
          allowed: false,
          reason: `Stage policy requires a passing score on ${prevStage} before advancing. Current status: ${prevProgress.status}.`,
        };
      }
    } else {
      // completion_based policy
      const completedStatuses: StageWorkflowStatus[] = ['completed', 'passed', 'needs_improvement'];
      if (!completedStatuses.includes(prevProgress.status)) {
        return {
          allowed: false,
          reason: `Please complete ${prevStage} first to unlock this stage.`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Save a completed aptitude assessment attempt
   */
  static async saveAptitudeAttempt(attempt: AptitudeAttemptRecord): Promise<void> {
    setLocalStorageItem(STORAGE_KEYS.APTITUDE_ATTEMPTS, attempt.id, attempt);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'aptitude_attempts', attempt.id), attempt);
      } catch (e) {
        console.warn('Firestore aptitude attempt save fallback', e);
      }
    }
  }

  /**
   * Get all aptitude assessment attempts for a user or session
   */
  static async getAptitudeAttempts(userId?: string, streamId?: string): Promise<AptitudeAttemptRecord[]> {
    const map = getLocalStorageMap<AptitudeAttemptRecord>(STORAGE_KEYS.APTITUDE_ATTEMPTS);
    let attempts = Object.values(map);
    if (userId) {
      attempts = attempts.filter((a) => a.userId === userId);
    }
    if (streamId) {
      attempts = attempts.filter((a) => a.streamId === streamId);
    }
    return attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  /**
   * Get latest aptitude attempt for a session
   */
  static async getLatestAptitudeAttempt(sessionId: string): Promise<AptitudeAttemptRecord | null> {
    const map = getLocalStorageMap<AptitudeAttemptRecord>(STORAGE_KEYS.APTITUDE_ATTEMPTS);
    const matches = Object.values(map)
      .filter((a) => a.sessionId === sessionId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return matches[0] || null;
  }

  /**
   * Save a completed coding assessment attempt
   */
  static async saveCodingAttempt(attempt: CodingAttemptRecord): Promise<void> {
    setLocalStorageItem(STORAGE_KEYS.CODING_ATTEMPTS, attempt.id, attempt);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'coding_attempts', attempt.id), attempt);
      } catch (e) {
        console.warn('Firestore coding attempt save fallback', e);
      }
    }
  }

  /**
   * Get all coding assessment attempts for a user or stream
   */
  static async getCodingAttempts(userId?: string, streamId?: string): Promise<CodingAttemptRecord[]> {
    const map = getLocalStorageMap<CodingAttemptRecord>(STORAGE_KEYS.CODING_ATTEMPTS);
    let attempts = Object.values(map);
    if (userId) {
      attempts = attempts.filter((a) => a.userId === userId);
    }
    if (streamId) {
      attempts = attempts.filter((a) => a.streamId === streamId);
    }
    return attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  /**
   * Get latest coding attempt for a session
   */
  static async getLatestCodingAttempt(sessionId: string): Promise<CodingAttemptRecord | null> {
    const map = getLocalStorageMap<CodingAttemptRecord>(STORAGE_KEYS.CODING_ATTEMPTS);
    const matches = Object.values(map)
      .filter((a) => a.sessionId === sessionId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return matches[0] || null;
  }
}

