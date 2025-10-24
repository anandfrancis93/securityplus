'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';

export default function HomePage() {
  const { user, userProgress, predictedScore, loading, resetProgress, handleSignOut, userId } = useApp();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<'quiz' | 'flashcards' | null>(null);
  const [quizOption, setQuizOption] = useState<'start' | 'performance' | null>(null);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [irtExpanded, setIrtExpanded] = useState(false);
  const [recentQuizzesExpanded, setRecentQuizzesExpanded] = useState(false);

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
  const isPassing = predictedScore >= 750;

  // If a card is selected, show its details
  if (selectedCard === 'quiz') {
    // If no option selected, show the two choices
    if (quizOption === null) {
      return (
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => setSelectedCard(null)}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-3xl font-bold mb-2 text-white">Quiz</h1>
              <p className="text-gray-400">Choose an option</p>
            </div>

            {/* Two Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start New Quiz Option */}
              <button
                onClick={handleStartQuiz}
                className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-blue-500 cursor-pointer shadow-lg hover:shadow-blue-500/30 hover:shadow-2xl min-h-[250px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
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
                className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-yellow-500 cursor-pointer shadow-lg hover:shadow-yellow-500/30 hover:shadow-2xl min-h-[250px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
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
            <button
              onClick={() => setQuizOption(null)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold mb-2 text-white">Performance</h1>
            <p className="text-gray-400">Track your progress and improvement</p>
          </div>

          {/* Predicted Score Card */}
          <div className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl text-gray-400 mb-2">Predicted Score</h2>
              <div className={`text-6xl font-bold mb-2 ${isPassing ? 'text-green-400' : 'text-yellow-400'}`}>
                {predictedScore}
              </div>
              <div className="text-sm text-gray-500">out of 900</div>
              <div className="mt-4">
                {totalAnswered > 0 ? (
                  <div className={`inline-block px-4 py-2 rounded-full ${isPassing ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                    {isPassing ? '✓ On track to pass' : '⚠ More practice needed'}
                  </div>
                ) : (
                  <div className="text-gray-500">Start answering questions to see your prediction</div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Passing score: 750</span>
                <span>Your score: {predictedScore}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                {/* Endowed Progress - Show baseline progress even at 0 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent" style={{ width: '10%' }}></div>
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${isPassing ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.max(10, Math.min((predictedScore / 900) * 100, 100))}%` }}
                ></div>
              </div>
              {totalAnswered === 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">Start your journey - you&apos;re 10% there just by beginning!</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Questions Attempted</div>
              <div className="text-3xl font-bold text-blue-400">{totalAnswered}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Correct Answers</div>
              <div className="text-3xl font-bold text-green-400">{correctAnswers}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Accuracy</div>
              <div className="text-3xl font-bold text-yellow-400">{accuracy}%</div>
            </div>
          </div>

          {/* IRT Score Analysis - Collapsible (Cognitive Load) */}
          {totalAnswered > 0 && (
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-lg p-6 mb-8">
              <button
                onClick={() => setIrtExpanded(!irtExpanded)}
                className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              >
                <h3 className="text-lg font-bold text-blue-300">📊 IRT Performance Analysis</h3>
                <svg
                  className={`w-5 h-5 text-blue-300 transition-transform duration-200 ${irtExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {irtExpanded ? (
                <>
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-blue-200">Ability Level (θ theta)</h4>
                        <p className="text-xs text-gray-400 mt-1">Accounts for question difficulty in your performance</p>
                      </div>
                      <div className="text-3xl font-bold text-blue-400">
                        {estimatedAbility.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center mt-3">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${((estimatedAbility + 3) / 6) * 100}%` }}
                        ></div>
                      </div>
                      <div className="ml-3 text-xs text-gray-400 whitespace-nowrap">
                        -3 to +3
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-300 mb-3">📈 What This Means</h4>
                    <div className="text-sm text-gray-300">
                      {estimatedAbility >= 1.5 ? (
                        <>
                          <p className="text-green-400 font-medium mb-3 flex items-center gap-2">
                            <span className="text-2xl">✓</span> Excellent Performance!
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
                            <span className="text-2xl">⚠</span> Average Performance
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
                            <span className="text-2xl">⚠</span> Below Average
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
                      {isPassing && (
                        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700 flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>This level suggests likely exam success</span>
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

          {/* Recent Activity - Collapsible (Hick's Law) */}
          {userProgress && userProgress.quizHistory.length > 0 && (
            <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <button
                onClick={() => setRecentQuizzesExpanded(!recentQuizzesExpanded)}
                className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              >
                <h3 className="text-xl font-bold">Recent Quizzes ({userProgress.quizHistory.length})</h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${recentQuizzesExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

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
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
              title="Back to subjects"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {user && !user.isAnonymous && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to sign out?')) {
                    await handleSignOut();
                  }
                }}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            )}
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
            className="bg-gray-800 rounded-xl p-8 border-2 border-blue-500/50 hover:border-blue-500 cursor-pointer shadow-lg hover:shadow-blue-500/30 hover:shadow-2xl min-h-[200px] touch-manipulation relative hover:-translate-y-2 active:translate-y-0"
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
            className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-green-500 cursor-pointer shadow-lg hover:shadow-green-500/30 hover:shadow-2xl relative min-h-[200px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
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
