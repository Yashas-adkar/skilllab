'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { Loader2, Sparkles } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireCompletedProfile?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireCompletedProfile = false,
}) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login preserving the target route
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        router.replace(redirectUrl);
      } else if (requireCompletedProfile && profile && !profile.selectedCareerStream) {
        // Enforce user profile setup before dashboard access
        router.replace('/profile?setup=required');
      }
    }
  }, [user, profile, loading, router, pathname, requireCompletedProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            SkillLab
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (requireCompletedProfile && profile && !profile.selectedCareerStream) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};
