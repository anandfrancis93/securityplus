/**
 * Spaced Repetition Utilities for Flashcards
 *
 * This module provides utility functions for flashcard spaced repetition.
 * FSRS calculation logic is in a separate server-side module to avoid
 * client-side bundling issues.
 */

import { FlashcardReview } from './types';

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get flashcards due for review (randomized/interleaved)
 *
 * @param reviews - Array of all flashcard reviews
 * @param allFlashcardIds - All available flashcard IDs
 * @returns Array of flashcard IDs due for review (including new cards), randomized for better learning
 */
export function getDueFlashcards(
  reviews: FlashcardReview[],
  allFlashcardIds: string[]
): string[] {
  const now = Date.now();
  const reviewedIds = new Set(reviews.map(r => r.flashcardId));

  // New cards (never reviewed)
  const newCards = allFlashcardIds.filter(id => !reviewedIds.has(id));

  // Due cards (reviewed but due for review)
  const dueCards = reviews
    .filter(review => review.nextReviewDate <= now)
    .map(review => review.flashcardId);

  // Combine and shuffle for interleaved/randomized presentation
  // This improves learning while maintaining spaced repetition integrity
  const allDueCards = [...newCards, ...dueCards];
  return shuffleArray(allDueCards);
}

/**
 * Get only reviewed flashcards that are due (excludes new/never-reviewed cards)
 * This is useful for notifications - only notify about cards that need re-review
 *
 * @param reviews - Array of all flashcard reviews
 * @returns Array of flashcard IDs that have been reviewed and are now due
 */
export function getReviewedDueFlashcards(
  reviews: FlashcardReview[]
): string[] {
  const now = Date.now();

  // Only return cards that have been reviewed and are due
  return reviews
    .filter(review => review.nextReviewDate <= now)
    .map(review => review.flashcardId);
}

/**
 * Get statistics about flashcard deck
 */
export function getDeckStats(
  reviews: FlashcardReview[],
  allFlashcardIds: string[]
): {
  total: number;
  new: number;
  learning: number;
  review: number;
  mastered: number;
} {
  const now = Date.now();
  const reviewedIds = new Set(reviews.map(r => r.flashcardId));

  const newCount = allFlashcardIds.filter(id => !reviewedIds.has(id)).length;

  let learning = 0;
  let review = 0;
  let mastered = 0;

  for (const r of reviews) {
    if (r.repetitions === 0) {
      learning++;
    } else if (r.repetitions < 3) {
      review++;
    } else {
      mastered++;
    }
  }

  return {
    total: allFlashcardIds.length,
    new: newCount,
    learning,
    review,
    mastered,
  };
}
