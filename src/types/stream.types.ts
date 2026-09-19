export type CareerStreamId = 'cs_se' | 'ai_ml' | 'data_science';

export interface StreamCriteriaItem {
  name: string;
  weight: number;
  description: string;
}

export interface CareerStream {
  id: CareerStreamId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: string;
  accentColor: string;
  recommendedSkills: string[];
  focusAreas: string[];
  resumeCriteria: StreamCriteriaItem[];
  aptitudeFocus: string[];
  codingTopics: string[];
  interviewDomains: string[];
}
