'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { GoogleButton } from '@/components/common/GoogleButton';
import { PasswordStrengthMeter, evaluatePassword } from '@/components/common/PasswordStrengthMeter';
import {
  Sparkles,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const { score } = evaluatePassword(formData.password);
      if (score < 3) {
        errors.password = 'Password is too weak. Please satisfy more criteria below.';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signUpWithEmail({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      // Route through user profile setup
      router.push('/profile?setup=required');
    } catch {
      // Handled by AuthContext error state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleSubmitting(true);
    clearError();
    try {
      await signInWithGoogle();
      router.push('/profile?setup=required');
    } catch {
      // Handled by AuthContext error state
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-400">
            Start your AI-powered technical interview preparation
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/5 space-y-6">
          {/* Global Auth Error Alert */}
          {authError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-sm text-red-400 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">{authError}</div>
            </div>
          )}

          {/* Google Sign-up */}
          <GoogleButton
            onClick={handleGoogleSignUp}
            isLoading={isGoogleSubmitting}
            disabled={isSubmitting}
            text="Sign up with Google"
          />

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-slate-900 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Or register with email
            </span>
          </div>

          {/* Email Sign-up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {/* Full Name */}
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="e.g. Alex Chen"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              leftIcon={<UserIcon className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-1">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
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
                autoComplete="new-password"
                required
              />

              {/* Password Strength Meter */}
              <PasswordStrengthMeter password={formData.password} />
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <div className="flex items-center gap-1">
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="hover:text-slate-200 p-1 focus:outline-none cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              }
              autoComplete="new-password"
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              disabled={isGoogleSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          {/* Footer Terms & Sign In Link */}
          <div className="pt-2 text-center text-xs text-slate-400 space-y-3">
            <p>
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
