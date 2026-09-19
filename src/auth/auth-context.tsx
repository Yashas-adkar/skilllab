'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/config';
import { UserRepository, createDefaultProfile } from '@/database/repositories/user.repository';
import {
  User,
  UserProfile,
  AuthContextType,
  SignInFormData,
  SignUpFormData,
} from '@/types/auth.types';

const LOCAL_SESSION_USER_KEY = 'skilllab_current_user_v1';
const LOCAL_MOCK_USERS_KEY = 'skilllab_mock_accounts_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map Firebase Auth error codes to user-friendly messages
export function mapAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'The email address is invalid. Please check the format.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/weak-password':
      return 'The password is too weak. It must be at least 8 characters long with a mix of characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this domain.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed attempts. Please try again later.';
    default:
      return 'An unexpected error occurred during authentication. Please try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isDemoMode = !isFirebaseConfigured;

  // Initialize Auth state
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const appUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
          };
          setUser(appUser);

          // Fetch or initialize profile
          let userProfile = await UserRepository.getProfile(fbUser.uid);
          if (!userProfile) {
            userProfile = createDefaultProfile(
              fbUser.uid,
              fbUser.displayName || 'Candidate',
              fbUser.email || '',
              fbUser.photoURL || undefined
            );
            await UserRepository.createProfile(userProfile);
          }
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Local Mock Auth Session Loader
      try {
        const storedUser = localStorage.getItem(LOCAL_SESSION_USER_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          UserRepository.getProfile(parsedUser.uid).then((p) => {
            if (p) {
              setProfile(p);
            } else {
              const defaultP = createDefaultProfile(
                parsedUser.uid,
                parsedUser.displayName || 'Candidate',
                parsedUser.email || ''
              );
              UserRepository.createProfile(defaultP).then(setProfile);
            }
            setLoading(false);
          });
          return;
        }
      } catch (err) {
        console.error('Error restoring session from local storage', err);
      }
      setLoading(false);
    }
  }, [isDemoMode]);

  const clearError = () => setError(null);

  /**
   * Email and Password Sign In
   */
  const signInWithEmail = async ({ email, password }: SignInFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (isFirebaseConfigured && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;
        const appUser: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
        };
        setUser(appUser);
        let userProfile = await UserRepository.getProfile(fbUser.uid);
        if (!userProfile) {
          userProfile = createDefaultProfile(
            fbUser.uid,
            fbUser.displayName || 'Candidate',
            fbUser.email || ''
          );
          await UserRepository.createProfile(userProfile);
        }
        setProfile(userProfile);
      } else {
        // Mock Auth simulation
        await new Promise((r) => setTimeout(r, 600)); // realistic network delay
        const mockAccountsRaw = localStorage.getItem(LOCAL_MOCK_USERS_KEY);
        const mockAccounts: Record<string, { name: string; email: string; pass: string; uid: string }> =
          mockAccountsRaw ? JSON.parse(mockAccountsRaw) : {};

        const normalizedEmail = email.trim().toLowerCase();
        const account = Object.values(mockAccounts).find(
          (acc) => acc.email.toLowerCase() === normalizedEmail
        );

        if (!account || account.pass !== password) {
          throw new Error('auth/invalid-credential');
        }

        const appUser: User = {
          uid: account.uid,
          email: account.email,
          displayName: account.name,
          photoURL: null,
          emailVerified: true,
        };

        localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(appUser));
        setUser(appUser);

        let userProfile = await UserRepository.getProfile(account.uid);
        if (!userProfile) {
          userProfile = createDefaultProfile(account.uid, account.name, account.email);
          await UserRepository.createProfile(userProfile);
        }
        setProfile(userProfile);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string }).code || (err as Error).message || '';
      const message = mapAuthErrorMessage(code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Email and Password Sign Up
   */
  const signUpWithEmail = async ({ name, email, password, confirmPassword }: SignUpFormData) => {
    setLoading(true);
    setError(null);

    // Client-side validations
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please re-enter your password.';
      setError(msg);
      setLoading(false);
      throw new Error(msg);
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setError(msg);
      setLoading(false);
      throw new Error(msg);
    }

    try {
      if (isFirebaseConfigured && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;

        // Update display name
        await updateFirebaseProfile(fbUser, { displayName: name.trim() });

        const appUser: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: name.trim(),
          photoURL: null,
          emailVerified: false,
        };
        setUser(appUser);

        // Initialize Firestore Profile
        const newProfile = createDefaultProfile(fbUser.uid, name.trim(), fbUser.email || '');
        await UserRepository.createProfile(newProfile);
        setProfile(newProfile);
      } else {
        // Mock Auth simulation
        await new Promise((r) => setTimeout(r, 600));
        const mockAccountsRaw = localStorage.getItem(LOCAL_MOCK_USERS_KEY);
        const mockAccounts: Record<string, { name: string; email: string; pass: string; uid: string }> =
          mockAccountsRaw ? JSON.parse(mockAccountsRaw) : {};

        const normalizedEmail = email.trim().toLowerCase();
        const exists = Object.values(mockAccounts).some(
          (acc) => acc.email.toLowerCase() === normalizedEmail
        );

        if (exists) {
          throw new Error('auth/email-already-in-use');
        }

        const newUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        mockAccounts[newUid] = {
          name: name.trim(),
          email: normalizedEmail,
          pass: password,
          uid: newUid,
        };
        localStorage.setItem(LOCAL_MOCK_USERS_KEY, JSON.stringify(mockAccounts));

        const appUser: User = {
          uid: newUid,
          email: normalizedEmail,
          displayName: name.trim(),
          photoURL: null,
          emailVerified: true,
        };

        localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(appUser));
        setUser(appUser);

        const newProfile = createDefaultProfile(newUid, name.trim(), normalizedEmail);
        await UserRepository.createProfile(newProfile);
        setProfile(newProfile);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string }).code || (err as Error).message || '';
      const message = mapAuthErrorMessage(code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google OAuth Login
   */
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isFirebaseConfigured && auth) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const userCredential = await signInWithPopup(auth, provider);
        const fbUser = userCredential.user;

        const appUser: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
        };
        setUser(appUser);

        let userProfile = await UserRepository.getProfile(fbUser.uid);
        if (!userProfile) {
          userProfile = createDefaultProfile(
            fbUser.uid,
            fbUser.displayName || 'Google User',
            fbUser.email || '',
            fbUser.photoURL || undefined
          );
          await UserRepository.createProfile(userProfile);
        }
        setProfile(userProfile);
      } else {
        // Mock Google OAuth simulation
        await new Promise((r) => setTimeout(r, 600));
        const demoUid = 'demo_google_user_01';
        const demoUser: User = {
          uid: demoUid,
          email: 'alex.chen@example.com',
          displayName: 'Alex Chen',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          emailVerified: true,
        };

        localStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(demoUser));
        setUser(demoUser);

        let userProfile = await UserRepository.getProfile(demoUid);
        if (!userProfile) {
          userProfile = createDefaultProfile(
            demoUid,
            demoUser.displayName || 'Alex Chen',
            demoUser.email || '',
            demoUser.photoURL || undefined
          );
          await UserRepository.createProfile(userProfile);
        }
        setProfile(userProfile);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string }).code || (err as Error).message || '';
      const message = mapAuthErrorMessage(code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update Profile in Database
   */
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Cannot update profile: No user authenticated.');

    setLoading(true);
    try {
      const updated = await UserRepository.updateProfile(user.uid, updates);
      if (updated) {
        setProfile(updated);
      }
    } catch (err) {
      const msg = 'Failed to update user profile. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      } else {
        localStorage.removeItem(LOCAL_SESSION_USER_KEY);
      }
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err) {
      console.error('Signout error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isDemoMode,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        updateUserProfile,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
