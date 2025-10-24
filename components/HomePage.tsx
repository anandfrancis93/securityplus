'use client';

import React, { useState } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, userProgress, predictedScore, loading, resetProgress, handleSignOut } = useApp();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<'quiz' | 'flashcards' | null>(null);

  const handleStartQuiz = () => {
    router.push('/cybersecurity/quiz');
  };

  const handleResetProgress = async () => {
    if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
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
            <h1 className="text-3xl font-bold mb-2 text-blue-400">Quiz</h1>
            <p className="text-gray-400">AI-generated synthesis questions</p>
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

            {totalAnswered > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Passing score: 750</span>
                  <span>Your score: {predictedScore}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${isPassing ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${Math.min((predictedScore / 900) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Questions Answered</div>
              <div className="text-3xl font-bold text-blue-400">{totalAnswered}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Correct Answers</div>
              <div className="text-3xl font-bold text-green-400">{correctAnswers}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Accuracy</div>
              <div className="text-3xl font-bold text-purple-400">{accuracy}%</div>
            </div>
          </div>

          {/* IRT Score Analysis */}
          {totalAnswered > 0 && (
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-blue-300 mb-4">📊 IRT Performance Analysis</h3>

              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-purple-200">Ability Level (θ theta)</h4>
                    <p className="text-xs text-gray-400 mt-1">Accounts for question difficulty in your performance</p>
                  </div>
                  <div className="text-3xl font-bold text-purple-400">
                    {estimatedAbility.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((estimatedAbility + 3) / 6) * 100}%` }}
                    ></div>
                  </div>
                  <div className="ml-3 text-xs text-gray-400 whitespace-nowrap">
                    -3 to +3
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-300 mb-2">📈 What This Means</h4>
                <div className="text-sm text-gray-300 space-y-2">
                  {estimatedAbility >= 1.5 ? (
                    <>
                      <p className="text-green-400 font-medium">✓ Excellent Performance!</p>
                      <p>Your ability level of <span className="font-bold text-blue-400">{estimatedAbility.toFixed(2)}</span> indicates strong mastery. You&apos;re performing well on harder questions, demonstrating deep understanding across multiple security concepts.</p>
                    </>
                  ) : estimatedAbility >= 1.0 ? (
                    <>
                      <p className="text-green-400 font-medium">✓ Good Performance</p>
                      <p>Your ability level of <span className="font-bold text-blue-400">{estimatedAbility.toFixed(2)}</span> suggests you&apos;re on track to pass. You&apos;re handling medium to hard questions effectively. Keep practicing synthesis questions to solidify your knowledge.</p>
                    </>
                  ) : estimatedAbility >= 0 ? (
                    <>
                      <p className="text-yellow-400 font-medium">⚠ Average Performance</p>
                      <p>Your ability level of <span className="font-bold text-blue-400">{estimatedAbility.toFixed(2)}</span> indicates moderate understanding. Focus on harder questions that combine multiple concepts. Review explanations carefully to improve your score.</p>
                    </>
                  ) : estimatedAbility >= -1 ? (
                    <>
                      <p className="text-orange-400 font-medium">⚠ Below Average</p>
                      <p>Your ability level of <span className="font-bold text-blue-400">{estimatedAbility.toFixed(2)}</span> suggests you&apos;re struggling with harder questions. Review fundamental concepts and focus on understanding why correct answers are right, not just memorizing them.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-400 font-medium">⚠ Needs Improvement</p>
                      <p>Your ability level of <span className="font-bold text-blue-400">{estimatedAbility.toFixed(2)}</span> indicates you need more practice. Start with easier questions, carefully read explanations, and build foundational knowledge before tackling harder synthesis questions.</p>
                    </>
                  )}
                  {isPassing && (
                    <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
                      This performance level suggests you would likely pass the Security+ exam if you maintain it.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center">
            <button
              onClick={handleStartQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg mb-4"
            >
              Start New Quiz (10 Questions)
            </button>

            {totalAnswered > 0 && (
              <div className="mt-6">
                <button
                  onClick={handleResetProgress}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 font-medium py-2 px-6 rounded-lg text-sm transition-all"
                >
                  Reset All Progress
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {userProgress && userProgress.quizHistory.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Recent Quizzes</h3>
              <div className="space-y-3">
                {userProgress.quizHistory.slice(-5).reverse().map((quiz) => (
                  <div key={quiz.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400">
                          {new Date(quiz.startedAt).toLocaleDateString()} at {new Date(quiz.startedAt).toLocaleTimeString()}
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Security+ SY0-701
            </h1>
            <p className="text-gray-400 text-lg">Choose your study method</p>
          </div>
        </div>

        {/* Three Simple Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quiz Card */}
          <button
            onClick={() => setSelectedCard('quiz')}
            className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-blue-500 transition-all cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-blue-500/20"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold mb-2 text-blue-400">Quiz</h2>
              <p className="text-gray-400 text-sm">Test your knowledge with AI-generated questions</p>
            </div>
          </button>

          {/* Flashcards Card */}
          <button
            onClick={() => setSelectedCard('flashcards')}
            className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-green-500 transition-all cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-green-500/20"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2 text-green-400">Flashcards</h2>
              <p className="text-gray-400 text-sm">Learn with spaced repetition</p>
            </div>
          </button>

          {/* PBQ Card (Coming Soon) */}
          <div className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 opacity-60 cursor-not-allowed shadow-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">🖥️</div>
              <h2 className="text-2xl font-bold mb-2 text-gray-400">Performance-Based Questions</h2>
              <p className="text-gray-500 text-sm">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
