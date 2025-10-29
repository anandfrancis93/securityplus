'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import Header from './Header';
import { authenticatedPost } from '@/lib/apiClient';

export default function QuizHistoryPage() {
  const { user, userProgress, loading, liquidGlass, refreshProgress } = useApp();
  const router = useRouter();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await authenticatedPost('/api/delete-quiz', {
        userId: user.uid,
        quizId: quizId,
      });

      // Refresh user progress to reflect the deletion
      await refreshProgress();

      // Close confirmation dialog
      setDeleteConfirmId(null);
      console.log(`[DELETE QUIZ] Successfully deleted quiz ${quizId}`);
    } catch (error) {
      console.error('[DELETE QUIZ] Failed to delete quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative text-center">
          <div className={`animate-spin rounded-2xl h-32 w-32 md:h-40 md:w-40 border-4 ${liquidGlass ? 'border-white/10 border-t-cyan-400/80' : 'border-zinc-800 border-t-blue-500'} mx-auto`}></div>
          <p className={`mt-8 text-2xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-400 font-mono'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
      {/* Animated Background Gradients */}
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        {/* Hero Section */}
        <section className="text-center mb-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95]">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Quiz
              </span>
              <span className="block bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                History
              </span>
            </h1>
            <p className={`text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
              View all your past quizzes
            </p>
          </div>
        </section>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/cybersecurity/performance')}
            className={`px-8 py-4 text-lg md:text-xl font-bold transition-all duration-700 ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30' : 'bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700'} text-white`}
          >
            ← Back to Performance
          </button>
        </div>

        {/* Quiz History List */}
        {userProgress && userProgress.quizHistory.length > 0 ? (
          <div className="space-y-4 pb-12">
            {userProgress.quizHistory.slice().reverse().map((quiz) => {
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
                <div
                  key={quiz.id}
                  className="relative"
                >
                  <div
                    onClick={() => router.push(`/cybersecurity/quiz/review/${quiz.id}`)}
                    className={`relative w-full p-8 md:p-10 transition-all duration-700 hover:scale-[1.01] cursor-pointer ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-3xl hover:shadow-xl hover:shadow-white/10' : 'bg-black border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-md'}`}
                  >
                    {liquidGlass && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(quiz.id);
                      }}
                      className={`absolute top-4 right-4 z-10 p-3 transition-all duration-700 group ${liquidGlass ? 'bg-red-500/10 hover:bg-red-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 hover:border-red-500/50' : 'bg-red-900/20 hover:bg-red-900/30 rounded-md border border-red-500/30 hover:border-red-500/50'}`}
                      title="Delete quiz"
                    >
                      <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="relative flex justify-between items-center pr-12">
                      <div>
                        <div className={`text-lg md:text-xl text-zinc-400 ${liquidGlass ? '' : 'font-mono'}`}>
                          {formattedDate} • {formattedTime}
                        </div>
                        <div className="text-lg md:text-xl mt-4 space-y-3">
                          <div>
                            <span className={`text-zinc-300 font-medium ${liquidGlass ? '' : 'font-mono'}`}>{quiz.questions.length} questions</span>
                            {isIncomplete && (
                              <span className={`ml-4 text-base px-4 py-2 transition-all duration-700 ${liquidGlass ? 'rounded-2xl' : 'rounded-md'} bg-black text-yellow-400 border border-yellow-500/50 ${liquidGlass ? '' : 'font-mono'}`}>
                                Incomplete
                              </span>
                            )}
                          </div>
                          <div className={`text-zinc-400 ${liquidGlass ? '' : 'font-mono'}`}>
                            Time: {timeDisplay}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl md:text-5xl font-bold text-cyan-400 ${liquidGlass ? '' : 'font-mono'}`}>
                          {quiz.score}/{quiz.questions.length}
                        </div>
                        <div className={`text-xl text-zinc-400 mt-2 ${liquidGlass ? '' : 'font-mono'}`}>
                          {((quiz.score / quiz.questions.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirmation Dialog */}
                  {deleteConfirmId === quiz.id && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className={`relative w-full max-w-md p-8 md:p-10 transition-all duration-700 ${liquidGlass ? 'bg-white/10 backdrop-blur-2xl rounded-[40px] border border-white/20' : 'bg-zinc-900 rounded-md border border-zinc-700'}`}>
                        {liquidGlass && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
                        )}
                        <div className="relative">
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Delete Quiz?</h3>
                          <p className="text-lg text-zinc-300 mb-8">
                            Are you sure you want to delete this quiz? This will remove all associated data and recalculate your performance metrics. This action cannot be undone.
                          </p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              disabled={isDeleting}
                              className={`flex-1 py-4 px-6 font-bold text-lg transition-all duration-700 ${liquidGlass ? 'bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl rounded-2xl border border-red-500/50 hover:border-red-500/70' : 'bg-red-900/30 hover:bg-red-900/40 rounded-md border border-red-500/50'} text-red-300 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isDeleting}
                              className={`flex-1 py-4 px-6 font-bold text-lg transition-all duration-700 ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30' : 'bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`relative p-12 md:p-16 mb-12 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl' : 'bg-black border border-zinc-800 rounded-md'} text-center`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative">
              <p className={`text-2xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
                No quizzes taken yet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
