import { StageId, StageStatusType } from './auth.types';

export interface StageDefinition {
  id: StageId;
  stageNumber: number;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  iconName: string;
  criteriaSummary: string;
}
