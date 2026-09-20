import { NextRequest, NextResponse } from 'next/server';
import { getAptitudeQuestionById, APTITUDE_CATEGORIES } from '@/services/questions/aptitude-bank';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { AptitudeAttemptRecord, AptitudeQuestionReviewItem } from '@/types/workflow.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId = '',
      streamId = 'cs_se',
      streamName = 'Software Engineering',
      answers = {}, // questionId -> selectedOptionIndex
      questionIds = [],
    } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid submission: questionIds must not be empty.' },
        { status: 400 }
      );
    }

    const totalQuestions = questionIds.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const categoryStats: Record<string, { total: number; correct: number }> = {};
    APTITUDE_CATEGORIES.forEach((cat) => {
      categoryStats[cat] = { total: 0, correct: 0 };
    });

    const reviewQuestions: AptitudeQuestionReviewItem[] = [];

    for (const qId of questionIds) {
      const q = getAptitudeQuestionById(qId);
      if (!q) continue;

      const userChoice = answers[qId] !== undefined ? Number(answers[qId]) : undefined;
      const isAnswered = userChoice !== undefined && userChoice >= 0 && userChoice < q.options.length;
      const isCorrect = isAnswered && userChoice === q.correctIndex;

      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { total: 0, correct: 0 };
      }
      categoryStats[q.category].total += 1;

      if (isCorrect) {
        correctCount += 1;
        categoryStats[q.category].correct += 1;
      } else if (isAnswered) {
        incorrectCount += 1;
      } else {
        unansweredCount += 1;
      }

      reviewQuestions.push({
        id: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        userAnswer: userChoice,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      });
    }

    const percentageScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const categoryPerformance: Record<string, { total: number; correct: number; percentage: number }> = {};
    for (const [cat, stat] of Object.entries(categoryStats)) {
      if (stat.total > 0) {
        categoryPerformance[cat] = {
          total: stat.total,
          correct: stat.correct,
          percentage: Math.round((stat.correct / stat.total) * 100),
        };
      }
    }

    const attemptRecord: AptitudeAttemptRecord = {
      id: `apt_attempt_${sessionId || 'demo'}_${Date.now()}`,
      sessionId: sessionId || 'demo_session',
      userId,
      streamId,
      streamName,
      score: percentageScore,
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      categoryPerformance,
      questions: reviewQuestions,
      submittedAt: new Date().toISOString(),
    };

    // Persist attempt securely
    await WorkflowRepository.saveAptitudeAttempt(attemptRecord);

    return NextResponse.json({
      success: true,
      score: percentageScore,
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      categoryPerformance,
      reviewQuestions,
      attemptId: attemptRecord.id,
      attempt: attemptRecord,
    });
  } catch (error) {
    console.error('Aptitude submit error:', error);
    return NextResponse.json(
      { error: 'Failed to process aptitude submission' },
      { status: 500 }
    );
  }
}
