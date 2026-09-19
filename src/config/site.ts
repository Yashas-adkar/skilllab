import { StageDefinition } from '@/types/stage.types';

export const siteConfig = {
  name: 'SkillLab AI Mock Interview',
  shortName: 'SkillLab',
  description: 'Production-quality AI-powered interview preparation platform with multi-stage technical readiness evaluation.',
  links: {
    github: 'https://github.com/Yashas-adkar/skilllab',
  },
};

export const STAGES: StageDefinition[] = [
  {
    id: 'resume',
    stageNumber: 1,
    title: 'Resume Analysis',
    subtitle: 'ATS & Skill Gap Breakdown',
    description: 'AI-driven resume parsing, stream-aligned technical depth check, and actionable ATS score improvement suggestions.',
    durationMinutes: 5,
    iconName: 'FileText',
    criteriaSummary: 'Technical depth, impact metrics, project relevance & keywords',
  },
  {
    id: 'aptitude',
    stageNumber: 2,
    title: 'Aptitude Test',
    subtitle: 'Analytical & Problem-Solving Speed',
    description: 'Timed quantitative aptitude, logical reasoning, and domain fundamentals tailored to your selected stream.',
    durationMinutes: 20,
    iconName: 'Brain',
    criteriaSummary: 'Logical reasoning, quantitative problem solving & time efficiency',
  },
  {
    id: 'coding',
    stageNumber: 3,
    title: 'Coding Assessment',
    subtitle: 'Hands-on Technical Implementation',
    description: 'Interactive coding environment testing algorithms, data structures, and stream-specific engineering problems.',
    durationMinutes: 45,
    iconName: 'Code',
    criteriaSummary: 'Time/space complexity, clean code patterns & test coverage',
  },
  {
    id: 'interview',
    stageNumber: 4,
    title: 'AI Mock Interview',
    subtitle: 'Real-time Conversational Technical Round',
    description: 'Dynamic conversational AI technical and behavioral round adapting to your responses and resume experience.',
    durationMinutes: 30,
    iconName: 'Mic',
    criteriaSummary: 'Communication clarity, architecture depth & domain mastery',
  },
];
