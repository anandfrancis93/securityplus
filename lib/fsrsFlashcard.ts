/**
 * FSRS (Free Spaced Repetition Scheduler) for Flashcards
 *
 * This module implements FSRS algorithm for flashcard scheduling.
 * Server-side only to avoid bundling FSRS in client components.
 */

import { FSRS, Card, Rating, State, fsrs } from 'fsrs';
import { FlashcardReview } from './types';

/**
 * Create FSRS scheduler instance
 */
function createScheduler(): FSRS {
  return fsrs();
}

/**
 * Map user difficulty rating to FSRS Rating
 * FSRS Ratings: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
 */
function difficultyToRating(difficulty: 'again' | 'hard' | 'good' | 'easy'): Rating {
  const ratingMap: Record<string, Rating> = {
    'again': 1 as Rating, // 1 - Failed to recall
    'hard': 2 as Rating,   // 2 - Recalled with difficulty
    'good': 3 as Rating,   // 3 - Recalled with some effort
    'easy': 4 as Rating,   // 4 - Recalled easily
  };
  return ratingMap[difficulty];
}

/**
 * Convert FlashcardReview to FSRS Card
 */
function reviewToCard(review: FlashcardReview): Card {
  if (!review.stability) {
    // No FSRS data yet, create new card
    return {
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: State.New,
      last_review: new Date(),
    };
  }

  return {
    due: new Date(review.nextReviewDate),
    stability: review.stability || 0,
    difficulty: review.fsrsDifficulty || 0,
    elapsed_days: review.elapsedDays || 0,
    scheduled_days: review.scheduledDays || 0,
    reps: review.reps || 0,
    lapses: review.lapses || 0,
    state: (review.state as State) || State.New,
    last_review: new Date(review.reviewedAt),
  };
}

/**
 * Calculate next review date using FSRS algorithm
 *
 * @param previousReview - Previous review data (null for first review)
 * @param difficulty - User rating: 'again', 'hard', 'good', 'easy'
 * @returns Updated review data with next review date
 */
export function calculateNextReview(
  previousReview: FlashcardReview | null,
  difficulty: 'again' | 'hard' | 'good' | 'easy',
  flashcardId: string,
  userId: string
): FlashcardReview {
  const now = Date.now();
  const rating = difficultyToRating(difficulty);
  const scheduler = createScheduler();

  // Get current card state
  const currentCard: Card = previousReview
    ? reviewToCard(previousReview)
    : {
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: State.New,
        last_review: new Date(),
      };

  // Calculate next review using FSRS
  const schedulingInfo = scheduler.repeat(currentCard, new Date(now));
  const updatedCard = schedulingInfo[rating].card;

  // Convert FSRS card back to FlashcardReview
  return {
    flashcardId,
    userId,
    reviewedAt: now,
    difficulty,
    nextReviewDate: updatedCard.due.getTime(),
    interval: updatedCard.scheduled_days,
    easeFactor: 0, // Not used in FSRS, kept for backwards compatibility
    repetitions: updatedCard.reps,
    // FSRS-specific fields
    stability: updatedCard.stability,
    fsrsDifficulty: updatedCard.difficulty,
    elapsedDays: updatedCard.elapsed_days,
    scheduledDays: updatedCard.scheduled_days,
    reps: updatedCard.reps,
    lapses: updatedCard.lapses,
    state: updatedCard.state,
  };
}
