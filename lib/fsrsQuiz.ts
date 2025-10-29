/**
 * FSRS (Free Spaced Repetition Scheduler) integration for quiz questions
 *
 * This module adapts the FSRS algorithm for quiz-based learning:
 * - Questions and topics use FSRS for optimal review scheduling
 * - Converts quiz performance to FSRS ratings
 * - Manages review intervals at the quiz level (not days)
 */

import { fsrs, FSRS, Card, Rating, State, RecordLog, DateInput, generatorParameters, createEmptyCard, FSRSParameters, Grade } from 'ts-fsrs';
import { QuestionHistory, TopicPerformance, QuizGenerationMetadata } from './types';

/**
 * Initialize FSRS scheduler with default or custom parameters
 */
export function createFSRSScheduler(parameters?: number[]) {
  if (parameters && parameters.length > 0) {
    // Use user-specific optimized parameters
    const params: FSRSParameters = generatorParameters({ w: parameters });
    return fsrs(params);
  }
  // Use default FSRS parameters
  return fsrs();
}

/**
 * Convert quiz performance to FSRS rating
 *
 * FSRS Ratings:
 * 1 = Again (failed, forgot)
 * 2 = Hard (correct but struggled)
 * 3 = Good (correct, normal recall)
 * 4 = Easy (correct, instant recall)
 *
 * For quizzes we simplify:
 * - Wrong answer = Again (1)
 * - Correct answer = Good (3) by default
 * - We can enhance later with timing or difficulty
 */
export function quizPerformanceToRating(
  isCorrect: boolean,
  difficulty?: 'easy' | 'medium' | 'hard'
): Rating {
  if (!isCorrect) {
    return Rating.Again; // 1 = Wrong answer
  }

  // Correct answer - could be enhanced with response time
  // For now, treat all correct answers as "Good"
  return Rating.Good; // 3 = Correct answer
}

/**
 * Create a new FSRS card for a question or topic
 */
export function createNewCard(): Card {
  return createEmptyCard();
}

/**
 * Convert QuestionHistory to FSRS Card
 */
export function questionHistoryToCard(history: QuestionHistory): Card {
  if (!history.stability) {
    // No FSRS data yet, create new card
    return createNewCard();
  }

  const card = createEmptyCard(new Date(history.lastAskedDate));
  return {
    ...card,
    due: history.nextReviewDate ? new Date(history.nextReviewDate) : new Date(),
    stability: history.stability,
    difficulty: history.difficulty || 0,
    elapsed_days: history.elapsedDays || 0,
    scheduled_days: history.scheduledDays || 0,
    reps: history.reps || 0,
    lapses: history.lapses || 0,
    state: (history.state as State) || State.New,
    last_review: new Date(history.lastAskedDate),
  };
}

/**
 * Convert TopicPerformance to FSRS Card
 */
export function topicPerformanceToCard(topic: TopicPerformance): Card {
  if (!topic.stability) {
    // No FSRS data yet, create new card
    return createNewCard();
  }

  const card = createEmptyCard(new Date(topic.lastReviewDate || topic.lastTested));
  return {
    ...card,
    due: topic.nextReviewQuiz ? new Date() : new Date(), // We use quiz numbers, not dates
    stability: topic.stability,
    difficulty: topic.difficulty || 0,
    elapsed_days: 0, // Will be calculated based on quiz difference
    scheduled_days: topic.scheduledDays || 0,
    reps: topic.reps || 0,
    lapses: topic.lapses || 0,
    state: (topic.state as State) || State.New,
    last_review: new Date(topic.lastReviewDate || topic.lastTested),
  };
}

/**
 * Update QuestionHistory with FSRS results
 */
export function updateQuestionHistoryWithFSRS(
  history: QuestionHistory,
  card: Card,
  rating: Rating,
  currentQuizNumber: number,
  nextReviewQuizOffset: number
): QuestionHistory {
  return {
    ...history,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastRating: rating,
    nextReviewDate: card.due.getTime(),
    nextReviewQuiz: currentQuizNumber + nextReviewQuizOffset,
    lastAskedDate: Date.now(),
    lastAskedQuiz: currentQuizNumber,
  };
}

/**
 * Update TopicPerformance with FSRS results
 */
export function updateTopicPerformanceWithFSRS(
  topic: TopicPerformance,
  card: Card,
  rating: Rating,
  currentQuizNumber: number,
  nextReviewQuizOffset: number
): TopicPerformance {
  return {
    ...topic,
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    nextReviewQuiz: currentQuizNumber + nextReviewQuizOffset,
    lastReviewQuiz: currentQuizNumber,
    lastReviewDate: Date.now(),
  };
}

/**
 * Calculate quiz offset from FSRS scheduled days
 *
 * FSRS works in days, but we schedule in quizzes.
 * Assume average user takes 1 quiz every 2 days.
 *
 * This can be customized per user based on their quiz frequency.
 */
export function scheduledDaysToQuizOffset(
  scheduledDays: number,
  avgQuizzesPerWeek: number = 3.5 // Default: 1 quiz every 2 days
): number {
  // Convert days to quiz offset
  const avgDaysPerQuiz = 7 / avgQuizzesPerWeek;
  const quizOffset = Math.max(1, Math.round(scheduledDays / avgDaysPerQuiz));

  return quizOffset;
}

/**
 * Calculate elapsed quizzes as elapsed days for FSRS
 */
export function quizOffsetToElapsedDays(
  quizOffset: number,
  avgQuizzesPerWeek: number = 3.5
): number {
  const avgDaysPerQuiz = 7 / avgQuizzesPerWeek;
  return quizOffset * avgDaysPerQuiz;
}

/**
 * Process a question review with FSRS
 * Returns updated card and next review quiz number
 */
export function processQuestionReview(
  scheduler: FSRS,
  history: QuestionHistory,
  isCorrect: boolean,
  currentQuizNumber: number,
  currentDate: Date = new Date()
): {
  updatedHistory: QuestionHistory;
  nextReviewQuiz: number;
  card: Card;
} {
  // Convert history to FSRS card
  const card = questionHistoryToCard(history);

  // Get rating from quiz performance
  const rating = quizPerformanceToRating(isCorrect);

  // Calculate elapsed time since last review
  const elapsedDays = quizOffsetToElapsedDays(
    currentQuizNumber - history.lastAskedQuiz
  );

  // Schedule next review using FSRS
  const schedulingInfo = scheduler.repeat(card, currentDate);

  // Get the card for this rating
  const updatedCard = schedulingInfo[rating as Grade].card;

  // Convert scheduled days to quiz offset
  const nextReviewQuizOffset = scheduledDaysToQuizOffset(updatedCard.scheduled_days);

  // Update history with FSRS data
  const updatedHistory = updateQuestionHistoryWithFSRS(
    history,
    updatedCard,
    rating,
    currentQuizNumber,
    nextReviewQuizOffset
  );

  return {
    updatedHistory,
    nextReviewQuiz: currentQuizNumber + nextReviewQuizOffset,
    card: updatedCard,
  };
}

/**
 * Process a topic review with FSRS
 */
export function processTopicReview(
  scheduler: FSRS,
  topic: TopicPerformance,
  isCorrect: boolean,
  currentQuizNumber: number,
  currentDate: Date = new Date()
): {
  updatedTopic: TopicPerformance;
  nextReviewQuiz: number;
  card: Card;
} {
  // Convert topic to FSRS card
  const card = topicPerformanceToCard(topic);

  // Get rating from quiz performance
  const rating = quizPerformanceToRating(isCorrect);

  // Schedule next review using FSRS
  const schedulingInfo = scheduler.repeat(card, currentDate);

  // Get the card for this rating
  const updatedCard = schedulingInfo[rating as Grade].card;

  // Convert scheduled days to quiz offset
  const nextReviewQuizOffset = scheduledDaysToQuizOffset(updatedCard.scheduled_days);

  // Update topic with FSRS data
  const updatedTopic = updateTopicPerformanceWithFSRS(
    topic,
    updatedCard,
    rating,
    currentQuizNumber,
    nextReviewQuizOffset
  );

  return {
    updatedTopic,
    nextReviewQuiz: currentQuizNumber + nextReviewQuizOffset,
    card: updatedCard,
  };
}

/**
 * Get questions due for review based on FSRS scheduling
 */
export function getQuestionsDueForReview(
  questionHistory: { [questionId: string]: QuestionHistory },
  currentQuizNumber: number
): QuestionHistory[] {
  return Object.values(questionHistory)
    .filter(history => {
      // Questions with FSRS data
      if (history.nextReviewQuiz) {
        return history.nextReviewQuiz <= currentQuizNumber;
      }
      // Questions without FSRS data (legacy) - use old cooldown logic
      const cooldown = currentQuizNumber - history.lastAskedQuiz;
      return cooldown >= 3;
    })
    .sort((a, b) => {
      // Prioritize by:
      // 1. Wrong answers (lapses > 0)
      // 2. Overdue (earlier nextReviewQuiz)
      // 3. Higher difficulty

      const aWrong = (a.lapses || 0) > 0;
      const bWrong = (b.lapses || 0) > 0;

      if (aWrong && !bWrong) return -1;
      if (!aWrong && bWrong) return 1;

      // Compare by how overdue
      const aNextReview = a.nextReviewQuiz || Infinity;
      const bNextReview = b.nextReviewQuiz || Infinity;

      if (aNextReview !== bNextReview) {
        return aNextReview - bNextReview;
      }

      // Higher difficulty = more priority
      return (b.difficulty || 0) - (a.difficulty || 0);
    });
}

/**
 * Get topics due for review based on FSRS scheduling
 */
export function getTopicsDueForReview(
  topicPerformance: { [topicName: string]: TopicPerformance },
  currentQuizNumber: number
): TopicPerformance[] {
  return Object.values(topicPerformance)
    .filter(topic => {
      if (topic.nextReviewQuiz) {
        return topic.nextReviewQuiz <= currentQuizNumber;
      }
      // New topics or topics without FSRS data
      return topic.questionsAnswered > 0;
    })
    .sort((a, b) => {
      // Prioritize by:
      // 1. Struggling topics (accuracy < 60%)
      // 2. Learning topics (accuracy 60-79%)
      // 3. Overdue topics
      // 4. Higher FSRS difficulty

      if (a.isStruggling && !b.isStruggling) return -1;
      if (!a.isStruggling && b.isStruggling) return 1;

      const aLearning = !a.isMastered && !a.isStruggling;
      const bLearning = !b.isMastered && !b.isStruggling;

      if (aLearning && !bLearning) return -1;
      if (!aLearning && bLearning) return 1;

      // Compare by how overdue
      const aNextReview = a.nextReviewQuiz || 0;
      const bNextReview = b.nextReviewQuiz || 0;

      if (aNextReview !== bNextReview) {
        return aNextReview - bNextReview;
      }

      // Higher difficulty = more priority
      return (b.difficulty || 0) - (a.difficulty || 0);
    });
}

/**
 * Initialize FSRS data for a new user or migrate existing user
 */
export function initializeFSRSMetadata(metadata: QuizGenerationMetadata): QuizGenerationMetadata {
  return {
    ...metadata,
    currentPhase: metadata.currentPhase || 1,
    fsrsParameters: metadata.fsrsParameters || Array.from(generatorParameters().w), // Use default FSRS params
    lastParameterUpdate: metadata.lastParameterUpdate || Date.now(),
  };
}
