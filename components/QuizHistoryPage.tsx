'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import Header from './Header';
import { authenticatedPost } from '@/lib/apiClient';

export default function QuizHistoryPage() {
  const { user, userProgress, loading, refreshProgress } = useApp();
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative">
          {/* Modern card */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-16 md:p-20 shadow-2xl">
            <div className="relative text-center">
              {/* Animated icon with gradient */}
              <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-8">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-zinc-800/50 rounded-full"></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 animate-spin">
                  <div className="w-full h-full rounded-full border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50"></div>
                </div>
                {/* Center icon - graduation cap with gradient */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 md:w-20 md:h-20 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Loading quiz history...
              </p>
              <p className="text-base md:text-lg mt-4 text-zinc-400">
                Please wait
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-zinc-950">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

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
            <p className="text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed text-zinc-400">
              View all your past quizzes
            </p>
          </div>
        </section>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/cybersecurity/performance')}
            className="px-8 py-4 text-lg md:text-xl font-bold transition-all duration-200 bg-zinc-900/50 hover:bg-white/5 rounded-2xl border border-zinc-800/50 hover:border-cyan-500/50 text-white"
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
                    className="relative w-full p-8 md:p-10 transition-all duration-300 hover:scale-[1.01] cursor-pointer bg-zinc-900/50 border border-zinc-800/50 hover:border-cyan-500/50 hover:bg-white/5 rounded-2xl hover:shadow-xl hover:shadow-cyan-500/10"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(quiz.id);
                      }}
                      className="absolute top-4 right-4 z-10 p-3 transition-all duration-200 group bg-zinc-900/50 hover:bg-white/5 rounded-2xl border border-red-500/30 hover:border-red-500/50"
                      title="Delete quiz"
                    >
                      <svg className="w-5 h-5 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)] group-hover:text-red-300 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="relative flex justify-between items-center pr-12">
                      <div>
                        <div className="text-lg md:text-xl text-zinc-400">
                          {formattedDate} • {formattedTime}
                        </div>
                        <div className="text-lg md:text-xl mt-4 space-y-3">
                          <div>
                            <span className="text-zinc-300 font-medium">{quiz.questions.length} questions</span>
                            {isIncomplete && (
                              <span className="ml-4 text-base px-4 py-2 transition-all duration-200 rounded-2xl bg-zinc-900/50 text-yellow-400 border border-yellow-500/50">
                                Incomplete
                              </span>
                            )}
                          </div>
                          <div className="text-zinc-400">
                            Time: {timeDisplay}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                          {quiz.score}/{quiz.questions.length}
                        </div>
                        <div className="text-xl text-zinc-400 mt-2">
                          {((quiz.score / quiz.questions.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirmation Dialog */}
                  {deleteConfirmId === quiz.id && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                      <div className="relative w-full max-w-md p-8 md:p-10 transition-all duration-200 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                        <div className="relative">
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Delete Quiz?</h3>
                          <p className="text-lg text-zinc-300 mb-8">
                            Are you sure you want to delete this quiz? This will remove all associated data and recalculate your performance metrics. This action cannot be undone.
                          </p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              disabled={isDeleting}
                              className="flex-1 py-4 px-6 font-bold text-lg transition-all duration-200 bg-zinc-900/50 hover:bg-white/5 rounded-2xl border border-red-500/50 hover:border-red-500/70 text-red-300 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isDeleting}
                              className="flex-1 py-4 px-6 font-bold text-lg transition-all duration-200 bg-zinc-900/50 hover:bg-white/5 rounded-2xl border border-zinc-800/50 hover:border-cyan-500/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="relative p-12 md:p-16 mb-12 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl shadow-2xl text-center">
            <div className="relative">
              <p className="text-2xl text-zinc-400">
                No quizzes taken yet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
