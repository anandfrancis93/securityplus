'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  getUserFlashcards,
  getUserReviews,
  getFlashcard,
  saveFlashcardReview,
} from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';

export default function StudyFlashcards() {
  const { userId, user, loading: authLoading, liquidGlass } = useApp();
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

      // Calculate next review via API
      console.log('[Client] Requesting review calculation:', {
        flashcardId: currentCard.id,
        userId,
        difficulty,
        hasPreviousReview: !!previousReview
      });

      const response = await fetch('/api/flashcard-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousReview,
          difficulty,
          flashcardId: currentCard.id,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Client] API error:', errorData);
        throw new Error(`Failed to calculate review: ${errorData.details || errorData.error}`);
      }

      const newReview = await response.json();
      console.log('[Client] Received new review:', newReview);

      // Save review
      console.log('[Client] Saving review to Firebase...');
      await saveFlashcardReview(newReview);
      console.log('[Client] Review saved successfully');

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
        <div className="relative">
          {/* Liquid glass card */}
          <div className={`${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl'} p-16 md:p-20 shadow-2xl`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
            )}
            <div className="relative text-center">
              {/* Animated icon */}
              <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-8">
                {/* Outer ring */}
                <div className={`absolute inset-0 ${liquidGlass ? 'border-4 border-white/20 rounded-full' : 'border-4 border-slate-700 rounded-full'}`}></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 animate-spin">
                  <div className={`w-full h-full rounded-full ${liquidGlass ? 'border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50' : 'border-4 border-transparent border-t-cyan-500 border-r-cyan-500/50'}`}></div>
                </div>
                {/* Center icon - graduation cap */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className={`w-16 h-16 md:w-20 md:h-20 ${liquidGlass ? 'text-cyan-400' : 'text-cyan-500'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p className={`text-2xl md:text-3xl font-bold tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>
                Loading flashcards...
              </p>
              <p className={`text-base md:text-lg mt-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                Please wait
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dueCardIds.length === 0 || !currentCard) {
    return (
      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
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

        <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-5xl flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="text-7xl md:text-8xl mb-8">✅</div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                All Done!
              </span>
            </h1>
            <p className={`text-2xl md:text-3xl font-light leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No flashcards due right now.
            </p>
            <button
              onClick={() => router.push('/cybersecurity/flashcards')}
              className={`relative mt-8 ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-[40px]' : 'bg-violet-600 hover:bg-violet-700 rounded-3xl'} text-white px-12 py-6 font-medium text-xl tracking-tight transition-all duration-700 shadow-xl ${liquidGlass ? 'border border-white/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-105' : 'hover:shadow-violet-500/50'}`}
            >
              Back to Flashcards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentCardIndex + 1) / dueCardIds.length) * 100;

  return (
    <>
      {/* Global tooltip animation and scrollbar styling */}
      <style jsx global>{`
        @keyframes tooltipFade {
          0% { opacity: 0; }
          26.3% { opacity: 0; }
          30.3% { opacity: 1; }
          96.1% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Custom scrollbar for liquid glass design */
        .flashcard-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .flashcard-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .flashcard-scroll::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }

        .flashcard-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>

      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
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

        <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-5xl">
          {/* Hero Section - Apple Style */}
          <section className="text-center mb-8 md:mb-12">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
                <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                  Study
                </span>
              </h1>
              <div className="flex items-center justify-center gap-4">
                <p className={`text-2xl md:text-3xl font-light tracking-tight ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Card {currentCardIndex + 1} <span className={liquidGlass ? 'text-zinc-600' : 'text-zinc-700'}>of</span> {dueCardIds.length}
                </p>
              </div>
            </div>
          </section>

          {/* Progress Bar */}
          <div className="mb-12 md:mb-16">
            <div className="relative max-w-3xl mx-auto">
              <div className={`w-full h-3 relative overflow-hidden ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-full' : 'bg-slate-800 border border-transparent rounded-full'}`}>
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-full" />
                )}
                <div
                  className={`h-3 relative transition-all duration-700 ${liquidGlass ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 rounded-full' : 'bg-violet-500 rounded-full'} ${liquidGlass ? 'shadow-2xl shadow-violet-500/50' : 'shadow-lg shadow-violet-500/30'}`}
                  style={{ width: `${progress}%` }}
                >
                  {liquidGlass && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full" />
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
              className={`absolute inset-0 ${liquidGlass ? 'bg-white/5' : 'bg-slate-800/95'} backdrop-blur-2xl ${liquidGlass ? 'rounded-[40px]' : 'rounded-[28px]'} border-2 ${liquidGlass ? 'border-white/10' : 'border-slate-700'} shadow-2xl ${liquidGlass ? 'shadow-black/50' : 'shadow-slate-900/50'} overflow-hidden`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              {/* Scrollable Content Container */}
              <div className="flashcard-scroll relative h-full overflow-y-auto overflow-x-hidden p-10 sm:p-12 md:p-16 flex items-center justify-center">
                <div className="text-center w-full space-y-6 my-auto">
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
              className={`absolute inset-0 ${liquidGlass ? 'bg-white/10' : 'bg-violet-900/20'} backdrop-blur-2xl ${liquidGlass ? 'rounded-[40px]' : 'rounded-[28px]'} border-2 ${liquidGlass ? 'border-white/30' : 'border-violet-500/40'} shadow-2xl ${liquidGlass ? 'shadow-violet-500/30' : 'shadow-violet-500/20'} overflow-hidden`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Gradient Overlay */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent rounded-[40px] opacity-80 pointer-events-none" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
              )}

              {/* Scrollable Content Container */}
              <div className="flashcard-scroll relative h-full overflow-y-auto overflow-x-hidden p-10 sm:p-12 md:p-16 flex items-start">
                <div className="text-left w-full space-y-6 my-auto">
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
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/50 via-transparent to-transparent rounded-[32px] group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Again</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur border border-slate-700 rounded-3xl'} p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-base tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>Failed to recall. Goes to Learning with a 1-day interval.</p>
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
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/50 via-transparent to-transparent rounded-[32px] group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Hard</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur border border-slate-700 rounded-3xl'} p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-base tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>Difficult but recalled. Goes to Review with a 2-day interval.</p>
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
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/50 via-transparent to-transparent rounded-[32px] group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Good</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur border border-slate-700 rounded-3xl'} p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-base tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>Recalled correctly. Goes to Review with a 3-day interval.</p>
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
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-transparent to-transparent rounded-[32px] group-hover:opacity-100 transition-opacity duration-700" />
                )}
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                )}
                <div className="relative text-2xl font-bold tracking-tight">Easy</div>
              </button>
              {/* Hover tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 ${liquidGlass ? 'bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px]' : 'bg-slate-800/95 backdrop-blur border border-slate-700 rounded-3xl'} p-4 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]`}>
                <p className={`text-base tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>Instant recall. Goes to Review with an 8-day interval.</p>
              </div>
            </div>
          </div>
        )}
        </div>
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
    </>
  );
}
