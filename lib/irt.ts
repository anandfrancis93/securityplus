/**
 * Item Response Theory (IRT) Implementation
 *
 * This file implements IRT-based scoring for adaptive difficulty assessment.
 * IRT models the probability of answering a question correctly based on:
 * - Question difficulty (b parameter)
 * - Question discrimination (a parameter)
 * - User ability (theta parameter)
 */

import { Question, QuestionAttempt, UserProgress } from './types';

/**
 * IRT Parameter Mappings by Difficulty and Question Category
 *
 * Question categories represent cognitive complexity:
 * - Single-Domain-Single-Topic: Focused, straightforward (baseline)
 * - Single-Domain-Multiple-Topics: Integration within one domain (moderate complexity)
 * - Multiple-Domains-Multiple-Topics: Cross-domain synthesis (high complexity)
 *
 * Parameters:
 * - Difficulty (b): -3 (very easy) to +3 (very hard)
 * - Discrimination (a): 0.5 (poor) to 2.5 (excellent)
 * - Points: Reward for correct answer
 */

type QuestionCategory = 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics';

interface IRTParams {
  difficulty: number;
  discrimination: number;
  points: number;
}

/**
 * Deterministically map question category to difficulty level
 * Category IS the difficulty - no AI interpretation needed
 */
export function categoryToDifficulty(category: QuestionCategory): 'easy' | 'medium' | 'hard' {
  const mapping: Record<QuestionCategory, 'easy' | 'medium' | 'hard'> = {
    'single-domain-single-topic': 'easy',
    'single-domain-multiple-topics': 'medium',
    'multiple-domains-multiple-topics': 'hard',
  };
  return mapping[category];
}

/**
 * Simplified IRT parameters - directly map category to params
 * Difficulty is inherent in the category (number of topics/domains)
 */
export const IRT_CATEGORY_PARAMS: Record<QuestionCategory, IRTParams> = {
  'single-domain-single-topic': {
    difficulty: -1.0,      // Below average difficulty (EASY)
    discrimination: 1.0,   // Moderate discrimination
    points: 100,           // Base points
  },
  'single-domain-multiple-topics': {
    difficulty: 0.3,       // Slightly above baseline (MEDIUM)
    discrimination: 1.8,   // Strong discrimination
    points: 175,           // Reflects integration complexity
  },
  'multiple-domains-multiple-topics': {
    difficulty: 2.2,       // Very challenging (HARD)
    discrimination: 2.5,   // Maximum discrimination - best ability indicator
    points: 325,           // Maximum reward for complex synthesis
  },
};

/**
 * Legacy IRT Difficulty Mappings (for backward compatibility)
 * Uses single-domain-single-topic as baseline
 */
export const IRT_DIFFICULTY_MAP = {
  easy: -1.0,
  medium: 0.0,
  hard: 1.5,
};

/**
 * Legacy IRT Discrimination Mappings (for backward compatibility)
 */
export const IRT_DISCRIMINATION_MAP = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

/**
 * Legacy Points Map (for backward compatibility)
 */
export const IRT_POINTS_MAP = {
  easy: 100,
  medium: 150,
  hard: 250,
};

/**
 * 2-Parameter Logistic (2PL) IRT Model
 * Calculates probability of correct response
 *
 * P(θ) = 1 / (1 + e^(-a(θ - b)))
 *
 * @param theta - User ability level
 * @param difficulty - Question difficulty (b parameter)
 * @param discrimination - Question discrimination (a parameter)
 * @returns Probability of answering correctly (0 to 1)
 */
export function irtProbability(
  theta: number,
  difficulty: number,
  discrimination: number
): number {
  return 1 / (1 + Math.exp(-discrimination * (theta - difficulty)));
}

/**
 * Calculate IRT parameters for a question based on category
 * Difficulty is derived from category (no separate difficulty parameter needed)
 *
 * @param category - Question category (single-domain-single-topic, etc.)
 * @returns IRT parameters (difficulty, discrimination, maxPoints)
 */
export function calculateIRTParameters(
  category: QuestionCategory = 'single-domain-single-topic'
) {
  const params = IRT_CATEGORY_PARAMS[category];

  return {
    irtDifficulty: params.difficulty,
    irtDiscrimination: params.discrimination,
    maxPoints: params.points,
  };
}

/**
 * Calculate partial credit for multiple-response questions
 *
 * Uses proportional scoring:
 * - Points = (correct selections + correct non-selections) / total options
 *
 * Example: 4 options, correct answers are [0, 2]
 * - User selects [0, 2] → 4/4 = 100% credit
 * - User selects [0, 1, 2] → 3/4 = 75% credit (1 wrong selection)
 * - User selects [0] → 3/4 = 75% credit (missed 1 correct)
 * - User selects [1, 3] → 2/4 = 50% credit (2 wrong, 2 missed)
 *
 * @param userAnswers - Array of selected option indices
 * @param correctAnswers - Array of correct option indices
 * @param totalOptions - Total number of options
 * @param maxPoints - Maximum points for this question
 * @returns Points earned (0 to maxPoints)
 */
export function calculatePartialCredit(
  userAnswers: number[],
  correctAnswers: number[],
  totalOptions: number,
  maxPoints: number
): number {
  const correctSet = new Set(correctAnswers);
  const userSet = new Set(userAnswers);

  let correctSelections = 0;
  let correctNonSelections = 0;

  // Check each option
  for (let i = 0; i < totalOptions; i++) {
    const shouldBeSelected = correctSet.has(i);
    const wasSelected = userSet.has(i);

    if (shouldBeSelected && wasSelected) {
      correctSelections++; // Correctly selected
    } else if (!shouldBeSelected && !wasSelected) {
      correctNonSelections++; // Correctly NOT selected
    }
    // Incorrect selections or omissions don't add to score
  }

  const totalCorrect = correctSelections + correctNonSelections;
  const percentage = totalCorrect / totalOptions;

  return Math.round(percentage * maxPoints);
}

/**
 * Phase 1: Minimum questions threshold for reliable IRT estimates
 */
export const MINIMUM_QUESTIONS_THRESHOLD = 15;

/**
 * Phase 1: Maximum ability estimate when below threshold
 * Caps extreme values until sufficient data is collected
 */
export const CAPPED_ABILITY_LIMIT = 2.0;

/**
 * Check if user has sufficient data for reliable IRT estimates
 *
 * @param totalQuestions - Total number of questions answered
 * @returns true if sufficient data, false otherwise
 */
export function hasSufficientData(totalQuestions: number): boolean {
  return totalQuestions >= MINIMUM_QUESTIONS_THRESHOLD;
}

/**
 * Estimate user ability (theta) using Maximum Likelihood Estimation (MLE)
 *
 * This is a simplified MLE that iteratively finds the theta value
 * that maximizes the likelihood of the observed response pattern.
 *
 * Phase 1: Applies capping logic when insufficient data
 *
 * @param attempts - Array of question attempts
 * @returns Estimated ability level (theta)
 */
export function estimateAbility(attempts: QuestionAttempt[]): number {
  if (attempts.length === 0) return 0;

  let theta = 0; // Start with average ability
  const maxIterations = 20;
  const tolerance = 0.01;

  for (let iter = 0; iter < maxIterations; iter++) {
    let sumDeriv1 = 0; // First derivative
    let sumDeriv2 = 0; // Second derivative

    for (const attempt of attempts) {
      const q = attempt.question;
      const a = q.irtDiscrimination || 1.5;
      const b = q.irtDifficulty || 0;

      // Calculate probability of correct response
      const p = irtProbability(theta, b, a);

      // Observed response (1 if correct, 0 if incorrect)
      // For partial credit, use the percentage
      const y = attempt.pointsEarned / attempt.maxPoints;

      // First and second derivatives of log-likelihood
      sumDeriv1 += a * (y - p);
      sumDeriv2 += -a * a * p * (1 - p);
    }

    // Newton-Raphson update
    const delta = sumDeriv1 / Math.abs(sumDeriv2);
    theta += delta;

    // Check for convergence
    if (Math.abs(delta) < tolerance) {
      break;
    }

    // Keep theta in reasonable bounds
    theta = Math.max(-3, Math.min(3, theta));
  }

  // Phase 1: Cap ability estimates when insufficient data
  if (!hasSufficientData(attempts.length)) {
    theta = Math.max(-CAPPED_ABILITY_LIMIT, Math.min(CAPPED_ABILITY_LIMIT, theta));
  }

  return theta;
}

/**
 * Calculate predicted Security+ exam score using IRT
 *
 * Maps IRT ability (theta) to the 100-900 score scale
 *
 * Mapping logic:
 * - theta = -3: Score ≈ 100 (very low ability)
 * - theta = 0:  Score ≈ 550 (average ability)
 * - theta = 1:  Score ≈ 750 (passing ability)
 * - theta = 3:  Score ≈ 900 (very high ability)
 *
 * @param progress - User progress data
 * @returns Predicted exam score (100-900)
 */
export function calculateIRTScore(progress: UserProgress): number {
  // No questions answered yet
  if (progress.totalQuestions === 0) return 0;

  // Calculate ability estimate if not already done
  let theta = progress.estimatedAbility || 0;

  // Map theta to 100-900 scale
  // Using a sigmoid-like transformation
  // theta of 1.0 should map to passing score of 750

  // Linear mapping with scaling
  // theta: -3 to +3 maps to roughly 200 to 900
  const baseScore = 550; // Score at theta = 0
  const scaleFactor = 130; // Points per theta unit

  let predictedScore = baseScore + (theta * scaleFactor);

  // Apply floor and ceiling
  predictedScore = Math.max(100, Math.min(900, Math.round(predictedScore)));

  return predictedScore;
}

/**
 * Calculate score based on simple points ratio
 * Fallback method when IRT isn't applicable
 *
 * @param totalPoints - Points earned
 * @param maxPossiblePoints - Maximum points possible
 * @returns Score (100-900)
 */
export function calculatePointsBasedScore(
  totalPoints: number,
  maxPossiblePoints: number
): number {
  if (maxPossiblePoints === 0) return 0;

  const percentage = totalPoints / maxPossiblePoints;
  const score = Math.round(percentage * 900);

  return Math.max(100, Math.min(900, score));
}
