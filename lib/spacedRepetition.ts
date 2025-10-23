/**
 * Spaced Repetition Algorithm (SM-2)
 *
 * This implements the SuperMemo 2 algorithm for optimal flashcard review scheduling.
 * The algorithm calculates when to show a flashcard next based on user performance.
 */

import { FlashcardReview } from './types';

/**
 * Calculate next review date using SM-2 algorithm
 *
 * @param previousReview - Previous review data (null for first review)
 * @param difficulty - User rating: 'again' (0), 'hard' (1), 'good' (2), 'easy' (3)
 * @returns Updated review data with next review date
 */
export function calculateNextReview(
  previousReview: FlashcardReview | null,
  difficulty: 'again' | 'hard' | 'good' | 'easy',
  flashcardId: string,
  userId: string
): FlashcardReview {
  const now = Date.now();

  // Map difficulty to quality score (0-5 scale in SM-2)
  const qualityMap = {
    'again': 0,  // Complete blackout
    'hard': 3,   // Correct but difficult
    'good': 4,   // Correct with hesitation
    'easy': 5,   // Perfect recall
  };

  const quality = qualityMap[difficulty];

  // Initialize for first review
  if (!previousReview) {
    const interval = quality < 3 ? 0 : quality === 3 ? 1 : quality === 4 ? 3 : 7;
    return {
      flashcardId,
      userId,
      reviewedAt: now,
      difficulty,
      nextReviewDate: now + (interval * 24 * 60 * 60 * 1000), // Convert days to ms
      interval,
      easeFactor: 2.5,
      repetitions: quality >= 3 ? 1 : 0,
    };
  }

  // SM-2 Algorithm
  let { easeFactor, repetitions, interval } = previousReview;

  // Update ease factor
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // Reset or increment repetitions
  if (quality < 3) {
    repetitions = 0;
    interval = 1; // Review again tomorrow
  } else {
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Apply difficulty modifiers
  if (difficulty === 'hard' && quality >= 3) {
    interval = Math.max(1, Math.round(interval * 0.8)); // Reduce interval by 20%
  } else if (difficulty === 'easy') {
    interval = Math.round(interval * 1.3); // Increase interval by 30%
  }

  const nextReviewDate = now + (interval * 24 * 60 * 60 * 1000);

  return {
    flashcardId,
    userId,
    reviewedAt: now,
    difficulty,
    nextReviewDate,
    interval,
    easeFactor,
    repetitions,
  };
}

/**
 * Get flashcards due for review
 *
 * @param reviews - Array of all flashcard reviews
 * @param allFlashcardIds - All available flashcard IDs
 * @returns Array of flashcard IDs due for review (including new cards)
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

  // Return new cards first, then due cards
  return [...newCards, ...dueCards];
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
