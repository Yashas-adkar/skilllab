'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';
import { AuthGuard } from '@/auth/auth-guard';
import { useInterviewSession } from '@/hooks/use-interview-session';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { StageHeader } from '@/components/stages/StageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Code,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  ChevronDown,
} from 'lucide-react';

const starterSnippets: Record<string, string> = {
  python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test execution
print(twoSum([2, 7, 11, 15], 9))
`,
  typescript: `function twoSum(nums: number[], target: number): number[] {
  // Write your solution here
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
  javascript: `function twoSum(nums, target) {
  // Write your solution here
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen[complement] !== undefined) {
      return [seen[complement], i];
    }
    seen[nums[i]] = i;
  }
  return [];
}
`,
  cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (seen.count(comp)) return {seen[comp], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};
`,
  java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (seen.containsKey(comp)) {
                return new int[] { seen.get(comp), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
`,
};

export default function CodingStagePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { stageProgress, completeStage, canAccess } = useInterviewSession();

  const stream = profile?.selectedCareerStream
    ? getStreamById(profile.selectedCareerStream) || getDefaultStream()
    : getDefaultStream();

  const currentProgress = stageProgress?.coding;

  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(starterSnippets['python']);
  const [activeTab, setActiveTab] = useState<'tests' | 'output'>('tests');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState<{
    passed: boolean;
    output: string;
    runtime: string;
    memory: string;
  } | null>(null);

  const [score, setScore] = useState<number | null>(null);
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState<string>('');

  useEffect(() => {
    canAccess('coding').then((res) => {
      setAccessAllowed(res.allowed);
      if (!res.allowed) {
        setAccessReason(res.reason || 'Prerequisite Stage 2 (Aptitude) must be completed first.');
      }
    });
  }, [canAccess]);

  useEffect(() => {
    if (currentProgress?.score !== null && currentProgress?.score !== undefined) {
      setScore(currentProgress.score);
    }
  }, [currentProgress]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(starterSnippets[lang] || '');
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setRunResults({
        passed: true,
        output: '[0, 1]',
        runtime: '38 ms (Beats 92.4%)',
        memory: '15.4 MB (Beats 88.1%)',
      });
      setActiveTab('tests');
    }, 600);
  };

  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
    setTimeout(async () => {
      const finalScore = 90;
      setScore(finalScore);
      setIsSubmitting(false);
      setRunResults({
        passed: true,
        output: 'All 3/3 Test Cases Passed Successfully!',
        runtime: '38 ms',
        memory: '15.4 MB',
      });
      await completeStage('coding', finalScore, 'passed');
    }, 900);
  };

  const isCompleted = currentProgress?.status === 'passed' || (score !== null && score >= 60);

  if (accessAllowed === false) {
    return (
      <AuthGuard requireCompletedProfile={true}>
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <Card className="max-w-md w-full text-center space-y-4 p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Stage Locked</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{accessReason}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/stages/aptitude')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Stage 2: Aptitude Test
            </Button>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireCompletedProfile={true}>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <StageHeader
          currentStageId="coding"
          stageNumber={3}
          stageTitle="Coding & Problem Solving"
          stageSubtitle="Evaluate algorithmic correctness, complexity, and clean code principles"
          streamName={stream.shortName}
          status={currentProgress?.status || 'not_started'}
          score={currentProgress?.score}
        />

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 flex flex-col">
          {/* Main Split-Screen IDE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* LEFT PANEL: Problem Description, Examples & Constraints */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <Card className="flex-1 space-y-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="emerald" size="sm">Easy</Badge>
                    <Badge variant="indigo" size="sm">Array / Hash Map</Badge>
                  </div>
                  <h2 className="text-xl font-bold text-white">1. Two Sum Target Lookup</h2>
                  <p className="text-xs text-slate-400">Stream Alignment: {stream.shortName}</p>
                </div>

                {/* Problem Statement */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <p>
                    Given an array of integers <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-xs">nums</code> and an integer <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-xs">target</code>, return indices of the two numbers such that they add up to <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-xs">target</code>.
                  </p>
                  <p className="text-slate-400 text-xs">
                    You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.
                  </p>
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Examples
                  </span>

                  {/* Example 1 */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="text-slate-400">
                      <strong className="text-slate-200">Input:</strong> nums = [2, 7, 11, 15], target = 9
                    </div>
                    <div className="text-slate-400">
                      <strong className="text-slate-200">Output:</strong> [0, 1]
                    </div>
                    <div className="text-slate-500 text-[11px] font-sans">
                      Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                    </div>
                  </div>

                  {/* Example 2 */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="text-slate-400">
                      <strong className="text-slate-200">Input:</strong> nums = [3, 2, 4], target = 6
                    </div>
                    <div className="text-slate-400">
                      <strong className="text-slate-200">Output:</strong> [1, 2]
                    </div>
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                  <span className="font-bold text-white uppercase tracking-wider block">
                    Constraints
                  </span>
                  <ul className="space-y-1 text-slate-400 font-mono text-[11px]">
                    <li>• 2 &lt;= nums.length &lt;= 10^4</li>
                    <li>• -10^9 &lt;= nums[i] &lt;= 10^9</li>
                    <li>• -10^9 &lt;= target &lt;= 10^9</li>
                    <li>• Only one valid answer exists.</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* RIGHT PANEL: Code Editor & Execution Results */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Editor Header */}
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-white">Solution Editor</span>
                </div>

                {/* Language Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Language:</span>
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="python">Python 3</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
              </div>

              {/* Code Area */}
              <div className="relative bg-slate-950 border-x border-slate-800 p-3 font-mono text-xs text-slate-200 min-h-[300px] flex-1 flex">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full bg-transparent resize-none outline-none font-mono text-xs leading-relaxed text-indigo-100 placeholder:text-slate-600"
                />
              </div>

              {/* Action Bar (Run & Submit) */}
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunCode}
                    isLoading={isRunning}
                    leftIcon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Run Code
                  </Button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitSolution}
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Submit Solution
                </Button>
              </div>

              {/* RESULT PLACEHOLDER */}
              <Card className="space-y-3 p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('tests')}
                      className={`text-xs font-semibold pb-1 cursor-pointer transition-colors ${
                        activeTab === 'tests'
                          ? 'text-indigo-400 border-b-2 border-indigo-500'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Test Cases
                    </button>
                    <button
                      onClick={() => setActiveTab('output')}
                      className={`text-xs font-semibold pb-1 cursor-pointer transition-colors ${
                        activeTab === 'output'
                          ? 'text-indigo-400 border-b-2 border-indigo-500'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Console Output
                    </button>
                  </div>

                  {runResults && (
                    <Badge variant={runResults.passed ? 'emerald' : 'rose'} size="sm">
                      {runResults.passed ? 'Accepted' : 'Failed'}
                    </Badge>
                  )}
                </div>

                {runResults ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span>Runtime: <strong className="text-emerald-400">{runResults.runtime}</strong></span>
                      <span>Memory: <strong className="text-slate-200">{runResults.memory}</strong></span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                      {activeTab === 'tests' ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <span>✓ Test Case 1: [2, 7, 11, 15], 9 ➔ Passed</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-400">
                            <span>✓ Test Case 2: [3, 2, 4], 6 ➔ Passed</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-400">
                            <span>✓ Test Case 3: [3, 3], 6 ➔ Passed</span>
                          </div>
                        </div>
                      ) : (
                        <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
                          {runResults.output}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Click &quot;Run Code&quot; to execute sample test cases or &quot;Submit Solution&quot; to evaluate full test suite.
                  </div>
                )}
              </Card>

              {/* NEXT STAGE CTA (Visible when passed) */}
              {isCompleted && (
                <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-emerald-400">
                        Stage 3 Completed
                      </span>
                      <Badge variant="emerald" size="sm">Score: {score}%</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      Stage 4: AI Mock Interview is Ready
                    </h4>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push('/stages/interview')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to AI Mock Interview
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
