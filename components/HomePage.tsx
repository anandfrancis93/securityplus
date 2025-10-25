'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import { hasSufficientData } from '@/lib/irt';
import PerformanceGraphs from './PerformanceGraphs';

export default function HomePage() {
  const { user, userProgress, predictedScore, loading, resetProgress, handleSignOut, userId } = useApp();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<'quiz' | 'flashcards' | null>(null);
  const [quizOption, setQuizOption] = useState<'start' | 'performance' | null>(null);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [irtExpanded, setIrtExpanded] = useState(false);
  const [recentQuizzesExpanded, setRecentQuizzesExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  useEffect(() => {
    const loadDueCount = async () => {
      if (!userId) return;

      try {
        const [allCards, reviews] = await Promise.all([
          getUserFlashcards(userId),
          getUserReviews(userId),
        ]);

        const due = getDueFlashcards(
          reviews,
          allCards.map((c) => c.id)
        );

        setDueFlashcardsCount(due.length);
      } catch (error) {
        console.error('Error loading due flashcards count:', error);
      }
    };

    loadDueCount();
  }, [userId]);

  const handleStartQuiz = () => {
    router.push('/cybersecurity/quiz');
  };

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
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

  // If a card is selected, show its details
  if (selectedCard === 'quiz') {
    // If no option selected, show the two choices
    if (quizOption === null) {
      return (
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  title="Back to Cybersecurity"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                    title="Menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  {menuOpen && user && !user?.isAnonymous && (
                    <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                      <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{user?.displayName || 'User'}</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to sign out?')) {
                            await handleSignOut();
                            setMenuOpen(false);
                          }
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-2 text-white">Quiz</h1>
              <p className="text-gray-400">Choose an option</p>
            </div>

            {/* Two Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start New Quiz Option */}
              <button
                onClick={handleStartQuiz}
                className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-white cursor-pointer min-h-[250px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
                style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Start New Quiz</h2>
                  <p className="text-gray-400 text-sm">Take 10 AI-generated synthesis questions</p>
                </div>
              </button>

              {/* Performance Option */}
              <button
                onClick={() => setQuizOption('performance')}
                className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-white cursor-pointer min-h-[250px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
                style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Performance</h2>
                  <p className="text-gray-400 text-sm">View your scores, IRT analysis, and history</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Performance option selected
    if (quizOption === 'performance') {
      return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setQuizOption(null)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                title="Back to Quiz"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  title="Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {menuOpen && user && !user?.isAnonymous && (
                  <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                    <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{user?.displayName || 'User'}</span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to sign out?')) {
                          await handleSignOut();
                          setMenuOpen(false);
                        }
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 text-white">Performance</h1>
            <p className="text-gray-400">Track your progress and improvement</p>
          </div>

          {/* Predicted Score Card */}
          <div className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700 shadow-xl">
            {/* Tooltip animation for Predicted Score */}
            <style jsx global>{`
              @keyframes tooltipFade {
                0% { opacity: 0; }
                26.3% { opacity: 0; }
                30.3% { opacity: 1; }
                96.1% { opacity: 1; }
                100% { opacity: 0; }
              }
            `}</style>

            <div className="text-center mb-6">
              <h2 className="text-xl text-gray-400 mb-2">Predicted Score</h2>
              <div className="relative group cursor-help inline-block">
                <div className={`text-6xl font-bold mb-2 ${
                  totalAnswered === 0 ? 'text-gray-400' :
                  isGoodPerformance ? 'text-green-400' :
                  isNeedsWork ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {predictedScore}
                </div>
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                  <div className="space-y-1 text-sm text-gray-300">
                    <div>
                      <span className="text-green-400 font-medium">Green:</span> 750 - 900
                    </div>
                    <div>
                      <span className="text-yellow-400 font-medium">Yellow:</span> 600 - 749
                    </div>
                    <div>
                      <span className="text-red-400 font-medium">Red:</span> 100 - 599
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-700">Color is based on your Ability Level from IRT analysis, which correlates with predicted exam score.</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">out of 900</div>
              <div className="mt-4">
                {totalAnswered > 0 ? (
                  <div className={`inline-block px-4 py-2 rounded-full ${
                    isGoodPerformance ? 'bg-green-900/30 text-green-400' :
                    isNeedsWork ? 'bg-red-900/30 text-red-400' :
                    'bg-yellow-900/30 text-yellow-400'
                  }`}>
                    {isGoodPerformance ? '✓ On track to pass' :
                     isNeedsWork ? '✗ Needs significant improvement' :
                     '⚠ More practice needed'}
                  </div>
                ) : (
                  <div className="text-gray-500">Start answering questions to see your prediction</div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                {/* Progress bar fill - only show if totalAnswered > 0 */}
                {totalAnswered > 0 && (
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isGoodPerformance ? 'bg-green-500' :
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
              <div className="flex justify-between text-xs text-gray-400 mt-1 relative">
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
                  className="relative -mt-1"
                  style={{ paddingLeft: `${((predictedScore - 100) / 800) * 100}%` }}
                >
                  <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    isGoodPerformance ? 'bg-green-500/20 text-green-400' :
                    isNeedsWork ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {predictedScore}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Phase 1: Insufficient Data Warning */}
          {totalAnswered > 0 && !hasSufficientData(totalAnswered) && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-400 font-medium mb-1">Preliminary Estimates</p>
                  <p className="text-yellow-300/90 text-sm">
                    Answer at least 15 questions for reliable IRT analysis. Your current estimates are capped and may not reflect true ability.
                  </p>
                  <p className="text-yellow-400/70 text-xs mt-2">
                    Progress: {totalAnswered}/15 questions
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Questions Attempted</div>
              <div className={`text-3xl font-bold ${totalAnswered === 0 ? 'text-gray-400' : 'text-blue-400'}`}>{totalAnswered}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Correct Answers</div>
              <div className={`text-3xl font-bold ${
                totalAnswered === 0 ? 'text-gray-400' :
                isGoodPerformance ? 'text-green-400' :
                isNeedsWork ? 'text-red-400' :
                'text-yellow-400'
              }`}>{correctAnswers}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Accuracy</div>
              <div className={`text-3xl font-bold ${
                totalAnswered === 0 ? 'text-gray-400' :
                isGoodPerformance ? 'text-green-400' :
                isNeedsWork ? 'text-red-400' :
                'text-yellow-400'
              }`}>{accuracy}%</div>
            </div>
          </div>

          {/* IRT Score Analysis - Collapsible (Cognitive Load) */}
          {totalAnswered > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">IRT Performance Analysis</h3>
                <button
                  onClick={() => setIrtExpanded(!irtExpanded)}
                  className="p-2 hover:opacity-80 transition-opacity"
                  aria-label="Toggle IRT Performance Analysis"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${irtExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {irtExpanded ? (
                <>
                  {/* Global tooltip animation */}
                  <style jsx global>{`
                    @keyframes tooltipFade {
                      0% { opacity: 0; }
                      26.3% { opacity: 0; }
                      30.3% { opacity: 1; }
                      96.1% { opacity: 1; }
                      100% { opacity: 0; }
                    }
                  `}</style>

                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="relative group cursor-help">
                        <h4 className="text-sm font-medium text-gray-300">Ability Level (-3 to 3)</h4>
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                          <p className="text-sm text-gray-300">Your skill level adjusted for question difficulty. Higher scores mean you answered harder questions correctly. Range: -3 (beginner) to +3 (expert).</p>
                        </div>
                      </div>
                      <div className={`text-3xl font-bold ${
                        estimatedAbility >= 1.0 ? 'text-green-400' :
                        estimatedAbility >= -1.0 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {estimatedAbility.toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            estimatedAbility >= 1.0 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            estimatedAbility >= -1.0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${((estimatedAbility + 3) / 6) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Beginner</span>
                        <span>Average</span>
                        <span>Expert</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-300">
                      {estimatedAbility >= 1.5 ? (
                        <>
                          <p className="text-green-400 font-medium mb-3 flex items-center gap-2">
                            Excellent Performance!
                          </p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">▸</span>
                              <span>Strong mastery across Security+ topics</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">▸</span>
                              <span>Handling harder synthesis questions well</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">▸</span>
                              <span>Deep understanding demonstrated</span>
                            </li>
                          </ul>
                        </>
                      ) : estimatedAbility >= 1.0 ? (
                        <>
                          <p className="text-green-400 font-medium mb-3 flex items-center gap-2">
                            <span className="text-2xl">✓</span> Good Performance
                          </p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">▸</span>
                              <span>On track to pass the exam</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">▸</span>
                              <span>Handling medium-hard questions effectively</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">▸</span>
                              <span>Continue practicing to solidify knowledge</span>
                            </li>
                          </ul>
                        </>
                      ) : estimatedAbility >= 0 ? (
                        <>
                          <p className="text-yellow-400 font-medium mb-3 flex items-center gap-2">
                            Average Performance
                          </p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">▸</span>
                              <span>Moderate understanding shown</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">▸</span>
                              <span>Focus on multi-concept questions</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">▸</span>
                              <span>Review explanations carefully</span>
                            </li>
                          </ul>
                        </>
                      ) : estimatedAbility >= -1 ? (
                        <>
                          <p className="text-yellow-400 font-medium mb-3 flex items-center gap-2">
                            Below Average
                          </p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">▸</span>
                              <span>Struggling with harder questions</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">▸</span>
                              <span>Review fundamental concepts</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">▸</span>
                              <span>Focus on understanding, not memorizing</span>
                            </li>
                          </ul>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400 font-medium mb-3 flex items-center gap-2">
                            <span className="text-2xl">⚠</span> Needs Improvement
                          </p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">▸</span>
                              <span>More practice needed</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">▸</span>
                              <span>Start with easier questions</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">▸</span>
                              <span>Build foundational knowledge first</span>
                            </li>
                          </ul>
                        </>
                      )}
                      {isGoodPerformance && (
                        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
                          This level suggests likely exam success
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 text-sm text-gray-400">
                  Click to view detailed IRT analysis
                </div>
              )}
            </div>
          )}

          {/* Performance Graphs Section */}
          {userProgress && userProgress.quizHistory.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6">Progress Charts</h2>
              <PerformanceGraphs userProgress={userProgress} />
            </div>
          )}

          {/* Recent Activity - Collapsible (Hick's Law) */}
          {userProgress && userProgress.quizHistory.length > 0 && (
            <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Recent Quizzes ({userProgress.quizHistory.length})</h3>
                <button
                  onClick={() => setRecentQuizzesExpanded(!recentQuizzesExpanded)}
                  className="p-2 hover:opacity-80 transition-opacity"
                  aria-label="Toggle Recent Quizzes"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${recentQuizzesExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {recentQuizzesExpanded ? (
                <div className="space-y-3 mt-4">
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

                    return (
                      <div key={quiz.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-gray-400">
                              {formattedDate} • {formattedTime}
                            </div>
                            <div className="text-sm mt-1">
                              <span className="text-gray-300">{quiz.questions.length} questions</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-400">
                              {quiz.score}/{quiz.questions.length}
                            </div>
                            <div className="text-sm text-gray-400">
                              {((quiz.score / quiz.questions.length) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 text-sm text-gray-400">
                  Click to view your last 5 quizzes
                </div>
              )}
            </div>
          )}

          {/* Reset Progress - Destructive Action at End (Serial Position Effect) */}
          {totalAnswered > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={handleResetProgress}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 font-medium py-2 px-6 rounded-lg text-sm transition-all"
              >
                Reset Progress
              </button>
            </div>
          )}
        </div>
      </div>
      );
    }
  }

  if (selectedCard === 'flashcards') {
    router.push('/cybersecurity/flashcards');
    return null;
  }

  // Main homepage with three simple cards
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8 relative">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors p-2"
              title="Back to subjects"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                  {/* User Name */}
                  <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white">
              Cybersecurity
            </h1>
            <p className="text-gray-400 text-lg">Choose your study method</p>
          </div>
        </div>

        {/* Four Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quiz Card */}
          <button
            onClick={() => setSelectedCard('quiz')}
            className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-white cursor-pointer min-h-[200px] touch-manipulation relative hover:-translate-y-2 active:translate-y-0"
            style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold mb-2 text-white">Quiz</h2>
              <p className="text-gray-400 text-sm">Test your knowledge with AI-generated questions</p>
            </div>
          </button>

          {/* Flashcards Card */}
          <button
            onClick={() => setSelectedCard('flashcards')}
            className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-white cursor-pointer relative min-h-[200px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
            style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2 text-white">Flashcards</h2>
              <p className="text-gray-400 text-sm">Learn with spaced repetition</p>
            </div>
          </button>

          {/* PBQ Card (Coming Soon) */}
          <div className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 opacity-60 cursor-not-allowed shadow-lg relative min-h-[200px]">
            <div className="absolute top-4 right-4">
              <span className="bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">🖥️</div>
              <h2 className="text-2xl font-bold mb-2 text-gray-400">Performance-Based Questions</h2>
              <p className="text-gray-500 text-sm">Hands-on scenarios</p>
            </div>
          </div>

          {/* Simulate Exam Card (Coming Soon) */}
          <div className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 opacity-60 cursor-not-allowed shadow-lg relative min-h-[200px]">
            <div className="absolute top-4 right-4">
              <span className="bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">⏱️</div>
              <h2 className="text-2xl font-bold mb-2 text-gray-400">Simulate Exam</h2>
              <p className="text-gray-500 text-sm">90-minute timed exam</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
