'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDeckStats } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';

export default function FlashcardPerformance() {
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
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-12">
            <button
              onClick={() => router.push('/cybersecurity/flashcards')}
              className={`${liquidGlass ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'} active:bg-white/10 transition-all duration-700 p-3 ${liquidGlass ? 'rounded-[28px]' : 'rounded-full'}`}
              title="Back to Flashcards"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`${liquidGlass ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'} active:bg-white/10 transition-all duration-700 p-3 ${liquidGlass ? 'rounded-[28px]' : 'rounded-full'}`}
                title="Menu"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className={`absolute right-0 top-full mt-3 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border-white/10 rounded-[28px]' : 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50 rounded-3xl'} border shadow-2xl py-3 min-w-[220px] z-50`}>
                  <div className={`px-5 py-3 text-sm ${liquidGlass ? 'text-zinc-200 border-b border-white/10' : 'text-slate-200 border-b border-slate-700/50'}`}>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className={`w-full px-5 py-3 text-sm text-left ${liquidGlass ? 'text-zinc-200' : 'text-slate-200'} hover:bg-white/5 active:bg-white/10 transition-all duration-700 flex items-center gap-3`}
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Section */}
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
              <div className="relative flex items-center gap-3 mb-3">
                <span className="text-2xl">📚</span>
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Total</div>
              </div>
              <div className="relative text-4xl font-bold text-amber-400">{stats.total}</div>
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px] p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">The total number of flashcards in your deck.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-6 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-amber-500/30'} group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${liquidGlass ? 'hover:shadow-orange-500/20' : ''}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <div className="relative flex items-center gap-3 mb-3">
                <span className="text-2xl">🌱</span>
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Learning</div>
              </div>
              <div className="relative text-4xl font-bold text-orange-400">{stats.learning}</div>
              {stats.learning > 0 && (
                <div className={`relative text-sm ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'} mt-2 font-medium`}>New cards</div>
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px] p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;ve attempted but got wrong or rated as &quot;Again&quot;. These cards have 0 successful repetitions and need daily practice.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-6 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-amber-500/30'} group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${liquidGlass ? 'hover:shadow-yellow-500/20' : ''}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <div className="relative flex items-center gap-3 mb-3">
                <span className="text-2xl">🔄</span>
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Review</div>
              </div>
              <div className="relative text-4xl font-bold text-yellow-400">{stats.review}</div>
              {stats.review > 0 && (
                <div className={`relative text-sm ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'} mt-2 font-medium`}>In progress</div>
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px] p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;re actively learning and have reviewed correctly 1-2 times. These cards are in progress but not yet mastered.</p>
              </div>
            </div>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-6 border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-slate-700/50 hover:border-amber-500/30'} group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${liquidGlass ? 'hover:shadow-amber-500/20' : ''}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <div className="relative flex items-center gap-3 mb-3">
                <span className="text-2xl">⭐</span>
                <div className={`text-sm font-semibold tracking-wide ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Mastered</div>
              </div>
              <div className="relative text-4xl font-bold text-amber-400">{stats.mastered}</div>
              {stats.mastered > 0 && (
                <div className={`relative text-sm ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'} mt-2 font-medium`}>
                  {Math.round((stats.mastered / stats.total) * 100)}% complete
                </div>
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-[28px] p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;ve successfully reviewed 3 or more times. These cards are well-learned and appear less frequently to maintain long-term retention.</p>
              </div>
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
    </div>
    </>
  );
}
