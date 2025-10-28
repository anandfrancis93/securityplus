'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import {
  getUserFlashcards,
  getUserReviews,
  getFlashcard,
  saveFlashcardReview,
} from '@/lib/flashcardDb';
import { getDueFlashcards, calculateNextReview } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';

export default function StudyFlashcards() {
  const { userId, user, loading: authLoading, handleSignOut, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  const [dueCardIds, setDueCardIds] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [imageEnlarged, setImageEnlarged] = useState(false);
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
      loadDueCards();
    }
  }, [userId]);

  const loadDueCards = async () => {
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

      setDueCardIds(due);

      if (due.length > 0) {
        const card = await getFlashcard(due[0]);
        setCurrentCard(card);
      }
    } catch (error) {
      console.error('Error loading due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || !userId || answering) return;

    setAnswering(true);

    try {
      // Get previous review if exists
      const reviews = await getUserReviews(userId);
      const previousReview = reviews.find((r) => r.flashcardId === currentCard.id) || null;

      // Calculate next review
      const newReview = calculateNextReview(previousReview, difficulty, currentCard.id, userId);

      // Save review
      await saveFlashcardReview(newReview);

      // Move to next card
      if (currentCardIndex < dueCardIds.length - 1) {
        const nextIndex = currentCardIndex + 1;
        setCurrentCardIndex(nextIndex);
        const nextCard = await getFlashcard(dueCardIds[nextIndex]);
        setCurrentCard(nextCard);
        setIsFlipped(false);
      } else {
        // Finished all cards
        router.push('/cybersecurity/flashcards?completed=true');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review. Please try again.');
    } finally {
      setAnswering(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative text-center">
          <div className={`animate-spin rounded-2xl h-32 w-32 md:h-40 md:w-40 border-4 ${liquidGlass ? 'border-white/10 border-t-cyan-400/80' : 'border-white/10 border-t-violet-500'} mx-auto`}></div>
          <p className={`mt-8 text-2xl md:text-3xl font-light tracking-tight ${liquidGlass ? 'text-zinc-400' : 'text-slate-300'}`}>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (dueCardIds.length === 0 || !currentCard) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative max-w-2xl mx-auto px-6">
          <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'} p-12 md:p-16 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} overflow-hidden`}>
            {/* Light Reflection */}
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
            )}

            <div className="relative text-center space-y-6">
              <div className="text-7xl md:text-8xl mb-8">✅</div>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">All Done!</h2>
              <p className={`text-xl md:text-2xl font-light leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-slate-300'}`}>No flashcards due right now.</p>
              <button
                onClick={() => router.push('/cybersecurity/flashcards')}
                className={`relative mt-8 ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-3xl' : 'bg-violet-600 hover:bg-violet-700 rounded-3xl'} text-white px-10 py-5 font-medium text-lg tracking-tight transition-all duration-700 shadow-xl ${liquidGlass ? 'border border-white/20 hover:shadow-2xl hover:shadow-emerald-500/30' : 'hover:shadow-violet-500/50'}`}
              >
                Back to Flashcards
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentCardIndex + 1) / dueCardIds.length) * 100;

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
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 py-8 max-w-5xl">
          {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => router.push('/cybersecurity/flashcards')}
              className={`${liquidGlass ? 'text-zinc-400 hover:text-white' : 'text-slate-300 hover:text-white'} hover:bg-white/5 active:bg-white/10 transition-all duration-700 p-4 rounded-2xl`}
              title="Back to Flashcards"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <p className={`text-xl md:text-2xl font-medium tracking-tight ${liquidGlass ? 'text-zinc-300' : 'text-slate-300'}`}>
              {currentCardIndex + 1} <span className={liquidGlass ? 'text-zinc-500' : 'text-slate-500'}>of</span> {dueCardIds.length}
            </p>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`${liquidGlass ? 'text-zinc-400 hover:text-white' : 'text-slate-300 hover:text-white'} hover:bg-white/5 active:bg-white/10 transition-all duration-700 p-4 rounded-2xl`}
                title="Menu"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-3xl shadow-2xl py-3 min-w-[200px] z-50">
                  <div className="px-4 py-3 text-sm text-white border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="tracking-wide">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-sm text-left text-white hover:bg-white/5 active:bg-white/10 transition-all duration-500 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="tracking-wide">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className={`w-full h-6 relative overflow-hidden ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl' : 'bg-slate-800 border border-transparent rounded-full'}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl" />
              )}
              <div
                className={`h-6 relative transition-all duration-700 ${liquidGlass ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 rounded-2xl' : 'bg-violet-500 rounded-full'} ${liquidGlass ? 'shadow-2xl shadow-violet-500/50' : 'shadow-lg shadow-violet-500/30'}`}
                style={{ width: `${progress}%` }}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-12" style={{ perspective: '1000px' }}>
          <div
            id="flip-card"
            className="relative cursor-pointer"
            style={{
              minHeight: '480px',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.7s',
            }}
            onClick={handleFlip}
          >
            {/* Front of card */}
            <div
              className={`absolute inset-0 ${liquidGlass ? 'bg-white/5' : 'bg-slate-800/95'} backdrop-blur-2xl ${liquidGlass ? 'rounded-[40px]' : 'rounded-[28px]'} p-10 sm:p-12 md:p-16 border-2 ${liquidGlass ? 'border-white/10' : 'border-slate-700'} shadow-2xl ${liquidGlass ? 'shadow-black/50' : 'shadow-slate-900/50'} overflow-hidden`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              <div className="relative flex items-center justify-center min-h-[400px] px-2 sm:px-0">
                <div className="text-center w-full space-y-6">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">{currentCard.term}</h2>
                  <p className={`text-lg md:text-xl font-light mt-8 tracking-tight ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>Click to reveal definition</p>
                </div>
              </div>

              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className={`flex items-center gap-2 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="text-base md:text-lg tracking-tight font-medium">Flip</span>
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div
              className={`absolute inset-0 ${liquidGlass ? 'bg-white/10' : 'bg-violet-900/20'} backdrop-blur-2xl ${liquidGlass ? 'rounded-[40px]' : 'rounded-[28px]'} p-10 sm:p-12 md:p-16 border-2 ${liquidGlass ? 'border-white/30' : 'border-violet-500/40'} shadow-2xl ${liquidGlass ? 'shadow-violet-500/30' : 'shadow-violet-500/20'} overflow-hidden`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Gradient Overlay */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent rounded-[40px] opacity-80" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              <div className="relative flex items-center justify-center min-h-[400px] px-2 sm:px-0">
                <div className="text-left w-full space-y-6">
                  <p className={`text-xl sm:text-2xl leading-relaxed whitespace-pre-wrap ${liquidGlass ? 'text-white' : 'text-slate-200'} tracking-tight font-light`}>{currentCard.definition}</p>
                  {currentCard.imageUrl && (
                    <div className="mt-8">
                      <img
                        src={currentCard.imageUrl}
                        alt="Flashcard visual"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageEnlarged(true);
                        }}
                        className={`max-w-full max-h-64 mx-auto ${liquidGlass ? 'rounded-[32px]' : 'rounded-3xl'} border-2 ${liquidGlass ? 'border-white/20' : 'border-slate-600'} cursor-pointer hover:border-violet-400 transition-all duration-700 shadow-xl hover:shadow-violet-500/50`}
                        title="Click to enlarge"
                      />
                      <p className={`text-sm ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'} mt-3 text-center tracking-tight`}>Click image to enlarge</p>
                    </div>
                  )}
                  {currentCard.context && (
                    <div className={`mt-8 pt-8 border-t ${liquidGlass ? 'border-white/20' : 'border-slate-700'}`}>
                      <p className={`text-lg ${liquidGlass ? 'text-zinc-300' : 'text-slate-300'} italic whitespace-pre-wrap tracking-tight font-light`}>{currentCard.context}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer Buttons - Show when flipped */}
        {isFlipped && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 mb-12">
            {/* Again Button */}
            <div className="relative group">
              <button
                id="again"
                onClick={() => handleAnswer('again')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[32px]' : 'bg-red-600 rounded-3xl'} ${liquidGlass ? 'hover:bg-white/10 hover:scale-105' : 'hover:bg-red-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-7 px-6 font-bold min-h-[72px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-red-400/60' : 'border-transparent hover:border-red-400'} ${liquidGlass ? 'shadow-lg hover:shadow-2xl hover:shadow-red-500/50' : 'shadow-xl hover:shadow-red-500/50'} transition-all duration-700`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Again</div>
                <div className="relative text-base opacity-75 tracking-tight mt-2">1 day</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-slate-900/95 backdrop-blur border border-slate-600' : 'bg-slate-800/95 backdrop-blur border border-slate-700'} rounded-3xl p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className="text-base text-slate-200 tracking-tight">Couldn&apos;t remember or got it wrong. Card will be reviewed in 1 day.</p>
              </div>
            </div>

            {/* Hard Button */}
            <div className="relative group">
              <button
                id="hard"
                onClick={() => handleAnswer('hard')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[32px]' : 'bg-yellow-600 rounded-3xl'} ${liquidGlass ? 'hover:bg-white/10 hover:scale-105' : 'hover:bg-yellow-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-7 px-6 font-bold min-h-[72px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-yellow-400/60' : 'border-transparent hover:border-yellow-400'} ${liquidGlass ? 'shadow-lg hover:shadow-2xl hover:shadow-yellow-500/50' : 'shadow-xl hover:shadow-yellow-500/50'} transition-all duration-700`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Hard</div>
                <div className="relative text-base opacity-75 tracking-tight mt-2">1 day</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-slate-900/95 backdrop-blur border border-slate-600' : 'bg-slate-800/95 backdrop-blur border border-slate-700'} rounded-3xl p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className="text-base text-slate-200 tracking-tight">Difficult to recall, needed time. Card will be reviewed in 1 day.</p>
              </div>
            </div>

            {/* Good Button */}
            <div className="relative group">
              <button
                id="good"
                onClick={() => handleAnswer('good')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[32px]' : 'bg-green-600 rounded-3xl'} ${liquidGlass ? 'hover:bg-white/10 hover:scale-105' : 'hover:bg-green-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-7 px-6 font-bold min-h-[72px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-green-400/60' : 'border-transparent hover:border-green-400'} ${liquidGlass ? 'shadow-lg hover:shadow-2xl hover:shadow-green-500/50' : 'shadow-xl hover:shadow-green-500/50'} transition-all duration-700`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Good</div>
                <div className="relative text-base opacity-75 tracking-tight mt-2">3 days</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-slate-900/95 backdrop-blur border border-slate-600' : 'bg-slate-800/95 backdrop-blur border border-slate-700'} rounded-3xl p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className="text-base text-slate-200 tracking-tight">Recalled with some effort. Card will be reviewed in 3 days.</p>
              </div>
            </div>

            {/* Easy Button */}
            <div className="relative group">
              <button
                id="easy"
                onClick={() => handleAnswer('easy')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[32px]' : 'bg-blue-600 rounded-3xl'} ${liquidGlass ? 'hover:bg-white/10 hover:scale-105' : 'hover:bg-blue-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-7 px-6 font-bold min-h-[72px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-blue-400/60' : 'border-transparent hover:border-blue-400'} ${liquidGlass ? 'shadow-lg hover:shadow-2xl hover:shadow-blue-500/50' : 'shadow-xl hover:shadow-blue-500/50'} transition-all duration-700`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Easy</div>
                <div className="relative text-base opacity-75 tracking-tight mt-2">7 days</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-slate-900/95 backdrop-blur border border-slate-600' : 'bg-slate-800/95 backdrop-blur border border-slate-700'} rounded-3xl p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className="text-base text-slate-200 tracking-tight">Instant recall, confident. Card will be reviewed in 7 days.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Image Lightbox */}
      {imageEnlarged && currentCard?.imageUrl && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-6"
          onClick={() => setImageEnlarged(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setImageEnlarged(false)}
              className={`absolute -top-4 -right-4 ${liquidGlass ? 'bg-red-500/90 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'} text-white p-5 rounded-2xl transition-all duration-700 z-10 shadow-2xl hover:shadow-red-500/50 hover:scale-110`}
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10' : 'bg-white'} p-8 ${liquidGlass ? 'rounded-[40px]' : 'rounded-3xl'} shadow-2xl overflow-hidden`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}
              <img
                src={currentCard.imageUrl}
                alt="Enlarged flashcard visual"
                className={`relative max-w-full max-h-[85vh] object-contain ${liquidGlass ? 'rounded-[32px]' : 'rounded-2xl'}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
