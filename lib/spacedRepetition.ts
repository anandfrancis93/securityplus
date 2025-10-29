/**
 * Spaced Repetition Algorithm (FSRS)
 *
 * This implements the FSRS (Free Spaced Repetition Scheduler) algorithm for optimal flashcard review scheduling.
 * FSRS is a modern, more accurate alternative to SM-2 based on memory research and data-driven optimization.
 */

import { FSRS, Card, Rating, State, fsrs } from 'fsrs';
import { FlashcardReview } from './types';

/**
 * Initialize FSRS scheduler
 */
const scheduler = fsrs();

/**
 * Map user difficulty rating to FSRS Rating
 */
function difficultyToRating(difficulty: 'again' | 'hard' | 'good' | 'easy'): Rating {
  const ratingMap = {
    'again': Rating.Again, // 1 - Failed to recall
    'hard': Rating.Hard,   // 2 - Recalled with difficulty
    'good': Rating.Good,   // 3 - Recalled with some effort
    'easy': Rating.Easy,   // 4 - Recalled easily
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
