'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/auth-context';
import { StageId } from '@/types/auth.types';
import {
  InterviewSession,
  StageProgressRecord,
  ScoreRecord,
  StageWorkflowStatus,
} from '@/types/workflow.types';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';

export function useInterviewSession() {
  const { user, profile } = useAuth();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [stageProgress, setStageProgress] = useState<Record<StageId, StageProgressRecord> | null>(null);
  const [scores, setScores] = useState<Record<StageId, ScoreRecord | null> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSession = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const streamId = profile?.selectedCareerStream || 'cs_se';
    const activeSession = await WorkflowRepository.getOrCreateActiveSession(user.uid, streamId);
    setSession(activeSession);

    const [progressMap, scoresMap] = await Promise.all([
      WorkflowRepository.getAllStageProgress(activeSession.id),
      WorkflowRepository.getAllScores(activeSession.id),
    ]);

    setStageProgress(progressMap);
    setScores(scoresMap);
    setLoading(false);
  }, [user, profile?.selectedCareerStream]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const updateStage = async (stageId: StageId, updates: Partial<StageProgressRecord>) => {
    if (!session || !user) return;
    const updated = await WorkflowRepository.updateStageProgress(session.id, stageId, {
      ...updates,
      userId: user.uid,
    });

    setStageProgress((prev) => (prev ? { ...prev, [stageId]: updated } : null));
  };

  const completeStage = async (
    stageId: StageId,
    score: number,
    customStatus?: StageWorkflowStatus
  ) => {
    if (!session || !user) return;

    const isPassed = score >= session.passingScoreThreshold;
    const status: StageWorkflowStatus = customStatus || (isPassed ? 'passed' : 'needs_improvement');

    // Save stage score
    const scoreRecord: ScoreRecord = {
      id: `${session.id}_${stageId}`,
      sessionId: session.id,
      userId: user.uid,
      stageId,
      score,
      passingScore: session.passingScoreThreshold,
      passed: isPassed,
      createdAt: new Date().toISOString(),
    };
    await WorkflowRepository.saveScore(scoreRecord);

    // Update stage progress
    const updatedProgress = await WorkflowRepository.updateStageProgress(session.id, stageId, {
      userId: user.uid,
      status,
      score,
      progressPercent: 100,
    });

    setStageProgress((prev) => (prev ? { ...prev, [stageId]: updatedProgress } : null));
    setScores((prev) => (prev ? { ...prev, [stageId]: scoreRecord } : null));
  };

  const canAccess = async (targetStageId: StageId | 'evaluation') => {
    if (!session) return { allowed: false, reason: 'Session not initialized' };
    return WorkflowRepository.canAccessStage(session, targetStageId);
  };

  return {
    session,
    stageProgress,
    scores,
    loading,
    refreshSession: loadSession,
    updateStage,
    completeStage,
    canAccess,
  };
}
