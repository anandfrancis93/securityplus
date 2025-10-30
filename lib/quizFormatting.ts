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
  const accuracy = quiz.maxPoints > 0
    ? ((quiz.totalPoints / quiz.maxPoints) * 100).toFixed(1)
    : '0.0';

  // Check if incomplete
  const isIncomplete = !quiz.completed;

  return {
    formattedDate,
    formattedTime,
    timeDisplay,
    accuracy,
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
