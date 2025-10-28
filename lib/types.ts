export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number | number[]; // Single number for MCQ, array for multiple-response
  explanation: string;
  incorrectExplanations: string[];
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
  interval: number; // Days until next review
  easeFactor: number; // SM-2 algorithm ease factor (default 2.5)
  repetitions: number; // Number of successful reviews
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
  firstAskedQuiz: number; // Quiz number when first asked
  lastAskedQuiz: number; // Quiz number when last asked
  timesAsked: number;
  correctHistory: boolean[]; // Track if user got it right each time
  lastAskedDate: number; // Timestamp
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
}
