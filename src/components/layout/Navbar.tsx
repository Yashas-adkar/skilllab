'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { getStreamById } from '@/config/streams';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Compass,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const activeStream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream)
    : null;

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Career Streams', href: '/profile', icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      {/* Optional Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-center">
          <p className="text-[11px] font-medium text-amber-300 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Local Development Mode (Mock Authentication active — no live Firebase required to test)</span>
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              SkillLab <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">Mock Interview Platform</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {user &&
            navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-slate-800/80'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* User Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Selected Career Stream Badge */}
              {activeStream ? (
                <Link href="/profile">
                  <Badge variant="indigo" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-indigo-400" />}>
                    {activeStream.shortName}
                  </Badge>
                </Link>
              ) : (
                <Link href="/profile">
                  <Badge variant="amber" size="sm">
                    Select Stream
                  </Badge>
                </Link>
              )}

              {/* Profile Link */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all text-slate-200 text-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="font-medium max-w-[120px] truncate text-xs">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </Link>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                isLoading={isLoggingOut}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                className="text-xs text-slate-400 hover:text-red-400 hover:border-red-500/30"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {user && activeStream && (
            <Badge variant="indigo" size="sm">
              {activeStream.shortName}
            </Badge>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-white truncate">{user.displayName || 'Candidate'}</span>
                  <span className="text-xs text-slate-400 truncate">{user.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  isLoading={isLoggingOut}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  className="w-full text-red-400 border-red-500/30"
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
