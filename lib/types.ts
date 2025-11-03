// Option item bundles text + explanation + correctness together
// This prevents drift when shuffling or reordering
export interface OptionItem {
  id: string; // Stable UUID that persists through shuffles
  text: string; // Display text WITHOUT letter prefix (e.g., "CISO", not "A. CISO")
  explanation: string; // Explanation for THIS specific option
  isCorrect: boolean; // Whether this option is correct
}

export interface Question {
  id: string;
  question: string;

  // NEW SCHEMA (preferred): Bundled options with explanations
  optionItems?: OptionItem[]; // Array of option objects (shuffle-safe, drift-proof)

  // OLD SCHEMA (deprecated, for backward compatibility): Parallel arrays
  options?: string[]; // Legacy: separate options array
  correctAnswer?: number | number[]; // Legacy: separate correctness tracking
  explanation?: string; // Legacy: overall explanation (now redundant)
  incorrectExplanations?: string[]; // Legacy: parallel explanations array

  topics: string[]; // Exact topic strings from cleaned topic list
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: number;
  questionType: 'single' | 'multiple'; // Single-choice or multiple-response
  questionCategory?: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics'; // Question complexity based on domain and topic coverage
  irtDifficulty?: number; // IRT difficulty parameter (-3 to +3, higher = harder)
  irtDiscrimination?: number; // IRT discrimination parameter (0.5 to 2.5, higher = better differentiates ability)
  maxPoints?: number; // Maximum points for this question
  metadata?: {
    primaryTopic: string; // Main Security+ topic
    scenario: string; // Scenario type (e.g., 'certificate_validation')
    keyConcept: string; // Specific concept tested (e.g., 'CRL_vs_OCSP')
  };
  // Debug info: Two-pass topic validation logs (only in development)
  validationLogs?: {
    pass1Topics: string[]; // Topics from Pass 1 (string matching)
    pass2Rejected: Array<{ topic: string; reason: string }>; // Topics rejected by Pass 2
    pass2Kept: string[]; // Final topics after Pass 2
  };
}

export interface TopicPerformance {
  topicName: string;
  domain: string; // Which of the 5 domains this belongs to
  questionsAnswered: number;
  correctAnswers: number;
  totalPoints: number;
  maxPoints: number;
  accuracy: number; // Percentage
  lastTested: number; // Timestamp
  isMastered: boolean; // accuracy >= 80% && questionsAnswered >= 3

  // FSRS spaced repetition fields
  stability?: number; // FSRS memory stability (days)
  difficulty?: number; // FSRS difficulty (0-10)
  elapsedDays?: number; // Days since last review
  scheduledDays?: number; // Scheduled interval (days)
  nextReviewQuiz?: number; // Quiz number when due for review
  lastReviewQuiz?: number; // Quiz number when last tested
  reps?: number; // Number of reviews
  lapses?: number; // Number of times forgotten
  state?: number; // FSRS State: 0=New, 1=Learning, 2=Review, 3=Relearning
  lastReviewDate?: number; // Timestamp of last review
  isStruggling?: boolean; // accuracy < 60% && questionsAnswered >= 2
}

export interface InProgressQuiz {
  quizSessionId: string;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  selectedAnswers: number[];
  showExplanation: boolean;
  currentQuiz: QuizSession; // Full AppProvider quiz state
  savedAt: number;
}

export interface UserProgress {
  userId: string;
  answeredQuestions: string[]; // Array of question IDs
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number; // Total points earned (for IRT scoring)
  maxPossiblePoints: number; // Max points possible from attempted questions
  lastUpdated: number;
  quizHistory: QuizSession[];
  estimatedAbility?: number; // IRT ability estimate (theta)
  abilityStandardError?: number; // Standard error of ability estimate (for confidence intervals)
  notificationsEnabled?: boolean; // Whether flashcard notifications are enabled
  topicPerformance?: { [topicName: string]: TopicPerformance }; // Cross-session topic tracking
  cachedQuiz?: CachedQuiz | null; // Pre-generated quiz ready to use
  quizMetadata?: QuizGenerationMetadata; // Metadata for question generation and tracking
  inProgressQuiz?: InProgressQuiz | null; // Saved quiz for cross-device resume
}

export interface QuizSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  questions: QuestionAttempt[];
  score: number;
  totalPoints: number; // Total points earned in this session
  maxPoints: number; // Max points possible in this session
  completed: boolean;
  quizSessionId?: string; // Server-side quiz session ID for answer verification
}

export interface QuestionAttempt {
  questionId: string;
  question: Question;
  userAnswer: number | number[] | null; // Single number or array for multiple-response
  isCorrect: boolean;
  pointsEarned: number; // Actual points earned (supports partial credit)
  maxPoints: number; // Maximum points possible for this question
  answeredAt: number;
  // Dunning-Kruger tracking
  confidence?: number; // Pre-answer confidence level (20, 40, 60, 80, 95)
  reflection?: 'knew' | 'recognized' | 'narrowed' | 'guessed'; // Post-answer reflection
}

export interface AppState {
  currentQuiz: QuizSession | null;
  userProgress: UserProgress | null;
  loading: boolean;
  error: string | null;
}

// Flashcard Types
export interface Flashcard {
  id: string;
  term: string;
  definition: string;
  context?: string; // Additional context from the document
  domain?: string; // Security+ domain (1.0-5.0)
  imageUrl?: string; // URL to uploaded image
  sourceFile: string; // Name of the uploaded file
  orderInFile: number; // Order in which it appeared in the file
  createdAt: number;
  userId: string;
}

export interface FlashcardReview {
  flashcardId: string;
  userId: string;
  reviewedAt: number;
  difficulty: 'again' | 'hard' | 'good' | 'easy'; // User rating
  nextReviewDate: number; // Timestamp for next review
  interval: number; // Days until next review (scheduled_days in FSRS)
  easeFactor: number; // Legacy SM-2 field, not used in FSRS (kept for backwards compatibility)
  repetitions: number; // Number of successful reviews (reps in FSRS)

  // FSRS-specific fields
  stability?: number; // Memory stability (how long the card will be remembered)
  fsrsDifficulty?: number; // FSRS difficulty rating (0-10, higher = harder)
  elapsedDays?: number; // Days since last review
  scheduledDays?: number; // Scheduled interval in days
  reps?: number; // Number of reviews
  lapses?: number; // Number of times forgotten
  state?: number; // FSRS state: 0=New, 1=Learning, 2=Review, 3=Relearning
}

export interface FlashcardDeck {
  id: string;
  name: string;
  userId: string;
  flashcardIds: string[];
  createdAt: number;
  lastStudied?: number;
}

// Question Caching and Spaced Repetition Types
export interface QuestionHistory {
  questionId: string;
  metadata?: {
    primaryTopic: string;
    scenario: string;
    keyConcept: string;
  };
  questionCategory?: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics'; // Question complexity for difficulty distribution
  firstAskedQuiz: number; // Quiz number when first asked
  lastAskedQuiz: number; // Quiz number when last asked
  timesAsked: number;
  correctHistory: boolean[]; // Track if user got it right each time
  lastAskedDate: number; // Timestamp

  // FSRS spaced repetition fields
  stability?: number; // FSRS memory stability (days)
  difficulty?: number; // FSRS difficulty (0-10)
  elapsedDays?: number; // Days since last review
  scheduledDays?: number; // Scheduled interval (days)
  reps?: number; // Number of reviews
  lapses?: number; // Number of times forgotten
  state?: number; // FSRS State: 0=New, 1=Learning, 2=Review, 3=Relearning
  lastRating?: number; // Last rating given (1=Again, 2=Hard, 3=Good, 4=Easy)
  nextReviewDate?: number; // Timestamp when next review is due
  nextReviewQuiz?: number; // Quiz number when next review is due
}

export interface TopicCoverageStatus {
  topicName: string;
  domain: string;
  firstCoveredQuiz: number | null; // Quiz number when first covered, null if never
  timesCovered: number;
  lastCoveredQuiz: number | null;
}

export interface CachedQuiz {
  questions: Partial<Question>[]; // SECURITY: Questions WITHOUT correctAnswer field
  generatedAt: number;
  generatedForAbility: number; // Ability level at time of generation
  generatedAfterQuiz: number; // Quiz number after which this was generated
  quizSessionId?: string; // Server-side quiz session ID (contains full questions with correct answers)
}

export interface QuizGenerationMetadata {
  totalQuizzesCompleted: number;
  allTopicsCoveredOnce: boolean; // Phase 1 complete flag
  questionHistory: { [questionId: string]: QuestionHistory };
  topicCoverage: { [topicName: string]: TopicCoverageStatus };
  topicPerformance?: { [topicName: string]: TopicPerformance }; // Performance tracking per topic

  // FSRS and Phase tracking
  currentPhase?: 1 | 2 | 3; // Learning phase
  phase1CompletedAt?: number; // Quiz number when Phase 1 completed
  phase2CompletedAt?: number; // Quiz number when Phase 2 completed
  fsrsParameters?: number[]; // User-specific FSRS parameters (learned from history)
  lastParameterUpdate?: number; // Timestamp when parameters were last optimized
}
