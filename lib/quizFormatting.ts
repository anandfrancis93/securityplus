/**
 * Quiz Formatting Utilities
 *
 * Shared formatting functions for quiz display to ensure consistency
 * across Quiz Review page and Past Quizzes cards.
 */

import { QuizSession } from './types';

export interface FormattedQuizSummary {
  formattedDate: string;
  formattedTime: string;
  timeDisplay: string;
  accuracy: string;
  accuracyColor: string; // Tailwind color class for accuracy display
  totalQuestions: number;
  isIncomplete: boolean;
}

/**
 * Format quiz summary data for display
 * Centralizes all date/time/accuracy formatting logic
 *
 * @param quiz - Quiz session to format
 * @returns Formatted summary data
 */
export function formatQuizSummary(quiz: QuizSession): FormattedQuizSummary {
  // Format date
  const date = new Date(quiz.startedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Format time
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Calculate time taken
  const timeTakenMs = (quiz.endedAt || quiz.startedAt) - quiz.startedAt;
  const timeTakenMinutes = Math.floor(timeTakenMs / 60000);
  const timeTakenSeconds = Math.floor((timeTakenMs % 60000) / 1000);
  const timeDisplay = timeTakenMinutes > 0
    ? `${timeTakenMinutes}m ${timeTakenSeconds}s`
    : `${timeTakenSeconds}s`;

  // Calculate accuracy based on points (accounts for partial credit)
  // Smart decimal formatting: hide .00 for whole numbers, show up to 2 decimals otherwise
  const accuracyValue = quiz.maxPoints > 0
    ? (quiz.totalPoints / quiz.maxPoints) * 100
    : 0;
  const accuracy = accuracyValue % 1 === 0
    ? accuracyValue.toFixed(0)
    : accuracyValue.toFixed(2);

  // Determine color based on accuracy percentage
  // 81.25% or higher (passing) = green
  // 62.5% to 81.24% (marginal) = yellow
  // Below 62.5% (failing) = red
  const accuracyNum = parseFloat(accuracy);
  const accuracyColor = accuracyNum >= 81.25 ? 'text-emerald-400' :
                        accuracyNum >= 62.5 ? 'text-yellow-400' :
                        'text-red-400';

  // Check if incomplete
  const isIncomplete = !quiz.completed;

  return {
    formattedDate,
    formattedTime,
    timeDisplay,
    accuracy,
    accuracyColor,
    totalQuestions: quiz.questions.length,
    isIncomplete,
  };
}

/**
 * Format date for Past Quizzes cards (shorter format)
 *
 * @param quiz - Quiz session
 * @returns Short formatted date
 */
export function formatQuizDateShort(quiz: QuizSession): string {
  const date = new Date(quiz.startedAt);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format quiz score fraction (e.g., "650/800")
 * Uses totalPoints/maxPoints to account for partial credit
 *
 * @param quiz - Quiz session
 * @returns Formatted score fraction
 */
export function formatQuizScore(quiz: QuizSession): string {
  return `${quiz.totalPoints}/${quiz.maxPoints}`;
}
