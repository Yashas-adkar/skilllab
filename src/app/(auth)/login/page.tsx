'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { GoogleButton } from '@/components/common/GoogleButton';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const { signInWithEmail, signInWithGoogle, profile, error: authError, clearError, isDemoMode } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError();
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const navigateAfterAuth = (userProfile: typeof profile) => {
    if (!userProfile?.selectedCareerStream) {
      router.push('/profile?setup=required');
    } else {
      router.push(redirectTarget);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signInWithEmail({
        email: formData.email,
        password: formData.password,
      });
      // Will navigate in effect or next tick
      router.push('/dashboard');
    } catch {
      // AuthContext handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    clearError();
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch {
      // AuthContext handles error display
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // One-click demo filler for fast evaluation
  const handleDemoFill = () => {
    setFormData({
      email: 'alex.chen@example.com',
      password: 'Password123!',
    });
    setFormErrors({});
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-400">
          Sign in to resume your technical interview preparation
        </p>
      </div>

      {/* Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/5 space-y-6">
        {/* Error Alert */}
        {authError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-sm text-red-400 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">{authError}</div>
          </div>
        )}

        {/* Google Login */}
        <GoogleButton
          onClick={handleGoogleSignIn}
          isLoading={isGoogleSubmitting}
          disabled={isSubmitting}
          text="Sign in with Google"
        />

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-800" />
          <span className="absolute bg-slate-900 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Or sign in with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-200 p-1 focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isSubmitting}
            disabled={isGoogleSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Quick Demo Credentials Fill (in local mode) */}
        {isDemoMode && (
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Quick Test Account:</span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fill Demo Credentials</span>
            </button>
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-2 text-center text-xs text-slate-400">
          <p>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
