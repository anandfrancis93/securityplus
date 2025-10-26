'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import { hasSufficientData } from '@/lib/irt';
import PerformanceGraphs from './PerformanceGraphs';
import QuizReviewModal from './QuizReviewModal';
import { QuizSession } from '@/lib/types';

export default function CybersecurityPage() {
  const { user, userProgress, predictedScore, loading, resetProgress, handleSignOut, userId } = useApp();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<'quiz' | 'flashcards' | null>(null);
  const [quizOption, setQuizOption] = useState<'start' | 'performance' | null>(null);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [irtExpanded, setIrtExpanded] = useState(false);
  const [recentQuizzesExpanded, setRecentQuizzesExpanded] = useState(false);
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
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
        <div className="min-h-screen bg-black text-white">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <button
                  id="back-to-cybersecurity"
                  onClick={() => setSelectedCard(null)}
                  className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                  title="Back to Cybersecurity"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    id="menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                    title="Menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  {menuOpen && user && !user?.isAnonymous && (
                    <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50">
                      <div className="px-4 py-2 text-sm text-white border-b border-violet-500/30">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{user?.displayName || 'User'}</span>
                        </div>
                      </div>
                      <button
                        id="sign-out"
                        onClick={async () => {
                          if (confirm('Are you sure you want to sign out?')) {
                            await handleSignOut();
                            setMenuOpen(false);
                          }
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-2"
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

              <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Quiz</h1>
              <p className="text-slate-400 text-base">Choose an option</p>
            </div>

            {/* Two Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start New Quiz Option */}
              <button
                id="start-new-quiz"
                onClick={handleStartQuiz}
                className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-violet-500/30 hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-500/20 cursor-pointer min-h-[250px] touch-manipulation hover:scale-105 active:scale-100 transition-all duration-500"
              >
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">Start New Quiz</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">Take 10 AI-generated synthesis questions</p>
                </div>
              </button>

              {/* Performance Option */}
              <button
                id="performance"
                onClick={() => setQuizOption('performance')}
                className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-violet-500/30 hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-500/20 cursor-pointer min-h-[250px] touch-manipulation hover:scale-105 active:scale-100 transition-all duration-500"
              >
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">Performance</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">View your scores, IRT analysis, and history</p>
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
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <button
                id="back-to-quiz"
                onClick={() => setQuizOption(null)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                title="Back to Quiz"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  id="menu-performance"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                  title="Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {menuOpen && user && !user?.isAnonymous && (
                  <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50">
                    <div className="px-4 py-2 text-sm text-white border-b border-violet-500/30">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{user?.displayName || 'User'}</span>
                      </div>
                    </div>
                    <button
                      id="sign-out-performance"
                      onClick={async () => {
                        if (confirm('Are you sure you want to sign out?')) {
                          await handleSignOut();
                          setMenuOpen(false);
                        }
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-2"
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

            <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Performance</h1>
            <p className="text-slate-400 text-base">Track your progress and improvement</p>
          </div>

          {/* Predicted Score Card */}
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 mb-8 border border-violet-500/30 shadow-2xl shadow-violet-500/10">
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
              <h2 className="text-xl text-slate-400 mb-2 tracking-tight">Predicted Score</h2>
              <div className="relative group cursor-help inline-block">
                <div className={`text-6xl font-bold mb-2 transition-all duration-300 ${
                  totalAnswered === 0 ? 'text-slate-400' :
                  isGoodPerformance ? 'text-green-400' :
                  isNeedsWork ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {predictedScore}
                </div>
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                  <div className="space-y-1 text-sm text-slate-300">
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
                  <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-violet-500/30">Color is based on your Ability Level from IRT analysis, which correlates with predicted exam score.</p>
                </div>
              </div>
              <div className="text-sm text-slate-500">out of 900</div>
              <div className="mt-4">
                {totalAnswered > 0 ? (
                  <div className={`inline-block px-6 py-2 rounded-full transition-all duration-300 ${
                    isGoodPerformance ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                    isNeedsWork ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                    'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {isGoodPerformance ? 'On track to pass' :
                     isNeedsWork ? 'Needs significant improvement' :
                     'More practice needed'}
                  </div>
                ) : (
                  <div className="text-slate-500">Start answering questions to see your prediction</div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full bg-slate-700/50 rounded-full h-3 relative overflow-hidden backdrop-blur">
                {/* Progress bar fill - only show if totalAnswered > 0 */}
                {totalAnswered > 0 && (
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isGoodPerformance ? 'bg-gradient-to-r from-green-500 to-green-400' :
                      isNeedsWork ? 'bg-gradient-to-r from-red-500 to-red-400' :
                      'bg-gradient-to-r from-yellow-500 to-yellow-400'
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
              <div className="flex justify-between text-xs text-slate-400 mt-1 relative">
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
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    isGoodPerformance ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    isNeedsWork ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {predictedScore}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Phase 1: Insufficient Data Warning */}
          {totalAnswered > 0 && !hasSufficientData(totalAnswered) && (
            <div className="bg-yellow-900/20 backdrop-blur-xl border border-yellow-500/30 rounded-[28px] p-4 mb-8 shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-400 font-medium mb-1 tracking-tight">Preliminary Estimates</p>
                  <p className="text-yellow-300/90 text-sm leading-relaxed">
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
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-6 border border-violet-500/30 shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
              <div className="text-slate-400 text-sm mb-1 tracking-tight">Questions Attempted</div>
              <div className={`text-3xl font-bold transition-all duration-300 ${totalAnswered === 0 ? 'text-slate-400' : 'text-violet-400'}`}>{totalAnswered}</div>
            </div>
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-6 border border-violet-500/30 shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
              <div className="text-slate-400 text-sm mb-1 tracking-tight">Correct Answers</div>
              <div className={`text-3xl font-bold transition-all duration-300 ${
                totalAnswered === 0 ? 'text-slate-400' :
                isGoodPerformance ? 'text-green-400' :
                isNeedsWork ? 'text-red-400' :
                'text-yellow-400'
              }`}>{correctAnswers}</div>
            </div>
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-6 border border-violet-500/30 shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
              <div className="text-slate-400 text-sm mb-1 tracking-tight">Accuracy</div>
              <div className={`text-3xl font-bold transition-all duration-300 ${
                totalAnswered === 0 ? 'text-slate-400' :
                isGoodPerformance ? 'text-green-400' :
                isNeedsWork ? 'text-red-400' :
                'text-yellow-400'
              }`}>{accuracy}%</div>
            </div>
          </div>

          {/* IRT Score Analysis - Collapsible (Cognitive Load) */}
          {totalAnswered > 0 && (
            <div className="bg-slate-800/95 backdrop-blur-xl border border-violet-500/30 rounded-[28px] p-6 mb-8 shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight">IRT Performance Analysis</h3>
                <button
                  id="toggle-irt"
                  onClick={() => setIrtExpanded(!irtExpanded)}
                  className="p-2 hover:bg-white/5 active:bg-white/10 rounded-full transition-all duration-300"
                  aria-label="Toggle IRT Performance Analysis"
                >
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${irtExpanded ? 'rotate-180' : ''}`}
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

                  <div className="bg-slate-900/50 backdrop-blur rounded-[28px] p-4 mb-4 mt-4 border border-violet-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="relative group cursor-help">
                        <h4 className="text-sm font-medium text-slate-300 tracking-tight">Ability Level (-3 to 3)</h4>
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                          <p className="text-sm text-slate-300 leading-relaxed">Your skill level adjusted for question difficulty. Higher scores mean you answered harder questions correctly. Range: -3 (beginner) to +3 (expert).</p>
                        </div>
                      </div>
                      <div className={`text-3xl font-bold transition-all duration-300 ${
                        estimatedAbility >= 1.0 ? 'text-green-400' :
                        estimatedAbility >= -1.0 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {estimatedAbility.toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="bg-slate-700/50 rounded-full h-2 backdrop-blur">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            estimatedAbility >= 1.0 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                            estimatedAbility >= -1.0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                            'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${((estimatedAbility + 3) / 6) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Beginner</span>
                        <span>Average</span>
                        <span>Expert</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 backdrop-blur rounded-[28px] p-4 border border-violet-500/20">
                    <div className="text-sm text-slate-300 leading-relaxed">
                      {estimatedAbility >= 1.5 ? (
                        <>
                          <p className="text-green-400 font-medium mb-3 flex items-center gap-2">
                            Excellent Performance!
                          </p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">▸</span>
                              <span>Strong mastery across Security+ topics</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">▸</span>
                              <span>Handling harder synthesis questions well</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">▸</span>
                              <span>Deep understanding demonstrated</span>
                            </li>
                          </ul>
                        </>
                      ) : estimatedAbility >= 1.0 ? (
                        <>
                          <p className="text-green-400 font-medium mb-3 flex items-center gap-2 tracking-tight">
                            Good Performance
                          </p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">▸</span>
                              <span>On track to pass the exam</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">▸</span>
                              <span>Handling medium-hard questions effectively</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">▸</span>
                              <span>Continue practicing to solidify knowledge</span>
                            </li>
                          </ul>
                        </>
                      ) : estimatedAbility >= 0 ? (
                        <>
                          <p className="text-yellow-400 font-medium mb-3 flex items-center gap-2 tracking-tight">
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
                          <p className="text-yellow-400 font-medium mb-3 flex items-center gap-2 tracking-tight">
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
                          <p className="text-red-400 font-medium mb-3 flex items-center gap-2 tracking-tight">
                            Needs Improvement
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
                        <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-violet-500/30">
                          This level suggests likely exam success
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 text-sm text-slate-400">
                  Click to view detailed IRT analysis
                </div>
              )}
            </div>
          )}

          {/* Performance Graphs Section */}
          {userProgress && userProgress.quizHistory.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Progress Charts</h2>
              <PerformanceGraphs userProgress={userProgress} />
            </div>
          )}

          {/* Recent Activity - Collapsible (Hick's Law) */}
          {userProgress && userProgress.quizHistory.length > 0 && (
            <div className="mt-12 bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-6 border border-violet-500/30 shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight">Recent Quizzes ({userProgress.quizHistory.length})</h3>
                <button
                  id="toggle-recent-quizzes"
                  onClick={() => setRecentQuizzesExpanded(!recentQuizzesExpanded)}
                  className="p-2 hover:bg-white/5 active:bg-white/10 rounded-full transition-all duration-300"
                  aria-label="Toggle Recent Quizzes"
                >
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${recentQuizzesExpanded ? 'rotate-180' : ''}`}
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
                        className="w-full bg-slate-700/50 hover:bg-slate-700/70 rounded-[28px] p-4 border border-violet-500/30 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 cursor-pointer text-left"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-slate-400">
                              {formattedDate} • {formattedTime}
                            </div>
                            <div className="text-sm mt-1 space-y-1">
                              <div>
                                <span className="text-slate-300">{quiz.questions.length} questions</span>
                                {isIncomplete && (
                                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-700/30 text-yellow-400 border border-yellow-500/30">
                                    Incomplete
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400">
                                Time: {timeDisplay}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-violet-400">
                              {quiz.score}/{quiz.questions.length}
                            </div>
                            <div className="text-sm text-slate-400">
                              {((quiz.score / quiz.questions.length) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-400">
                  Click to view your last 5 quizzes
                </div>
              )}
            </div>
          )}

          {/* Reset Progress - Destructive Action at End (Serial Position Effect) */}
          {totalAnswered > 0 && (
            <div className="mt-8 text-center">
              <button
                id="reset-progress"
                onClick={handleResetProgress}
                className="bg-red-600/20 hover:bg-red-600/30 active:bg-red-600/40 text-red-400 border border-red-500/30 hover:border-red-500 font-medium py-2 px-6 rounded-full text-sm transition-all duration-300"
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
  }

  if (selectedCard === 'flashcards') {
    router.push('/cybersecurity/flashcards');
    return null;
  }

  // Main homepage with three simple cards
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8 relative">
            <button
              id="back-to-home"
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
              title="Back to subjects"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                id="menu-cybersecurity"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50">
                  {/* User Name */}
                  <div className="px-4 py-2 text-sm text-white border-b border-violet-500/30">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <button
                    id="sign-out-cybersecurity"
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-2"
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
            <h1 className="text-5xl font-bold mb-2 text-white tracking-tight">
              Cybersecurity
            </h1>
            <p className="text-slate-400 text-lg">Choose your study method</p>
          </div>
        </div>

        {/* Four Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quiz Card */}
          <button
            id="quiz"
            onClick={() => setSelectedCard('quiz')}
            className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-violet-500/30 hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-500/20 cursor-pointer min-h-[200px] touch-manipulation relative hover:scale-105 active:scale-100 transition-all duration-500"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">Quiz</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Test your knowledge with AI-generated questions</p>
            </div>
          </button>

          {/* Flashcards Card */}
          <button
            id="flashcards"
            onClick={() => setSelectedCard('flashcards')}
            className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-violet-500/30 hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-500/20 cursor-pointer relative min-h-[200px] touch-manipulation hover:scale-105 active:scale-100 transition-all duration-500"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">Flashcards</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Learn with spaced repetition</p>
            </div>
          </button>

          {/* PBQ Card (Coming Soon) */}
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-[28px] p-8 border border-slate-600/30 opacity-60 cursor-not-allowed shadow-lg relative min-h-[200px]">
            <div className="absolute top-4 right-4">
              <span className="bg-slate-700/50 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-600/30">
                Coming Soon
              </span>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-400 tracking-tight">Performance-Based Questions</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Hands-on scenarios</p>
            </div>
          </div>

          {/* Simulate Exam Card (Coming Soon) */}
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-[28px] p-8 border border-slate-600/30 opacity-60 cursor-not-allowed shadow-lg relative min-h-[200px]">
            <div className="absolute top-4 right-4">
              <span className="bg-slate-700/50 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-600/30">
                Coming Soon
              </span>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-400 tracking-tight">Simulate Exam</h2>
              <p className="text-slate-500 text-sm leading-relaxed">90-minute timed exam</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Review Modal */}
      {selectedQuizForReview && (
        <QuizReviewModal
          quiz={selectedQuizForReview}
          onClose={() => setSelectedQuizForReview(null)}
        />
      )}
    </div>
  );
}
