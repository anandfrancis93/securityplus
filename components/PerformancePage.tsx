'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { hasSufficientData } from '@/lib/irt';
import PerformanceGraphs from './PerformanceGraphs';
import QuizReviewModal from './QuizReviewModal';
import { QuizSession } from '@/lib/types';

export default function PerformancePage() {
  const { user, userProgress, predictedScore, loading, resetProgress, handleSignOut } = useApp();
  const router = useRouter();
  const [irtExpanded, setIrtExpanded] = useState(false);
  const [recentQuizzesExpanded, setRecentQuizzesExpanded] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedQuizForReview, setSelectedQuizForReview] = useState<QuizSession | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const handleResetProgress = async () => {
    if (confirm('Are you sure you want to reset your quiz progress? This cannot be undone.')) {
      try {
        await resetProgress();
        alert('Progress reset successfully!');
      } catch (error) {
        console.error('Error resetting progress:', error);
        alert('Failed to reset progress. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black font-mono">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-zinc-400 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  const totalAnswered = userProgress?.totalQuestions || 0;
  const correctAnswers = userProgress?.correctAnswers || 0;
  const estimatedAbility = userProgress?.estimatedAbility || 0;
  const accuracy = totalAnswered > 0 ? ((correctAnswers / totalAnswered) * 100).toFixed(1) : 0;

  // Color logic based on Ability Level (matches IRT progress bar)
  const isGoodPerformance = estimatedAbility >= 1.0;
  const isNeedsWork = estimatedAbility < -1.0;

  return (
    <div className="min-h-screen bg-black font-mono">

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-16 md:mb-20">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-12">
            <div className="relative">
              <button
                id="back-to-quiz"
                onClick={() => router.push('/cybersecurity/quiz')}
                className="relative group p-3 rounded-md transition-all duration-150 ease-out
                         hover:bg-blue-500/10 active:bg-blue-500/20
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                title="Back to Quiz"
                aria-label="Back to Quiz"
              >
                <svg
                  className="w-6 h-6 text-zinc-300 group-hover:text-blue-300 transition-colors duration-150 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                id="menu-performance"
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative group p-3 rounded-md transition-all duration-150 ease-out
                         hover:bg-zinc-900 active:bg-zinc-900
                         focus:outline-none focus:ring-2 focus:ring-zinc-600/50"
                title="Menu"
                aria-label="Open menu"
              >
                <svg
                  className="w-6 h-6 text-zinc-300 group-hover:text-zinc-100 transition-colors duration-150 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && user && !user?.isAnonymous && (
                <div
                  className="absolute right-0 top-full mt-3 bg-black
                           border border-zinc-800 rounded-md overflow-hidden
                           min-w-[240px] z-50 transition-opacity duration-150"
                >
                  {/* User Name Section */}
                  <div className="px-5 py-4 border-b border-zinc-800 bg-black">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-500/20">
                        <svg
                          className="w-5 h-5 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-200 font-mono">{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    id="sign-out-performance"
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-zinc-200 font-mono
                             hover:bg-zinc-900 active:bg-zinc-900
                             transition-colors duration-150 flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-md bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-150">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 text-white
                         tracking-tight leading-none">
              Performance
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl font-light tracking-wide font-mono">
              Track your progress and improvement
            </p>
          </div>
        </header>

        {/* Predicted Score Card */}
        <div className="bg-black rounded-md p-10 md:p-12 mb-8 border border-zinc-800">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl text-zinc-300 mb-4 tracking-tight font-medium font-mono">Predicted Score</h2>
            <div className="relative group cursor-help inline-block">
              <div className={`text-7xl md:text-8xl font-bold mb-4 transition-all duration-150 font-mono ${
                totalAnswered === 0 ? 'text-zinc-400' :
                isGoodPerformance ? 'text-emerald-400' :
                isNeedsWork ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {predictedScore}
              </div>
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black border border-zinc-800 rounded-md p-3 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="space-y-1 text-sm text-zinc-300 font-mono">
                  <div>
                    <span className="text-emerald-400 font-medium">Green:</span> 750 - 900
                  </div>
                  <div>
                    <span className="text-yellow-400 font-medium">Yellow:</span> 600 - 749
                  </div>
                  <div>
                    <span className="text-red-400 font-medium">Red:</span> 100 - 599
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-3 pt-2 border-t border-zinc-700 font-mono">Color is based on your Ability Level from IRT analysis, which correlates with predicted exam score.</p>
              </div>
            </div>
            <div className="text-lg md:text-xl text-zinc-500 font-mono">out of 900</div>
            <div className="mt-6">
              {totalAnswered > 0 ? (
                <div className={`inline-block px-8 py-3 rounded-md text-base md:text-lg font-medium transition-all duration-150 font-mono ${
                  isGoodPerformance ? 'bg-black text-emerald-400 border border-emerald-500/50' :
                  isNeedsWork ? 'bg-black text-red-400 border border-red-500/50' :
                  'bg-black text-yellow-400 border border-yellow-500/50'
                }`}>
                  {isGoodPerformance ? 'On track to pass' :
                   isNeedsWork ? 'Needs significant improvement' :
                   'More practice needed'}
                </div>
              ) : (
                <div className="text-zinc-500 text-lg font-mono">Start answering questions to see your prediction</div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="w-full bg-zinc-900 rounded-md h-4 relative overflow-hidden border border-zinc-800">
              {/* Progress bar fill - only show if totalAnswered > 0 */}
              {totalAnswered > 0 && (
                <div
                  className={`h-4 rounded-md transition-all duration-150 ${
                    isGoodPerformance ? 'bg-emerald-500' :
                    isNeedsWork ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(((predictedScore - 100) / 800) * 100, 100)}%` }}
                ></div>
              )}

              {/* Passing line marker at 750 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white opacity-50"
                style={{ left: `${((750 - 100) / 800) * 100}%` }}
              ></div>
            </div>

            {/* Scale labels */}
            <div className="flex justify-between text-sm text-zinc-400 mt-2 relative font-mono">
              <span>100</span>
              <span
                className="absolute text-white font-medium"
                style={{ left: `${((750 - 100) / 800) * 100}%`, transform: 'translateX(-50%)' }}
              >
                750
              </span>
              <span>900</span>
            </div>

            {/* Current score indicator - only show if totalAnswered > 0 */}
            {totalAnswered > 0 && predictedScore >= 100 && predictedScore <= 900 && (
              <div
                className="relative mt-2"
                style={{ paddingLeft: `${((predictedScore - 100) / 800) * 100}%` }}
              >
                <div className={`inline-block px-3 py-1 rounded-md text-sm font-medium transition-all duration-150 font-mono ${
                  isGoodPerformance ? 'bg-black text-emerald-400 border border-emerald-500/50' :
                  isNeedsWork ? 'bg-black text-red-400 border border-red-500/50' :
                  'bg-black text-yellow-400 border border-yellow-500/50'
                }`}>
                  {predictedScore}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase 1: Insufficient Data Warning */}
        {totalAnswered > 0 && !hasSufficientData(totalAnswered) && (
          <div className="bg-black border border-yellow-500/30 rounded-md p-6 md:p-8 mb-8 transition-all duration-150">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-yellow-400 font-semibold mb-2 tracking-tight text-lg font-mono">Preliminary Estimates</p>
                <p className="text-yellow-300/90 text-base leading-relaxed font-mono">
                  Answer at least 15 questions for reliable IRT analysis. Your current estimates are capped and may not reflect true ability.
                </p>
                <p className="text-yellow-400/70 text-sm mt-3 font-mono">
                  Progress: {totalAnswered}/15 questions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
          <div className="bg-black rounded-md p-8 border border-zinc-800 hover:border-zinc-700 transition-all duration-150">
            <div className="text-zinc-400 text-base md:text-lg mb-2 tracking-tight font-mono">Questions Attempted</div>
            <div className={`text-4xl md:text-5xl font-bold transition-all duration-150 font-mono ${totalAnswered === 0 ? 'text-zinc-400' : 'text-blue-400'}`}>{totalAnswered}</div>
          </div>
          <div className="bg-black rounded-md p-8 border border-zinc-800 hover:border-zinc-700 transition-all duration-150">
            <div className="text-zinc-400 text-base md:text-lg mb-2 tracking-tight font-mono">Correct Answers</div>
            <div className={`text-4xl md:text-5xl font-bold transition-all duration-150 font-mono ${
              totalAnswered === 0 ? 'text-zinc-400' :
              isGoodPerformance ? 'text-emerald-400' :
              isNeedsWork ? 'text-red-400' :
              'text-yellow-400'
            }`}>{correctAnswers}</div>
          </div>
          <div className="bg-black rounded-md p-8 border border-zinc-800 hover:border-zinc-700 transition-all duration-150">
            <div className="text-zinc-400 text-base md:text-lg mb-2 tracking-tight font-mono">Accuracy</div>
            <div className={`text-4xl md:text-5xl font-bold transition-all duration-150 font-mono ${
              totalAnswered === 0 ? 'text-zinc-400' :
              isGoodPerformance ? 'text-emerald-400' :
              isNeedsWork ? 'text-red-400' :
              'text-yellow-400'
            }`}>{accuracy}%</div>
          </div>
        </div>

        {/* IRT Score Analysis - Collapsible */}
        {totalAnswered > 0 && (
          <div className="bg-black border border-zinc-800 rounded-md p-8 md:p-10 mb-8 transition-all duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-mono">IRT Performance Analysis</h3>
              <button
                id="toggle-irt"
                onClick={() => setIrtExpanded(!irtExpanded)}
                className="p-3 hover:bg-white/5 active:bg-white/10 rounded-md transition-all duration-150"
                aria-label="Toggle IRT Performance Analysis"
              >
                <svg
                  className={`w-6 h-6 text-zinc-400 transition-transform duration-150 ${irtExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {irtExpanded ? (
              <>
                <div className="bg-black rounded-md p-6 mb-6 mt-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="relative group cursor-help">
                      <h4 className="text-base md:text-lg font-medium text-zinc-300 tracking-tight font-mono">Ability Level (-3 to 3)</h4>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-black border border-zinc-800 rounded-md p-3 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <p className="text-sm text-zinc-300 leading-relaxed font-mono">Your skill level adjusted for question difficulty. Higher scores mean you answered harder questions correctly. Range: -3 (beginner) to +3 (expert).</p>
                      </div>
                    </div>
                    <div className={`text-4xl md:text-5xl font-bold transition-all duration-150 font-mono ${
                      estimatedAbility >= 1.0 ? 'text-emerald-400' :
                      estimatedAbility >= -1.0 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {estimatedAbility.toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-zinc-900 rounded-md h-3 border border-zinc-800">
                      <div
                        className={`h-3 rounded-md transition-all duration-150 ${
                          estimatedAbility >= 1.0 ? 'bg-emerald-500' :
                          estimatedAbility >= -1.0 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${((estimatedAbility + 3) / 6) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-500 mt-2 font-mono">
                      <span>Beginner</span>
                      <span>Average</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black rounded-md p-6 border border-zinc-800">
                  <div className="text-base text-zinc-300 leading-relaxed font-mono">
                    {estimatedAbility >= 1.5 ? (
                      <>
                        <p className="text-emerald-400 font-semibold mb-4 flex items-center gap-2 text-lg font-mono">
                          Excellent Performance!
                        </p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">▸</span>
                            <span>Strong mastery across Security+ topics</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">▸</span>
                            <span>Handling harder synthesis questions well</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">▸</span>
                            <span>Deep understanding demonstrated</span>
                          </li>
                        </ul>
                      </>
                    ) : estimatedAbility >= 1.0 ? (
                      <>
                        <p className="text-emerald-400 font-semibold mb-4 flex items-center gap-2 tracking-tight text-lg font-mono">
                          Good Performance
                        </p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">▸</span>
                            <span>On track to pass the exam</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">▸</span>
                            <span>Handling medium-hard questions effectively</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">▸</span>
                            <span>Continue practicing to solidify knowledge</span>
                          </li>
                        </ul>
                      </>
                    ) : estimatedAbility >= 0 ? (
                      <>
                        <p className="text-yellow-400 font-semibold mb-4 flex items-center gap-2 tracking-tight text-lg font-mono">
                          Average Performance
                        </p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-1">▸</span>
                            <span>Moderate understanding shown</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-1">▸</span>
                            <span>Focus on multi-concept questions</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-1">▸</span>
                            <span>Review explanations carefully</span>
                          </li>
                        </ul>
                      </>
                    ) : estimatedAbility >= -1 ? (
                      <>
                        <p className="text-yellow-400 font-semibold mb-4 flex items-center gap-2 tracking-tight text-lg font-mono">
                          Below Average
                        </p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-1">▸</span>
                            <span>Struggling with harder questions</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-1">▸</span>
                            <span>Review fundamental concepts</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-1">▸</span>
                            <span>Focus on understanding, not memorizing</span>
                          </li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="text-red-400 font-semibold mb-4 flex items-center gap-2 tracking-tight text-lg font-mono">
                          Needs Improvement
                        </p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-3">
                            <span className="text-red-400 mt-1">▸</span>
                            <span>More practice needed</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-red-400 mt-1">▸</span>
                            <span>Start with easier questions</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-red-400 mt-1">▸</span>
                            <span>Build foundational knowledge first</span>
                          </li>
                        </ul>
                      </>
                    )}
                    {isGoodPerformance && (
                      <p className="text-sm text-zinc-400 mt-4 pt-4 border-t border-zinc-700 font-mono">
                        This level suggests likely exam success
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 text-base text-zinc-400 font-mono">
                Click to view detailed IRT analysis
              </div>
            )}
          </div>
        )}

        {/* Performance Graphs Section */}
        {userProgress && userProgress.quizHistory.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 tracking-tight font-mono">Progress Charts</h2>
            <PerformanceGraphs userProgress={userProgress} />
          </div>
        )}

        {/* Recent Activity - Collapsible */}
        {userProgress && userProgress.quizHistory.length > 0 && (
          <div className="mt-12 bg-black rounded-md p-8 md:p-10 border border-zinc-800 transition-all duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight font-mono">Recent Quizzes ({userProgress.quizHistory.length})</h3>
              <button
                id="toggle-recent-quizzes"
                onClick={() => setRecentQuizzesExpanded(!recentQuizzesExpanded)}
                className="p-3 hover:bg-white/5 active:bg-white/10 rounded-md transition-all duration-150"
                aria-label="Toggle Recent Quizzes"
              >
                <svg
                  className={`w-6 h-6 text-zinc-400 transition-transform duration-150 ${recentQuizzesExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {recentQuizzesExpanded ? (
              <div className="space-y-4 mt-6">
                {userProgress.quizHistory.slice(-5).reverse().map((quiz) => {
                  const date = new Date(quiz.startedAt);
                  const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const formattedTime = date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });

                  // Calculate time taken
                  const timeTakenMs = (quiz.endedAt || quiz.startedAt) - quiz.startedAt;
                  const timeTakenMinutes = Math.floor(timeTakenMs / 60000);
                  const timeTakenSeconds = Math.floor((timeTakenMs % 60000) / 1000);
                  const timeDisplay = timeTakenMinutes > 0
                    ? `${timeTakenMinutes}m ${timeTakenSeconds}s`
                    : `${timeTakenSeconds}s`;

                  // Check if quiz is incomplete
                  const isIncomplete = quiz.questions.length < 10;

                  return (
                    <button
                      key={quiz.id}
                      id={`quiz-review-${quiz.id}`}
                      onClick={() => setSelectedQuizForReview(quiz)}
                      className="w-full bg-black hover:bg-zinc-900 rounded-md p-6 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 cursor-pointer text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-base text-zinc-400 font-mono">
                            {formattedDate} • {formattedTime}
                          </div>
                          <div className="text-base mt-2 space-y-2">
                            <div>
                              <span className="text-zinc-300 font-mono">{quiz.questions.length} questions</span>
                              {isIncomplete && (
                                <span className="ml-3 text-sm px-3 py-1 rounded-md bg-black text-yellow-400 border border-yellow-500/50 font-mono">
                                  Incomplete
                                </span>
                              )}
                            </div>
                            <div className="text-zinc-400 font-mono">
                              Time: {timeDisplay}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl md:text-4xl font-bold text-blue-400 font-mono">
                            {quiz.score}/{quiz.questions.length}
                          </div>
                          <div className="text-base text-zinc-400 font-mono">
                            {((quiz.score / quiz.questions.length) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 text-base text-zinc-400 font-mono">
                Click to view your last 5 quizzes
              </div>
            )}
          </div>
        )}

        {/* Reset Progress - Destructive Action */}
        {totalAnswered > 0 && (
          <div className="mt-12 text-center pb-12">
            <button
              id="reset-progress"
              onClick={handleResetProgress}
              className="bg-black hover:bg-zinc-900 active:bg-zinc-900 text-red-400 border border-red-500/30 hover:border-red-500 font-semibold py-3 px-8 rounded-md text-base transition-all duration-150 font-mono"
            >
              Reset Progress
            </button>
          </div>
        )}
      </div>

      {/* Quiz Review Modal - Inside Performance View */}
      {selectedQuizForReview && (
        <QuizReviewModal
          quiz={selectedQuizForReview}
          onClose={() => setSelectedQuizForReview(null)}
        />
      )}
    </div>
  );
}
