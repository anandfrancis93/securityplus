export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number | number[]; // Single number for MCQ, array for multiple-response
  explanation: string;
  incorrectExplanations: string[];
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: number;
  questionType: 'single' | 'multiple'; // Single-choice or multiple-response
  irtDifficulty?: number; // IRT difficulty parameter (-3 to +3, higher = harder)
  irtDiscrimination?: number; // IRT discrimination parameter (0.5 to 2.5, higher = better differentiates ability)
  maxPoints?: number; // Maximum points for this question
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
