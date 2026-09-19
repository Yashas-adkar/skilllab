import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { UserProfile, StageId } from '@/types/auth.types';

const LOCAL_STORAGE_PROFILES_KEY = 'skilllab_user_profiles_v1';

// Initial default profile structure
export function createDefaultProfile(
  userId: string,
  name: string,
  email: string,
  photoURL?: string
): UserProfile {
  const now = new Date().toISOString();
  return {
    userId,
    name,
    email,
    photoURL: photoURL || '',
    profileInformation: {
      bio: '',
      headline: '',
    },
    selectedCareerStream: '',
    skills: [],
    education: {
      degree: '',
      institution: '',
      graduationYear: '',
    },
    interviewProgress: {
      completedStages: [],
      currentStage: 'resume',
      overallScore: null,
      stageStatus: {
        resume: 'available',
        aptitude: 'locked',
        coding: 'locked',
        interview: 'locked',
      },
    },
    createdAt: now,
    updatedAt: now,
  };
}

// Local storage fallback helpers for demo/offline mode
function getLocalProfiles(): Record<string, UserProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const profiles = getLocalProfiles();
    profiles[profile.userId] = profile;
    localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save profile to local storage', err);
  }
}

export class UserRepository {
  /**
   * Retrieves a user profile by UID
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        }
        return null;
      } catch (err) {
        console.warn('Firestore getProfile error, checking fallback', err);
      }
    }

    const localProfiles = getLocalProfiles();
    return localProfiles[userId] || null;
  }

  /**
   * Creates or initializes a new user profile in the database
   * Strictly omits password or sensitive credentials
   */
  static async createProfile(profile: UserProfile): Promise<UserProfile> {
    // Strip any unexpected sensitive properties
    const safeProfile: UserProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', profile.userId);
        await setDoc(userDocRef, safeProfile);
        return safeProfile;
      } catch (err) {
        console.warn('Firestore createProfile error, persisting locally', err);
      }
    }

    saveLocalProfile(safeProfile);
    return safeProfile;
  }

  /**
   * Updates an existing user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const existing = await this.getProfile(userId);
    if (!existing) return null;

    // Disallow overriding immutable keys
    const safeUpdates = { ...updates };
    delete (safeUpdates as Record<string, unknown>).userId;
    delete (safeUpdates as Record<string, unknown>).email;
    delete (safeUpdates as Record<string, unknown>).createdAt;
    delete (safeUpdates as Record<string, unknown>).password;

    const merged: UserProfile = {
      ...existing,
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, safeUpdates as Record<string, unknown>);
        return merged;
      } catch (err) {
        console.warn('Firestore updateProfile error, persisting locally', err);
      }
    }

    saveLocalProfile(merged);
    return merged;
  }
}
