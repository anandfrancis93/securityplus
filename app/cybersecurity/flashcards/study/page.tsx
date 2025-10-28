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
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative text-center">
          <div className={`animate-spin rounded-full h-16 w-16 border-4 ${liquidGlass ? 'border-white/10 border-t-white/40' : 'border-transparent border-b-2 border-b-violet-500'} mx-auto`}></div>
          <p className="mt-4 text-slate-300 text-base tracking-wide">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (dueCardIds.length === 0 || !currentCard) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">All Done!</h2>
          <p className="text-slate-300 mb-8 text-base tracking-wide">No flashcards due right now.</p>
          <button
            onClick={() => router.push('/cybersecurity/flashcards')}
            className={`${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-3xl' : 'bg-violet-600 hover:bg-violet-700 rounded-full'} text-white px-8 py-4 font-medium text-base tracking-wide ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-300'} shadow-lg ${liquidGlass ? 'border border-white/20' : 'hover:shadow-violet-500/50'}`}
          >
            Back to Flashcards
          </button>
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
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/cybersecurity/flashcards')}
              className="text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-500 p-3 rounded-full"
              title="Back to Flashcards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <p className="text-slate-300 text-sm tracking-wide font-medium">
              Card {currentCardIndex + 1} of {dueCardIds.length}
            </p>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-500 p-3 rounded-full"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
          <div className={`w-full ${liquidGlass ? 'bg-white/5 rounded-3xl' : 'bg-slate-800 rounded-full'} h-2 overflow-hidden border ${liquidGlass ? 'border-white/10' : 'border-transparent'}`}>
            <div
              className={`bg-violet-500 h-2 ${liquidGlass ? 'rounded-3xl' : 'rounded-full'} transition-all duration-500 shadow-lg shadow-violet-500/50`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-8" style={{ perspective: '1000px' }}>
          <div
            id="flip-card"
            className={`relative ${liquidGlass ? 'bg-white/5' : 'bg-slate-800/95'} backdrop-blur-2xl ${liquidGlass ? 'rounded-3xl' : 'rounded-[28px]'} p-6 sm:p-10 border-2 cursor-pointer transition-all duration-500 ease-in-out shadow-2xl ${
              isFlipped
                ? liquidGlass
                  ? 'bg-white/10 border-white/30 shadow-violet-500/30'
                  : 'bg-violet-900/20 border-violet-500/40 shadow-violet-500/20'
                : liquidGlass
                  ? 'border-white/10 shadow-black/50'
                  : 'border-slate-700 shadow-slate-900/50'
            }`}
            style={{
              minHeight: '400px',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onClick={handleFlip}
          >
            <div
              className="flex items-center justify-center min-h-[350px] px-2 sm:px-0"
              style={{
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                backfaceVisibility: 'hidden',
              }}
            >
              {!isFlipped ? (
                <div className="text-center w-full">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 px-2 tracking-tight leading-tight">{currentCard.term}</h2>
                  <p className="text-slate-400 text-sm mt-8 tracking-wide">Click to reveal definition</p>
                </div>
              ) : (
                <div className="text-left w-full">
                  <p className="text-lg sm:text-xl leading-relaxed mb-6 whitespace-pre-wrap px-2 text-slate-200 tracking-wide">{currentCard.definition}</p>
                  {currentCard.imageUrl && (
                    <div className="mt-6">
                      <img
                        src={currentCard.imageUrl}
                        alt="Flashcard visual"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageEnlarged(true);
                        }}
                        className="max-w-full max-h-64 mx-auto rounded-3xl border-2 border-slate-600 cursor-pointer hover:border-violet-500 transition-all duration-500 shadow-lg hover:shadow-violet-500/50"
                        title="Click to enlarge"
                      />
                      <p className="text-xs text-slate-400 mt-2 text-center tracking-wide">Click image to enlarge</p>
                    </div>
                  )}
                  {currentCard.context && (
                    <div className="mt-6 pt-6 border-t border-slate-700">
                      <p className="text-sm text-slate-300 italic whitespace-pre-wrap tracking-wide">{currentCard.context}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isFlipped && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-2 text-slate-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="text-sm tracking-wide font-medium">Flip</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Answer Buttons - Show when flipped */}
        {isFlipped && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Again Button */}
            <div className="relative group">
              <button
                id="again"
                onClick={() => handleAnswer('again')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-red-600 rounded-full'} ${liquidGlass ? 'hover:bg-white/10' : 'hover:bg-red-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-5 px-4 font-medium min-h-[56px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-red-400/50' : 'border-transparent hover:border-red-400'} active:translate-y-0 shadow-lg ${liquidGlass ? 'hover:shadow-2xl hover:shadow-red-500/30' : 'hover:shadow-red-500/50'} ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-500'}`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
                )}
                <div className="relative text-lg font-bold tracking-wide">Again</div>
                <div className="relative text-xs opacity-75 tracking-wide">1 day</div>
              </button>
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900/95 backdrop-blur border border-slate-600 rounded-3xl p-3 shadow-xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-200 tracking-wide">Couldn&apos;t remember or got it wrong. Card will be reviewed in 1 day.</p>
              </div>
            </div>

            {/* Hard Button */}
            <div className="relative group">
              <button
                id="hard"
                onClick={() => handleAnswer('hard')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-yellow-600 rounded-full'} ${liquidGlass ? 'hover:bg-white/10' : 'hover:bg-yellow-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-5 px-4 font-medium min-h-[56px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-yellow-400/50' : 'border-transparent hover:border-yellow-400'} active:translate-y-0 shadow-lg ${liquidGlass ? 'hover:shadow-2xl hover:shadow-yellow-500/30' : 'hover:shadow-yellow-500/50'} ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-500'}`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
                )}
                <div className="relative text-lg font-bold tracking-wide">Hard</div>
                <div className="relative text-xs opacity-75 tracking-wide">1 day</div>
              </button>
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900/95 backdrop-blur border border-slate-600 rounded-3xl p-3 shadow-xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-200 tracking-wide">Difficult to recall, needed time. Card will be reviewed in 1 day.</p>
              </div>
            </div>

            {/* Good Button */}
            <div className="relative group">
              <button
                id="good"
                onClick={() => handleAnswer('good')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-green-600 rounded-full'} ${liquidGlass ? 'hover:bg-white/10' : 'hover:bg-green-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-5 px-4 font-medium min-h-[56px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-green-400/50' : 'border-transparent hover:border-green-400'} active:translate-y-0 shadow-lg ${liquidGlass ? 'hover:shadow-2xl hover:shadow-green-500/30' : 'hover:shadow-green-500/50'} ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-500'}`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
                )}
                <div className="relative text-lg font-bold tracking-wide">Good</div>
                <div className="relative text-xs opacity-75 tracking-wide">3 days</div>
              </button>
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900/95 backdrop-blur border border-slate-600 rounded-3xl p-3 shadow-xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-200 tracking-wide">Recalled with some effort. Card will be reviewed in 3 days.</p>
              </div>
            </div>

            {/* Easy Button */}
            <div className="relative group">
              <button
                id="easy"
                onClick={() => handleAnswer('easy')}
                disabled={answering}
                className={`relative w-full ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-blue-600 rounded-full'} ${liquidGlass ? 'hover:bg-white/10' : 'hover:bg-blue-700'} active:bg-white/10 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-5 px-4 font-medium min-h-[56px] touch-manipulation border-2 ${liquidGlass ? 'border-white/10 hover:border-blue-400/50' : 'border-transparent hover:border-blue-400'} active:translate-y-0 shadow-lg ${liquidGlass ? 'hover:shadow-2xl hover:shadow-blue-500/30' : 'hover:shadow-blue-500/50'} ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-500'}`}
              >
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
                )}
                <div className="relative text-lg font-bold tracking-wide">Easy</div>
                <div className="relative text-xs opacity-75 tracking-wide">7 days</div>
              </button>
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900/95 backdrop-blur border border-slate-600 rounded-3xl p-3 shadow-xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                <p className="text-sm text-slate-200 tracking-wide">Instant recall, confident. Card will be reviewed in 7 days.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Image Lightbox */}
      {imageEnlarged && currentCard?.imageUrl && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setImageEnlarged(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setImageEnlarged(false)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 hover:bg-white/5 active:bg-white/10 text-white p-4 rounded-full transition-all duration-500 z-10 shadow-lg hover:shadow-red-500/50"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white p-6 rounded-3xl shadow-2xl">
              <img
                src={currentCard.imageUrl}
                alt="Enlarged flashcard visual"
                className="max-w-full max-h-[85vh] object-contain"
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
