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
import { getDueFlashcards, calculateNextReview, getDeckStats } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';

export default function StudyPage() {
  const { userId, user, handleSignOut } = useApp();
  const router = useRouter();
  const [dueCardIds, setDueCardIds] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [imageEnlarged, setImageEnlarged] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ total: 0, new: 0, learning: 0, review: 0, mastered: 0 });
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

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

      // Calculate deck stats
      const deckStats = getDeckStats(reviews, allCards.map((c) => c.id));
      setStats(deckStats);

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
    setOpenTooltip(null); // Close any open tooltips when flipping
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
        setOpenTooltip(null); // Close any open tooltips when moving to next card
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (dueCardIds.length === 0 || !currentCard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-4">All Done!</h2>
          <p className="text-gray-400 mb-8">No flashcards due right now.</p>
          <button
            onClick={() => router.push('/cybersecurity/flashcards')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Flashcards
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentCardIndex + 1) / dueCardIds.length) * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Study Session</h1>
              <p className="text-gray-400 text-sm">
                Card {currentCardIndex + 1} of {dueCardIds.length}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/cybersecurity/flashcards')}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-all text-sm"
              >
                Exit
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  title="Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {menuOpen && user && !user?.isAnonymous && (
                  <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <span>👤</span>
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
                      className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-8" style={{ perspective: '1000px' }}>
          <div
            className={`relative bg-gray-800 rounded-xl p-4 sm:p-8 border-2 border-gray-700 cursor-pointer transition-all duration-500 ease-in-out ${
              isFlipped ? 'bg-blue-900/20 border-blue-500/30' : ''
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
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 px-2">{currentCard.term}</h2>
                  <p className="text-gray-400 text-sm mt-8">Click to reveal definition</p>
                </div>
              ) : (
                <div className="text-left w-full">
                  <p className="text-lg sm:text-xl leading-relaxed mb-6 whitespace-pre-wrap px-2">{currentCard.definition}</p>
                  {currentCard.imageUrl && (
                    <div className="mt-6">
                      <img
                        src={currentCard.imageUrl}
                        alt="Flashcard visual"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageEnlarged(true);
                        }}
                        className="max-w-full max-h-64 mx-auto rounded-lg border border-gray-600 cursor-pointer hover:border-blue-500 transition-all"
                        title="Click to enlarge"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">Click image to enlarge</p>
                    </div>
                  )}
                  {currentCard.context && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <p className="text-sm text-gray-400 italic whitespace-pre-wrap">{currentCard.context}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isFlipped && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-2 text-gray-500">
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
                  <span className="text-sm">Flip</span>
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
                onClick={() => handleAnswer('again')}
                disabled={answering}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-5 px-4 rounded-lg font-medium min-h-[56px] touch-manipulation hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/50 active:translate-y-0"
                style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="text-lg font-bold">Again</div>
                <div className="text-xs opacity-75">1 day</div>
              </button>
              {/* Hover tooltip */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
                <p className="text-sm text-gray-300">Couldn&apos;t remember or got it wrong. Card will be reviewed in 1 day.</p>
              </div>
            </div>

            {/* Hard Button */}
            <div className="relative group">
              <button
                onClick={() => handleAnswer('hard')}
                disabled={answering}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-5 px-4 rounded-lg font-medium min-h-[56px] touch-manipulation hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/50 active:translate-y-0"
                style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="text-lg font-bold">Hard</div>
                <div className="text-xs opacity-75">1 day</div>
              </button>
              {/* Hover tooltip */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
                <p className="text-sm text-gray-300">Difficult to recall, needed time. Card will be reviewed in 1 day.</p>
              </div>
            </div>

            {/* Good Button */}
            <div className="relative group">
              <button
                onClick={() => handleAnswer('good')}
                disabled={answering}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-5 px-4 rounded-lg font-medium min-h-[56px] touch-manipulation hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/50 active:translate-y-0"
                style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="text-lg font-bold">Good</div>
                <div className="text-xs opacity-75">3 days</div>
              </button>
              {/* Hover tooltip */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
                <p className="text-sm text-gray-300">Recalled with some effort. Card will be reviewed in 3 days.</p>
              </div>
            </div>

            {/* Easy Button */}
            <div className="relative group">
              <button
                onClick={() => handleAnswer('easy')}
                disabled={answering}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-5 px-4 rounded-lg font-medium min-h-[56px] touch-manipulation hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/50 active:translate-y-0"
                style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="text-lg font-bold">Easy</div>
                <div className="text-xs opacity-75">7 days</div>
              </button>
              {/* Hover tooltip */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
                <p className="text-sm text-gray-300">Instant recall, confident. Card will be reviewed in 7 days.</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats - Always Visible at Bottom */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {/* Total */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 relative group cursor-help">
            <div className="text-gray-400 text-xs mb-1">Total</div>
            <div className="text-xl font-bold text-blue-400">{stats.total}</div>
            {/* Hover tooltip */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
              <p className="text-sm text-gray-300">The total number of flashcards in your deck.</p>
            </div>
          </div>

          {/* Learning */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 relative group cursor-help">
            <div className="text-gray-400 text-xs mb-1">Learning</div>
            <div className="text-xl font-bold text-yellow-400">{stats.learning}</div>
            {/* Hover tooltip */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
              <p className="text-sm text-gray-300">Cards you&apos;ve attempted but got wrong or rated as &quot;Again&quot;. These cards have 0 successful repetitions and need daily practice.</p>
            </div>
          </div>

          {/* Review */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 relative group cursor-help">
            <div className="text-gray-400 text-xs mb-1">Review</div>
            <div className="text-xl font-bold text-yellow-400">{stats.review}</div>
            {/* Hover tooltip */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
              <p className="text-sm text-gray-300">Cards you&apos;re actively learning and have reviewed correctly 1-2 times. These cards are in progress but not yet mastered.</p>
            </div>
          </div>

          {/* Mastered */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 relative group cursor-help">
            <div className="text-gray-400 text-xs mb-1">Mastered</div>
            <div className="text-xl font-bold text-blue-400">{stats.mastered}</div>
            {/* Hover tooltip */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none" style={{ transition: 'opacity 0.3s ease-in-out 2s' }}>
              <p className="text-sm text-gray-300">Cards you&apos;ve successfully reviewed 3 or more times. These cards are well-learned and appear less frequently to maintain long-term retention.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Image Lightbox */}
      {imageEnlarged && currentCard?.imageUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setImageEnlarged(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setImageEnlarged(false)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-all z-10"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white p-4 rounded-lg">
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
  );
}
