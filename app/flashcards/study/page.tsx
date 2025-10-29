'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import {
  getUserFlashcards,
  getUserReviews,
  getFlashcard,
  saveFlashcardReview,
} from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';

export default function StudyFlashcards() {
  const { userId, user, loading: authLoading } = useApp();
  const router = useRouter();
  const [dueCardIds, setDueCardIds] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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
        throw new Error('Failed to calculate review');
      }

      const newReview = await response.json();

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
        router.push('/flashcards?completed=true');
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
            onClick={() => router.push('/flashcards')}
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
            <button
              onClick={() => router.push('/flashcards')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-all text-sm"
            >
              Exit
            </button>
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
        <div className="mb-8">
          <div
            className={`relative bg-gray-800 rounded-xl p-8 border-2 border-gray-700 min-h-[400px] cursor-pointer transition-all duration-300 ${
              isFlipped ? 'bg-blue-900/20 border-blue-500/30' : ''
            }`}
            onClick={handleFlip}
          >
            <div className="absolute top-4 right-4">
              <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                {isFlipped ? 'Definition' : 'Term'}
              </div>
            </div>

            <div className="flex items-center justify-center min-h-[350px]">
              {!isFlipped ? (
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">{currentCard.term}</h2>
                  <p className="text-gray-400 text-sm mt-8">Click to reveal definition</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xl leading-relaxed mb-6 whitespace-pre-wrap">{currentCard.definition}</p>
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

        {/* Answer Buttons */}
        {isFlipped && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleAnswer('again')}
              disabled={answering}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-medium transition-all"
              title="Couldn't remember or got it wrong"
            >
              <div className="text-lg font-bold">Again</div>
            </button>
            <button
              onClick={() => handleAnswer('hard')}
              disabled={answering}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-medium transition-all"
              title="Difficult to recall, needed time"
            >
              <div className="text-lg font-bold">Hard</div>
            </button>
            <button
              onClick={() => handleAnswer('good')}
              disabled={answering}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-medium transition-all"
              title="Recalled with some effort"
            >
              <div className="text-lg font-bold">Good</div>
            </button>
            <button
              onClick={() => handleAnswer('easy')}
              disabled={answering}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-medium transition-all"
              title="Instant recall, confident"
            >
              <div className="text-lg font-bold">Easy</div>
            </button>
          </div>
        )}

        {/* Source Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          From: {currentCard.sourceFile}
        </div>
      </div>
    </div>
  );
}
