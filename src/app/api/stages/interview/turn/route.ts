import { NextRequest, NextResponse } from 'next/server';
import { ServerInterviewService } from '@/services/ai/server-interview.service';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { InterviewPhase, InterviewTurn } from '@/types/interview-chat.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, streamId, userMessage = '', currentPhase = 1, profile, history = [] } = body;

    if (!sessionId || !streamId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId and streamId are mandatory.' },
        { status: 400 }
      );
    }

    const safePhase = Math.min(8, Math.max(1, Number(currentPhase))) as InterviewPhase;

    // Process turn with ServerInterviewService
    const turnResult = await ServerInterviewService.processTurn({
      sessionId,
      streamId,
      userMessage,
      currentPhase: safePhase,
      profile,
      history,
    });

    // Persist conversation turn
    const turnRecord: InterviewTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      phase: turnResult.currentPhase,
      phaseName: turnResult.phaseName,
      question: turnResult.reply,
      candidateAnswer: userMessage || undefined,
      timestamp: new Date().toISOString(),
      evaluation: turnResult.evaluation,
      isFollowUp: turnResult.currentPhase === 6,
      topic: turnResult.phaseName,
    };

    await WorkflowRepository.saveInterviewTurn(turnRecord);

    return NextResponse.json(turnResult);
  } catch (error: unknown) {
    console.error('Interview turn error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process interview turn. Please try again.',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
