export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
}

export interface ProfileInformation {
  bio: string;
  headline: string;
}

export interface EducationInfo {
  degree: string;
  institution: string;
  graduationYear: string;
}

export type StageId = 'resume' | 'aptitude' | 'coding' | 'interview';
export type StageStatusType = 'locked' | 'available' | 'in_progress' | 'completed';

export interface InterviewProgress {
  completedStages: StageId[];
  currentStage: StageId;
  overallScore: number | null;
  stageStatus: Record<StageId, StageStatusType>;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  profileInformation: ProfileInformation;
  selectedCareerStream: string;
  skills: string[];
  education: EducationInfo;
  interviewProgress: InterviewProgress;
  createdAt: string;
  updatedAt: string;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  signInWithEmail: (data: SignInFormData) => Promise<void>;
  signUpWithEmail: (data: SignUpFormData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}
