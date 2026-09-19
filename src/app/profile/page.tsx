'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { AuthGuard } from '@/auth/auth-guard';
import { CAREER_STREAMS } from '@/config/streams';
import { CareerStreamId } from '@/types/stream.types';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import {
  User as UserIcon,
  Compass,
  GraduationCap,
  Sparkles,
  Check,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Cpu,
  BarChart3,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

const streamIconMap: Record<string, React.ReactNode> = {
  Terminal: <Terminal className="w-5 h-5 text-blue-400" />,
  Cpu: <Cpu className="w-5 h-5 text-violet-400" />,
  BarChart3: <BarChart3 className="w-5 h-5 text-cyan-400" />,
};

function ProfileContent() {
  const { user, profile, updateUserProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form from existing profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.displayName || '');
      setSelectedStream(profile.selectedCareerStream || '');
      setHeadline(profile.profileInformation?.headline || '');
      setBio(profile.profileInformation?.bio || '');
      setDegree(profile.education?.degree || '');
      setInstitution(profile.education?.institution || '');
      setGraduationYear(profile.education?.graduationYear || '');
      setSkills(profile.skills || []);
    } else if (user) {
      setName(user.displayName || '');
    }
  }, [profile, user]);

  // When a stream is selected and skills are empty, auto-populate recommended skills
  const handleSelectStream = (streamId: string) => {
    setSelectedStream(streamId);
    const stream = CAREER_STREAMS.find((s) => s.id === streamId);
    if (stream && skills.length === 0) {
      setSkills(stream.recommendedSkills.slice(0, 5));
    }
  };

  const handleToggleRecommendedSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStream) {
      setError('Please select a target career stream to configure your interview preparation.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        selectedCareerStream: selectedStream,
        profileInformation: {
          headline: headline.trim(),
          bio: bio.trim(),
        },
        education: {
          degree: degree.trim(),
          institution: institution.trim(),
          graduationYear: graduationYear.trim(),
        },
        skills,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentStreamConfig = CAREER_STREAMS.find((s) => s.id === selectedStream);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <UserIcon className="w-3.5 h-3.5" />
            <span>Candidate Profile & Stream Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Personalize Your Interview Journey
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Select your technical track so AI can tailor resume criteria, aptitude, and mock interview questions.
          </p>
        </div>

        {profile?.selectedCareerStream && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Go to Dashboard
          </Button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-sm text-red-400 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-sm text-emerald-400 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Profile saved successfully! Redirecting to Dashboard...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Career Stream Selection */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>1. Select Your Career Stream</span>
                <span className="text-red-400 text-sm">*</span>
              </h2>
              <p className="text-xs text-slate-400">
                Determines the technical depth, ATS keywords, and problem-solving rubrics across all 4 stages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CAREER_STREAMS.map((stream) => {
              const isSelected = selectedStream === stream.id;
              return (
                <div
                  key={stream.id}
                  onClick={() => handleSelectStream(stream.id)}
                  className={`relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        {streamIconMap[stream.icon] || <Sparkles className="w-5 h-5 text-indigo-400" />}
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-white">{stream.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {stream.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {stream.recommendedSkills.slice(0, 3).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Basic Information */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>2. Candidate Information</span>
          </h2>

          <Card className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              required
            />

            <Input
              label="Registered Email (Read-Only)"
              value={user?.email || ''}
              disabled
              helperText="Associated with your secure login credentials"
            />

            <div className="sm:col-span-2">
              <Input
                label="Target Job Role / Title"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Backend Engineer / ML Systems Engineer"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Brief Bio / Interview Objective
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Briefly describe your experience, tech stack, and what level of interview you're targeting..."
                className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-500 rounded-xl p-3 text-sm transition-all duration-200 outline-none resize-none"
              />
            </div>
          </Card>
        </section>

        {/* SECTION 3: Technical Skills */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>3. Technical Skills & Keywords</span>
          </h2>

          <Card className="space-y-4">
            {/* Recommended Skills Pill Toggles */}
            {currentStreamConfig && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400">
                  Recommended for {currentStreamConfig.shortName} (Click to toggle):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentStreamConfig.recommendedSkills.map((sk) => {
                    const isSelected = skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => handleToggleRecommendedSkill(sk)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-medium'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sk}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Skill Input */}
            <div className="space-y-2">
              <Input
                label="Add Custom Skill (Press Enter to add)"
                placeholder="e.g. Kubernetes, Next.js, PyTorch"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleAddCustomSkill}
              />
            </div>

            {/* Active Skills List */}
            {skills.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-medium text-slate-400 block mb-2">
                  Your Current Skills ({skills.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-400 text-slate-500 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* SECTION 4: Education */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>4. Academic Background</span>
          </h2>

          <Card className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Degree / Specialization"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. B.Tech Computer Science"
            />
            <Input
              label="College / University"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. National Institute of Tech"
            />
            <Input
              label="Graduation Year"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="e.g. 2025"
            />
          </Card>
        </section>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Save Profile & Proceed to Dashboard
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
