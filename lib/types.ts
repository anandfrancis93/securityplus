export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  incorrectExplanations: string[];
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: number;
}

export interface UserProgress {
  userId: string;
  answeredQuestions: string[]; // Array of question IDs
  correctAnswers: number;
  totalQuestions: number;
  lastUpdated: number;
  quizHistory: QuizSession[];
}

export interface QuizSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  questions: QuestionAttempt[];
  score: number;
  completed: boolean;
}

export interface QuestionAttempt {
  questionId: string;
  question: Question;
  userAnswer: number | null;
  isCorrect: boolean;
  answeredAt: number;
}

export interface AppState {
  currentQuiz: QuizSession | null;
  userProgress: UserProgress | null;
  loading: boolean;
  error: string | null;
}
