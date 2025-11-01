/**
 * Centralized Quiz Constants
 *
 * DRY Principle: Single source of truth for all quiz-related magic numbers,
 * configuration values, and business logic constants.
 *
 * Usage:
 * import { QUIZ } from '@/lib/constants/quiz';
 *
 * if (masteryPercentage >= QUIZ.mastery.thresholds.proficient) { ... }
 */

export const QUIZ = {
  // Questions per quiz
  questions: {
    default: 10,
    min: 5,
    max: 50,
    practiceMode: 20,
  },

  // Mastery thresholds and requirements
  mastery: {
    // Percentage thresholds for mastery levels
    thresholds: {
      novice: 0,          // 0-39%
      developing: 40,     // 40-69%
      proficient: 70,     // 70-89%
      advanced: 90,       // 90-100%
    },

    // Questions required before unlocking next Bloom level
    questionsRequired: {
      1: 10,    // L1 → L2: Answer 10 L1 questions at 70%+ mastery
      2: 15,    // L2 → L3: Answer 15 L2 questions at 70%+ mastery
      3: 20,    // L3 → L4: Answer 20 L3 questions at 70%+ mastery
      4: 25,    // L4 → L5: Answer 25 L4 questions at 70%+ mastery
      5: 30,    // L5 → L6: Answer 30 L5 questions at 70%+ mastery
    },

    // Minimum mastery percentage to unlock next level
    percentageRequired: 70,

    // Bloom level multipliers for scoring
    bloomMultipliers: {
      1: 1.0,   // Remember
      2: 1.3,   // Understand
      3: 1.6,   // Apply
      4: 2.0,   // Analyze
      5: 2.5,   // Evaluate
      6: 3.0,   // Create
    },
  },

  // Confidence tracking (Dunning-Kruger effect)
  confidence: {
    // 5-point confidence scale
    options: [20, 40, 60, 80, 95],

    // Calibration thresholds
    calibration: {
      wellCalibrated: 10,      // ±10% = well calibrated
      moderatelyCalibrated: 20, // ±20% = moderately calibrated
      poorlyCalibrated: 20,     // >20% = poorly calibrated
    },

    // Bonus/penalty multipliers for calibration
    bonusMultipliers: {
      wellCalibrated: 1.0,
      moderatelyCalibrated: 0.5,
      poorlyCalibrated: 0.0,
    },

    // Minimum questions before showing confidence interventions
    minQuestionsForIntervention: 5,
  },

  // IRT (Item Response Theory) parameters
  irt: {
    // Initial theta (ability) value
    initialTheta: 0,

    // Theta range
    thetaRange: {
      min: -3,
      max: 3,
    },

    // Learning rate formula: base / (1 + questions/divisor)
    learningRate: {
      base: 0.3,
      divisor: 10,
    },

    // Performance score weights
    weights: {
      correctness: 0.5,         // Weight for correct/incorrect (0-1)
      typedMatch: 0.3,          // Weight for typed answer quality (L3-L6)
      calibration: 0.2,         // Weight for confidence calibration
    },

    // Difficulty ranges by Bloom level
    difficultyRanges: {
      1: { min: -2.0, max: -0.5 },  // L1: Easier questions
      2: { min: -1.5, max: 0.0 },
      3: { min: -1.0, max: 0.5 },
      4: { min: -0.5, max: 1.0 },
      5: { min: 0.0, max: 1.5 },
      6: { min: 0.5, max: 2.0 },    // L6: Harder questions
    },
  },

  // FSRS (Free Spaced Repetition Scheduler) integration
  fsrs: {
    // Default FSRS parameters (will be personalized)
    defaultParameters: [
      0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
      0.34, 1.26, 0.29, 2.61,
    ],

    // Initial state for new cards
    initialState: {
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
    },

    // Review grades
    grades: {
      again: 1,       // Incorrect/forgot
      hard: 2,        // Correct but difficult
      good: 3,        // Correct
      easy: 4,        // Correct and easy
    },
  },

  // Generation effect (typed answers for L3-L6)
  generation: {
    // Bloom levels that require typed answers
    requiredLevels: [3, 4, 5, 6],

    // Minimum match threshold for accepting typed answer
    minMatchThreshold: 0.6,  // 60% similarity

    // Character limits
    charLimits: {
      min: 3,
      max: 500,
      ideal: 100,
    },
  },

  // Recency weighting
  recency: {
    // Decay factor for old responses
    decayFactor: 0.95,

    // Maximum number of responses to consider
    maxResponses: 100,

    // Time windows (in days)
    windows: {
      recent: 7,      // Last 7 days
      medium: 30,     // Last 30 days
      old: 90,        // Last 90 days
    },
  },

  // Adaptive question selection
  adaptive: {
    // Probability of selecting slightly harder question
    challengeProbability: 0.3,

    // Theta range for "appropriate difficulty"
    appropriateRange: 0.5,

    // Minimum questions at current level before advancing
    minQuestionsBeforeAdvance: 3,
  },

  // Progress visualization
  progress: {
    // XP calculation
    xp: {
      basePerQuestion: 10,
      bloomMultiplier: true,  // Use bloom multipliers
      calibrationBonus: 5,    // Extra XP for good calibration
    },

    // Streaks
    streaks: {
      dailyGoal: 10,          // 10 questions per day
      maxStreakBonus: 2.0,    // 2x multiplier at max streak
    },
  },

  // LocalStorage keys
  storage: {
    quizInProgress: 'quizInProgress',
    lastQuizState: 'lastQuizState',
    userPreferences: 'userPreferences',
    celebrationShown: 'celebrationShown',
  },
} as const;

// Type helpers
export type MasteryLevel = 'novice' | 'developing' | 'proficient' | 'advanced';
export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type FSRSGrade = 1 | 2 | 3 | 4;
export type ConfidenceOption = 20 | 40 | 60 | 80 | 95;

/**
 * Get mastery level based on percentage
 */
export function getMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= QUIZ.mastery.thresholds.advanced) return 'advanced';
  if (percentage >= QUIZ.mastery.thresholds.proficient) return 'proficient';
  if (percentage >= QUIZ.mastery.thresholds.developing) return 'developing';
  return 'novice';
}

/**
 * Check if user can unlock next Bloom level
 */
export function canUnlockNextLevel(
  currentLevel: BloomLevel,
  questionsAnswered: number,
  masteryPercentage: number
): boolean {
  if (currentLevel === 6) return false; // Already at max level

  const required = QUIZ.mastery.questionsRequired[currentLevel];
  const percentageRequired = QUIZ.mastery.percentageRequired;

  return (
    questionsAnswered >= required && masteryPercentage >= percentageRequired
  );
}

/**
 * Calculate Bloom multiplier for scoring
 */
export function getBloomMultiplier(level: BloomLevel): number {
  return QUIZ.mastery.bloomMultipliers[level];
}

/**
 * Calculate calibration bonus
 */
export function getCalibrationBonus(
  confidencePercent: number,
  actualPercent: number
): number {
  const diff = Math.abs(confidencePercent - actualPercent);

  if (diff <= QUIZ.confidence.calibration.wellCalibrated) {
    return QUIZ.confidence.bonusMultipliers.wellCalibrated;
  }
  if (diff <= QUIZ.confidence.calibration.moderatelyCalibrated) {
    return QUIZ.confidence.bonusMultipliers.moderatelyCalibrated;
  }
  return QUIZ.confidence.bonusMultipliers.poorlyCalibrated;
}

/**
 * Check if Bloom level requires typed answer (generation effect)
 */
export function requiresTypedAnswer(level: BloomLevel): boolean {
  return QUIZ.generation.requiredLevels.includes(level);
}
