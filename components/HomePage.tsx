'use client';

import React, { useState } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import SyncDevicesModal from './SyncDevicesModal';

export default function HomePage() {
  const { userProgress, predictedScore, loading, resetProgress, generatePairingCode, enterPairingCode, isPaired } = useApp();
  const router = useRouter();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [currentPairingCode, setCurrentPairingCode] = useState<string | null>(null);

  const handleStartQuiz = () => {
    router.push('/quiz');
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

  const handleGeneratePairingCode = async (): Promise<string> => {
    const code = await generatePairingCode();
    setCurrentPairingCode(code);
    return code;
  };

  const handleEnterPairingCode = async (code: string): Promise<boolean> => {
    return await enterPairingCode(code);
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
  const accuracy = totalAnswered > 0 ? ((correctAnswers / totalAnswered) * 100).toFixed(1) : 0;
  const isPassing = predictedScore >= 750;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1"></div>
            <button
              onClick={() => setShowSyncModal(true)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {isPaired ? 'Synced' : 'Sync Devices'}
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Security+ SY0-701
            </h1>
            <p className="text-gray-400 text-lg">Synthesis Question Generator</p>
          </div>
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

          {/* Progress Bar */}
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

        {/* Start Quiz Button */}
        <div className="text-center">
          <button
            onClick={handleStartQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Start New Quiz (10 Questions)
          </button>
          <p className="mt-4 text-gray-500 text-sm">
            Questions are generated using AI and combine multiple security concepts
          </p>

          {/* Reset Progress Button */}
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
                <div key={quiz.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
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
              ))}
            </div>
          </div>
        )}

        {/* Sync Devices Modal */}
        <SyncDevicesModal
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          onGenerateCode={handleGeneratePairingCode}
          onEnterCode={handleEnterPairingCode}
          currentCode={currentPairingCode}
        />
      </div>
    </div>
  );
}
