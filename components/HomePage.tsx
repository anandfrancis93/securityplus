'use client';

import React from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, userProgress, predictedScore, loading, resetProgress, handleSignOut } = useApp();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
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
            </div>
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

        {/* Three Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quiz Card */}
          <div
            onClick={handleStartQuiz}
            className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 hover:border-blue-500 transition-all cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-blue-500/20"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-2xl font-bold mb-3 text-blue-400">Quiz</h2>
              <p className="text-gray-400 text-sm mb-6">AI-generated synthesis questions</p>

              {/* Quiz Stats */}
              <div className="space-y-3">
                {/* Predicted Score */}
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Predicted Score</div>
                  <div className={`text-3xl font-bold ${isPassing ? 'text-green-400' : 'text-yellow-400'}`}>
                    {predictedScore}
                  </div>
                  <div className="text-xs text-gray-500">out of 900</div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-700/50 rounded p-2">
                    <div className="text-xs text-gray-400">Questions</div>
                    <div className="text-lg font-bold text-blue-400">{totalAnswered}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <div className="text-xs text-gray-400">Correct</div>
                    <div className="text-lg font-bold text-green-400">{correctAnswers}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <div className="text-xs text-gray-400">Accuracy</div>
                    <div className="text-lg font-bold text-purple-400">{accuracy}%</div>
                  </div>
                </div>

                {/* Ability Level */}
                {totalAnswered > 0 && (
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Ability Level (θ)</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {estimatedAbility.toFixed(2)}
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${((estimatedAbility + 3) / 6) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                {totalAnswered > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetProgress();
                    }}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-2 px-4 rounded-lg text-xs transition-all"
                  >
                    Reset Progress
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Flashcards Card */}
          <div
            onClick={() => router.push('/cybersecurity/flashcards')}
            className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 hover:border-green-500 transition-all cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-green-500/20"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-3 text-green-400">Flashcards</h2>
              <p className="text-gray-400 text-sm mb-6">Spaced repetition learning</p>

              <div className="space-y-3">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-4">Study with flashcards using the SM-2 spaced repetition algorithm</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded">Again</span>
                    <span className="bg-orange-600/20 text-orange-400 px-2 py-1 rounded">Hard</span>
                    <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">Good</span>
                    <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">Easy</span>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">Features</div>
                  <ul className="text-xs text-gray-300 space-y-1 text-left">
                    <li>✓ Create custom flashcards</li>
                    <li>✓ Add images to cards</li>
                    <li>✓ Optimal review scheduling</li>
                    <li>✓ Browser notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* PBQ Card (Coming Soon) */}
          <div className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 opacity-60 cursor-not-allowed shadow-lg">
            <div className="text-center">
              <div className="text-5xl mb-4">🖥️</div>
              <h2 className="text-2xl font-bold mb-3 text-gray-400">Performance-Based Questions</h2>
              <p className="text-gray-500 text-sm mb-6">Hands-on simulations</p>

              <div className="space-y-3">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="text-4xl mb-2">🚧</div>
                  <p className="text-lg font-bold text-yellow-400 mb-2">Coming Soon</p>
                  <p className="text-xs text-gray-500">
                    Interactive simulations for real-world security scenarios
                  </p>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">Planned Features</div>
                  <ul className="text-xs text-gray-500 space-y-1 text-left">
                    <li>• Network configuration</li>
                    <li>• Security tool usage</li>
                    <li>• Incident response</li>
                    <li>• Policy implementation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {userProgress && userProgress.quizHistory.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-4">Recent Quizzes</h3>
            <div className="space-y-3">
              {userProgress.quizHistory.slice(-5).reverse().map((quiz) => {
                const quizPoints = quiz.questions.reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
                const quizMaxPoints = quiz.questions.reduce((sum, q) => sum + (q.maxPoints || 100), 0);
                return (
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
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
