import { NextRequest, NextResponse } from 'next/server';
import { selectAptitudeQuestions } from '@/services/questions/aptitude-bank';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId = 'cs_se', count = 10, excludedIds = [] } = body;

    const questions = selectAptitudeQuestions(streamId, count, excludedIds);

    // Strip correctIndex and explanation to prevent answer leakage in client
    const secureQuestions = questions.map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({
      questions: secureQuestions,
      total: secureQuestions.length,
    });
  } catch (error) {
    console.error('Error serving aptitude questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aptitude questions' },
      { status: 500 }
    );
  }
}
