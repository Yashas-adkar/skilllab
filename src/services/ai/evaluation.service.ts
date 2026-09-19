export interface StageScoreBreakdown {
  stageId: string;
  stageName: string;
  weight: number;
  score: number;
  summary: string;
}

export interface FinalReadinessReport {
  overallScore: number;
  readinessBand: 'Needs Preparation' | 'Developing' | 'Interview Ready' | 'Top Performer';
  breakdown: StageScoreBreakdown[];
  strengths: string[];
  growthAreas: string[];
  actionPlan: string[];
}

export interface EvaluationService {
  generateFinalEvaluation(
    streamId: string,
    stageResults: Record<string, unknown>
  ): Promise<FinalReadinessReport>;
}
