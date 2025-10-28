'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDeckStats } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';

export default function PerformancePage() {
  const { userId, user, loading: authLoading, handleSignOut, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [loading, setLoading] = useState(true);
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
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative text-center">
          <div className={`animate-spin rounded-2xl h-32 w-32 md:h-40 md:w-40 border-4 ${liquidGlass ? 'border-white/10 border-t-cyan-400/80' : 'border-transparent border-b-2 border-b-violet-500'} mx-auto`}></div>
          <p className="mt-8 text-2xl text-zinc-400">Loading performance...</p>
        </div>
      </div>
    );
  }

  const stats = getDeckStats(reviews, flashcards.map(f => f.id));

  return (
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
      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/cybersecurity/flashcards')}
              className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
              title="Back to Flashcards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50">
                  <div className="px-4 py-2 text-sm text-slate-200 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full px-4 py-2 text-sm text-left text-slate-200 hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-2"
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
          <h1 className="text-4xl font-bold mb-2 text-slate-100 tracking-tight">Flashcard Performance</h1>
          <p className="text-slate-400 text-base">View your progress and statistics</p>
        </div>

        {/* Stats */}
        {flashcards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative">
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-5 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-violet-500/30'} group cursor-help hover:bg-white/5 ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-300'} hover:shadow-xl`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
              )}
              <div className="relative flex items-center gap-2 mb-2">
                <span className="text-lg">📚</span>
                <div className={`text-xs font-medium tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Total</div>
              </div>
              <div className="relative text-3xl font-bold text-violet-400">{stats.total}</div>
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">The total number of flashcards in your deck.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-5 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-violet-500/30'} group cursor-help hover:bg-white/5 ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-300'} hover:shadow-xl`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
              )}
              <div className="relative flex items-center gap-2 mb-2">
                <span className="text-lg">🌱</span>
                <div className={`text-xs font-medium tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Learning</div>
              </div>
              <div className="relative text-3xl font-bold text-yellow-400">{stats.learning}</div>
              {stats.learning > 0 && (
                <div className="relative text-xs text-slate-500 mt-1 font-medium">New cards</div>
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;ve attempted but got wrong or rated as &quot;Again&quot;. These cards have 0 successful repetitions and need daily practice.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-5 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-violet-500/30'} group cursor-help hover:bg-white/5 ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-300'} hover:shadow-xl`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
              )}
              <div className="relative flex items-center gap-2 mb-2">
                <span className="text-lg">🔄</span>
                <div className={`text-xs font-medium tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Review</div>
              </div>
              <div className="relative text-3xl font-bold text-yellow-400">{stats.review}</div>
              {stats.review > 0 && (
                <div className="relative text-xs text-slate-500 mt-1 font-medium">In progress</div>
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;re actively learning and have reviewed correctly 1-2 times. These cards are in progress but not yet mastered.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-5 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-violet-500/30'} group cursor-help hover:bg-white/5 ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-300'} hover:shadow-xl`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
              )}
              <div className="relative flex items-center gap-2 mb-2">
                <span className="text-lg">⭐</span>
                <div className={`text-xs font-medium tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Mastered</div>
              </div>
              <div className="relative text-3xl font-bold text-violet-400">{stats.mastered}</div>
              {stats.mastered > 0 && (
                <div className="relative text-xs text-slate-500 mt-1 font-medium">
                  {Math.round((stats.mastered / stats.total) * 100)}% complete
                </div>
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;ve successfully reviewed 3 or more times. These cards are well-learned and appear less frequently to maintain long-term retention.</p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Progress Button */}
        {flashcards.length > 0 && (
          <div className="relative text-center mt-8">
            <button
              id="reset-flashcard-progress"
              onClick={handleResetProgress}
              className={`${liquidGlass ? 'bg-yellow-600/20 hover:bg-yellow-600/30 active:bg-yellow-600/40 border-yellow-600/50' : 'bg-yellow-600/20 hover:bg-yellow-600/30 active:bg-yellow-600/40 border-yellow-600/50'} text-yellow-400 border font-semibold py-3 px-8 rounded-full ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-300'} min-h-[44px] hover:shadow-lg hover:shadow-yellow-600/10`}
            >
              Reset Progress
            </button>
          </div>
        )}

        {flashcards.length === 0 && (
          <div className="text-center py-12">
            <div className={`w-24 h-24 mx-auto flex items-center justify-center mb-6 ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'}`}>
              <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-slate-300 text-lg font-medium">No flashcards yet</p>
            <p className="text-slate-500 text-sm mt-2">
              Create your first flashcard to start tracking performance
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
