'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDeckStats } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { AdaptiveBackground } from '@/components/ui/LiquidGlassBackground';
import { LiquidGlassCard, StatsCard } from '@/components/ui/LiquidGlassCard';

export default function FlashcardPerformance() {
  const { userId, user, loading: authLoading, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useRequireAuth(user, authLoading);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewScheduleOpen, setReviewScheduleOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFlashcards();
    }
  }, [userId]);

  const loadFlashcards = async () => {
    if (!userId) return;

    try {
      const [cards, cardReviews] = await Promise.all([
        getUserFlashcards(userId),
        getUserReviews(userId),
      ]);

      setFlashcards(cards);
      setReviews(cardReviews);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!userId) return;

    if (!confirm('Reset ALL flashcard progress? This will clear all review history and spaced repetition data. Your flashcards will not be deleted.')) return;

    try {
      const { resetFlashcardProgress } = await import('@/lib/flashcardDb');
      await resetFlashcardProgress(userId);
      alert('Flashcard progress reset successfully!');
      await loadFlashcards();
    } catch (error) {
      console.error('Error resetting flashcard progress:', error);
      alert('Failed to reset progress. Please try again.');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading performance..." />;
  }

  const stats = getDeckStats(reviews, flashcards.map(f => f.id));

  return (
    <AdaptiveBackground
      liquidGlass={liquidGlass}
      colors={{
        top: 'bg-amber-500/10',
        bottom: 'bg-orange-500/10',
        center: 'bg-emerald-500/5',
      }}
    >

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 pb-8 max-w-5xl">
        {/* Hero Section */}
        <div className="mb-8 flex-shrink-0">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight mb-6">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">Flashcard</span>
              <span className="block bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">Performance</span>
            </h1>
            <p className={`text-lg sm:text-xl md:text-2xl font-light ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'} leading-relaxed max-w-2xl mx-auto`}>
              View your progress and statistics
            </p>
          </div>
        </div>

        {/* Stats */}
        {flashcards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 relative">
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-6 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-amber-500/30'} group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${liquidGlass ? 'hover:shadow-amber-500/20' : ''}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <div className="relative mb-3">
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Total</div>
              </div>
              <div className="relative text-4xl font-bold text-amber-400">{stats.total}</div>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px]'} p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-sm leading-relaxed ${liquidGlass ? 'text-white' : 'text-slate-300'}`}>Total number of flashcards in your deck, including new and reviewed cards.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-6 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-amber-500/30'} group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${liquidGlass ? 'hover:shadow-orange-500/20' : ''}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <div className="relative mb-3">
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Learning</div>
              </div>
              <div className="relative text-4xl font-bold text-orange-400">{stats.learning}</div>
              {stats.learning > 0 && (
                <div className={`relative text-sm ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'} mt-2 font-medium`}>New cards</div>
              )}
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px]'} p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-sm leading-relaxed ${liquidGlass ? 'text-white' : 'text-slate-300'}`}>Cards you&apos;re struggling with - rated as &quot;Again&quot; or have been forgotten after learning. These need more practice to master.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-6 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-amber-500/30'} group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${liquidGlass ? 'hover:shadow-yellow-500/20' : ''}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <div className="relative mb-3">
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Review</div>
              </div>
              <div className="relative text-4xl font-bold text-yellow-400">{stats.review}</div>
              {stats.review > 0 && (
                <div className={`relative text-sm ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'} mt-2 font-medium`}>In progress</div>
              )}
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px]'} p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-sm leading-relaxed ${liquidGlass ? 'text-white' : 'text-slate-300'}`}>Cards you&apos;re actively learning - rated as &quot;Hard&quot;, &quot;Good&quot;, or &quot;Easy&quot; with 1-2 successful reviews. Making good progress!</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-6 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-amber-500/30'} group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${liquidGlass ? 'hover:shadow-amber-500/20' : ''}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <div className="relative mb-3">
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Mastered</div>
              </div>
              <div className="relative text-4xl font-bold text-amber-400">{stats.mastered}</div>
              {stats.mastered > 0 && (
                <div className={`relative text-sm ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'} mt-2 font-medium`}>
                  {Math.round((stats.mastered / stats.total) * 100)}% complete
                </div>
              )}
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px]'} p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-sm leading-relaxed ${liquidGlass ? 'text-white' : 'text-slate-300'}`}>Cards you&apos;ve successfully reviewed 3 or more times. Well-learned and scheduled with optimal intervals for long-term retention using FSRS.</p>
              </div>
            </div>
          </div>
        )}

        {/* Review Schedule Table */}
        {flashcards.length > 0 && (
          <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-8 border ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} mb-8`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${liquidGlass ? 'text-white' : 'text-slate-100'}`}>Review Schedule</h3>
                {reviews.length > 0 && (
                  <button
                    onClick={() => setReviewScheduleOpen(!reviewScheduleOpen)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    aria-label="Toggle review schedule"
                  >
                    <svg
                      className={`w-6 h-6 transition-transform duration-300 ${reviewScheduleOpen ? 'rotate-180' : ''} ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              {(reviews.length === 0 || reviewScheduleOpen) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${liquidGlass ? 'border-white/10' : 'border-slate-700'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Term</th>
                      <th className={`text-left py-3 px-4 font-semibold ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Last Review</th>
                      <th className={`text-left py-3 px-4 font-semibold ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Last Rating</th>
                      <th className={`text-left py-3 px-4 font-semibold ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Next Review</th>
                      <th className={`text-left py-3 px-4 font-semibold ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Interval</th>
                      <th className={`text-left py-3 px-4 font-semibold ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`py-12 px-4 text-center ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'}`}>
                          No reviews yet. Start studying to see your review schedule here!
                        </td>
                      </tr>
                    ) : (
                      reviews
                        .sort((a, b) => a.nextReviewDate - b.nextReviewDate)
                        .map((review) => {
                          const card = flashcards.find(f => f.id === review.flashcardId);
                          if (!card) return null;

                          const now = Date.now();
                          const isDue = review.nextReviewDate <= now;
                          const nextReviewDate = new Date(review.nextReviewDate);
                          const lastReviewDate = new Date(review.reviewedAt);
                          const intervalHours = Math.round((review.nextReviewDate - review.reviewedAt) / (1000 * 60 * 60));
                          const intervalDays = Math.round(intervalHours / 24);

                          // Calculate time until/since due
                          const timeDiff = Math.abs(review.nextReviewDate - now);
                          const hoursUntil = Math.round(timeDiff / (1000 * 60 * 60));
                          const daysUntil = Math.round(hoursUntil / 24);

                          return (
                            <tr key={review.flashcardId} className={`border-b ${liquidGlass ? 'border-white/5 hover:bg-white/5' : 'border-slate-800 hover:bg-slate-800/50'} transition-all`}>
                              <td className="py-4 px-4">
                                <div className={`font-medium truncate max-w-[200px] ${liquidGlass ? 'text-white' : 'text-slate-200'}`} title={card.term}>
                                  {card.term}
                                </div>
                              </td>
                              <td className={`py-4 px-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                                <div>{lastReviewDate.toLocaleDateString()}</div>
                                <div className={`text-xs ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'}`}>
                                  {lastReviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  review.difficulty === 'again' ? 'bg-red-900/30 text-red-400 border border-red-700/50' :
                                  review.difficulty === 'hard' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' :
                                  review.difficulty === 'good' ? 'bg-green-900/30 text-green-400 border border-green-700/50' :
                                  'bg-blue-900/30 text-blue-400 border border-blue-700/50'
                                }`}>
                                  {review.difficulty.charAt(0).toUpperCase() + review.difficulty.slice(1)}
                                </span>
                              </td>
                              <td className={`py-4 px-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                                <div>{nextReviewDate.toLocaleDateString()}</div>
                                <div className={`text-xs ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'}`}>
                                  {nextReviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className={`py-4 px-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                                {intervalDays > 0 ? (
                                  <span>{intervalDays} day{intervalDays !== 1 ? 's' : ''}</span>
                                ) : (
                                  <span className="text-yellow-400 font-semibold">{intervalHours} hour{intervalHours !== 1 ? 's' : ''}</span>
                                )}
                              </td>
                              <td className={`py-4 px-4 ${isDue ? 'text-red-400 font-semibold' : liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                                {isDue ? 'Due now' : (daysUntil > 0 ? `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : `In ${hoursUntil}h`)}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset Progress Button */}
        {flashcards.length > 0 && (
          <div className="relative text-center mt-12">
            <button
              id="reset-flashcard-progress"
              onClick={handleResetProgress}
              className={`${liquidGlass ? 'bg-yellow-600/20 hover:bg-yellow-600/30 active:bg-yellow-600/40 border-yellow-600/50 rounded-[28px]' : 'bg-yellow-600/20 hover:bg-yellow-600/30 active:bg-yellow-600/40 border-yellow-600/50 rounded-full'} text-yellow-400 border font-bold py-4 px-10 text-base transition-all duration-700 min-h-[52px] hover:shadow-xl ${liquidGlass ? 'hover:shadow-yellow-600/20' : 'hover:shadow-yellow-600/10'}`}
            >
              Reset Progress
            </button>
          </div>
        )}

        {flashcards.length === 0 && (
          <div className="text-center py-16">
            <div className={`w-32 h-32 mx-auto flex items-center justify-center mb-8 ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10' : 'bg-zinc-800 rounded-2xl'}`}>
              <svg className="w-20 h-20 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className={`text-xl font-semibold mb-3 ${liquidGlass ? 'text-zinc-300' : 'text-slate-300'}`}>No flashcards yet</p>
            <p className={`text-base ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'}`}>
              Create your first flashcard to start tracking performance
            </p>
          </div>
        )}
      </div>
    </AdaptiveBackground>
  );
}
