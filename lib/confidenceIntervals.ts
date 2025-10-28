/**
 * Confidence Interval Utilities
 *
 * Provides statistical confidence interval calculations for:
 * - IRT ability estimates (standard error based on Fisher Information)
 * - Proportion confidence intervals (Wilson score method)
 */

import { QuestionAttempt } from './types';
import { irtProbability } from './irt';

/**
 * Calculate standard error for IRT ability estimate
 * Uses Fisher Information to quantify uncertainty
 *
 * Fisher Information: I(θ) = Σ aᵢ² * P(θ) * (1 - P(θ))
 * Standard Error: SE(θ) = 1 / √I(θ)
 *
 * @param theta - Estimated ability level
 * @param attempts - Array of question attempts
 * @returns Standard error of the ability estimate
 */
export function calculateIRTStandardError(
  theta: number,
  attempts: QuestionAttempt[]
): number {
  if (attempts.length === 0) return Infinity;

  let fisherInformation = 0;

  for (const attempt of attempts) {
    const q = attempt.question;
    const a = q.irtDiscrimination || 1.5;
    const b = q.irtDifficulty || 0;

    // Calculate probability at current theta
    const p = irtProbability(theta, b, a);

    // Fisher Information contribution from this item
    // I(θ) = a² * P(θ) * (1 - P(θ))
    fisherInformation += a * a * p * (1 - p);
  }

  // Standard error is inverse square root of Fisher Information
  const standardError = fisherInformation > 0 ? 1 / Math.sqrt(fisherInformation) : Infinity;

  return standardError;
}

/**
 * Calculate confidence interval for IRT ability estimate
 *
 * @param theta - Estimated ability level
 * @param standardError - Standard error from calculateIRTStandardError
 * @param confidenceLevel - Confidence level (default 0.95 for 95% CI)
 * @returns Confidence interval [lower, upper]
 */
export function calculateIRTConfidenceInterval(
  theta: number,
  standardError: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number; margin: number } {
  // Z-score for confidence level
  // 95% CI: z = 1.96
  // 90% CI: z = 1.645
  // 99% CI: z = 2.576
  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidenceLevel] || 1.96;
  const margin = z * standardError;

  return {
    lower: Math.max(-3, theta - margin), // IRT ability is bounded [-3, 3]
    upper: Math.min(3, theta + margin),
    margin,
  };
}

/**
 * Wilson Score Interval for proportions
 *
 * More accurate than normal approximation, especially for:
 * - Small sample sizes (n < 30)
 * - Extreme proportions (close to 0% or 100%)
 * - Asymmetric intervals that respect [0, 1] bounds
 *
 * Formula: (p̂ + z²/2n ± z√(p̂(1-p̂)/n + z²/4n²)) / (1 + z²/n)
 *
 * @param successes - Number of successes (correct answers)
 * @param total - Total number of trials (questions)
 * @param confidenceLevel - Confidence level (default 0.95 for 95% CI)
 * @returns Confidence interval [lower, upper] in percentage (0-100)
 */
export function wilsonScoreInterval(
  successes: number,
  total: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number; proportion: number } {
  // Handle edge cases
  if (total === 0) {
    return { lower: 0, upper: 0, proportion: 0 };
  }

  if (successes === 0) {
    // Special case: 0 successes
    return { lower: 0, upper: wilsonUpperBound(0, total, confidenceLevel), proportion: 0 };
  }

  if (successes === total) {
    // Special case: all successes
    return { lower: wilsonLowerBound(total, total, confidenceLevel), upper: 100, proportion: 100 };
  }

  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidenceLevel] || 1.96;
  const p = successes / total; // Sample proportion
  const n = total;

  // Wilson score interval calculation
  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

  const lower = Math.max(0, center - margin) * 100;
  const upper = Math.min(1, center + margin) * 100;
  const proportion = p * 100;

  return { lower, upper, proportion };
}

/**
 * Calculate upper bound of Wilson interval (used for 0 successes case)
 */
function wilsonUpperBound(successes: number, total: number, confidenceLevel: number): number {
  if (total === 0) return 0;

  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidenceLevel] || 1.96;
  const p = successes / total;
  const n = total;

  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

  return Math.min(1, center + margin) * 100;
}

/**
 * Calculate lower bound of Wilson interval (used for all successes case)
 */
function wilsonLowerBound(successes: number, total: number, confidenceLevel: number): number {
  if (total === 0) return 0;

  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidenceLevel] || 1.96;
  const p = successes / total;
  const n = total;

  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

  return Math.max(0, center - margin) * 100;
}

/**
 * Calculate confidence interval for predicted exam score
 * Maps IRT ability confidence interval to 100-900 score scale
 *
 * @param thetaLower - Lower bound of ability CI
 * @param thetaUpper - Upper bound of ability CI
 * @returns Score confidence interval [lower, upper]
 */
export function calculateScoreConfidenceInterval(
  thetaLower: number,
  thetaUpper: number
): { lower: number; upper: number } {
  const baseScore = 550;
  const scaleFactor = 130;

  const scoreLower = Math.max(100, Math.min(900, Math.round(baseScore + thetaLower * scaleFactor)));
  const scoreUpper = Math.max(100, Math.min(900, Math.round(baseScore + thetaUpper * scaleFactor)));

  return { lower: scoreLower, upper: scoreUpper };
}

/**
 * Format confidence interval for display
 *
 * @param lower - Lower bound
 * @param upper - Upper bound
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted string like "0.45 to 0.89" or "[0.45, 0.89]"
 */
export function formatConfidenceInterval(
  lower: number,
  upper: number,
  decimals: number = 2,
  useBrackets: boolean = false
): string {
  const l = lower.toFixed(decimals);
  const u = upper.toFixed(decimals);

  return useBrackets ? `[${l}, ${u}]` : `${l} to ${u}`;
}

/**
 * Get reliability description based on confidence interval width
 * Narrower intervals = higher reliability
 *
 * @param margin - Margin of error (half-width of CI)
 * @param type - Type of interval ('ability' or 'proportion')
 * @returns Reliability description
 */
export function getReliabilityDescription(
  margin: number,
  type: 'ability' | 'proportion'
): { label: string; color: string } {
  if (type === 'ability') {
    // For IRT ability (theta scale: -3 to 3, range of 6)
    if (margin <= 0.3) return { label: 'Very precise', color: 'emerald' };
    if (margin <= 0.5) return { label: 'Precise', color: 'cyan' };
    if (margin <= 0.8) return { label: 'Moderate', color: 'yellow' };
    if (margin <= 1.2) return { label: 'Uncertain', color: 'orange' };
    return { label: 'Very uncertain', color: 'red' };
  } else {
    // For proportions (percentage scale: 0-100)
    if (margin <= 5) return { label: 'Very precise', color: 'emerald' };
    if (margin <= 10) return { label: 'Precise', color: 'cyan' };
    if (margin <= 15) return { label: 'Moderate', color: 'yellow' };
    if (margin <= 25) return { label: 'Uncertain', color: 'orange' };
    return { label: 'Very uncertain', color: 'red' };
  }
}
