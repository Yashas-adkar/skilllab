export interface ResumeScoreDimension {
  dimensionName: string;
  score: number; // 0-100
  feedback: string;
}

export interface ResumeAnalysisResult {
  overallAtsScore: number;
  extractedSkills: string[];
  missingSkills: string[];
  dimensionScores: ResumeScoreDimension[];
  actionableRecommendations: string[];
}

export interface ResumeAnalysisService {
  analyzeResume(resumeText: string, streamId: string): Promise<ResumeAnalysisResult>;
}
