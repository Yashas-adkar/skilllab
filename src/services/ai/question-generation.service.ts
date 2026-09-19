export interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  starterCode: Record<string, string>; // language -> starter snippet
  testCases: { input: string; expectedOutput: string; isHidden?: boolean }[];
}

export interface QuestionGenerationService {
  generateAptitudeQuestions(streamId: string, count: number): Promise<AptitudeQuestion[]>;
  generateCodingProblem(streamId: string, difficulty: string): Promise<CodingProblem>;
}
