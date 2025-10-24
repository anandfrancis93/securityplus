'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, signOut } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getUserProgress, saveQuizSession, calculatePredictedScore, resetUserProgress } from '@/lib/db';
import { UserProgress, QuizSession, Question, QuestionAttempt } from '@/lib/types';
import {
  getEffectiveUserId,
  createPairingCode,
  validatePairingCode,
  setPairedUserId,
  getPairedUserId
} from '@/lib/pairing';
import { calculatePartialCredit } from '@/lib/irt';
import AuthModal from './AuthModal';
import {
  schedulePeriodicCheck,
  checkAndNotifyDueFlashcards,
} from '@/lib/notifications';
import { getUserReviews } from '@/lib/flashcardDb';
import { getNotificationPreference } from '@/lib/db';

interface AppContextType {
  userId: string | null;
  user: User | null;
  userProgress: UserProgress | null;
  currentQuiz: QuizSession | null;
  loading: boolean;
  predictedScore: number;
  startNewQuiz: () => void;
  answerQuestion: (question: Question, answer: number | number[]) => void;
  endQuiz: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
  generatePairingCode: () => Promise<string>;
  enterPairingCode: (code: string) => Promise<boolean>;
  isPaired: boolean;
  showAuthModal: () => void;
  handleSignOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null); // Firebase auth user ID
  const [userId, setUserId] = useState<string | null>(null); // Effective user ID (paired or auth)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictedScore, setPredictedScore] = useState(0);
  const [isPaired, setIsPaired] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (userProgress) {
      calculatePredictedScore(userProgress).then(setPredictedScore);
    }
  }, [userProgress]);

  // Initialize notifications and periodic checks
  useEffect(() => {
    if (!userId) return;

    let intervalId: number | null = null;

    const setupNotifications = async () => {
      // Set up periodic checking if notifications are enabled in Firebase
      const notifEnabled = await getNotificationPreference(userId);
      if (notifEnabled) {
        const checkFlashcards = async () => {
          try {
            const reviews = await getUserReviews(userId);
            await checkAndNotifyDueFlashcards(reviews);
          } catch (error) {
            console.error('Error checking due flashcards:', error);
          }
        };

        // Schedule checks every hour
        intervalId = schedulePeriodicCheck(checkFlashcards, 60);
      }
    };

    setupNotifications();

    // Cleanup
    return () => {
      if (intervalId !== null) {
        const { clearPeriodicCheck } = require('@/lib/notifications');
        clearPeriodicCheck(intervalId);
      }
    };
  }, [userId]);

  const initAuth = async () => {
    try {
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setAuthUserId(firebaseUser.uid);

          // Check if there's a paired user ID
          const effectiveId = getEffectiveUserId(firebaseUser.uid);
          setUserId(effectiveId);
          setIsPaired(effectiveId !== firebaseUser.uid);

          console.log('Auth initialized:', {
            authUserId: firebaseUser.uid,
            effectiveUserId: effectiveId,
            isPaired: effectiveId !== firebaseUser.uid,
            isAnonymous: firebaseUser.isAnonymous,
            email: firebaseUser.email
          });

          await loadUserProgress(effectiveId);
          setLoading(false);
        } else {
          // No user signed in - show auth modal
          setUser(null);
          setAuthUserId(null);
          setUserId(null);
          setLoading(false);
          setIsAuthModalOpen(true);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
    }
  };

  const loadUserProgress = async (uid: string) => {
    const progress = await getUserProgress(uid);
    setUserProgress(progress);
  };

  const refreshProgress = async () => {
    if (userId) {
      await loadUserProgress(userId);
    }
  };

  const startNewQuiz = () => {
    const newQuiz: QuizSession = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startedAt: Date.now(),
      questions: [],
      score: 0,
      totalPoints: 0,
      maxPoints: 0,
      completed: false,
    };
    setCurrentQuiz(newQuiz);
  };

  const answerQuestion = (question: Question, answer: number | number[]) => {
    if (!currentQuiz) return;

    const maxPoints = question.maxPoints || 100;
    let pointsEarned = 0;
    let isCorrect = false;

    if (question.questionType === 'multiple' && Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
      // Multiple-response question with partial credit
      pointsEarned = calculatePartialCredit(
        answer,
        question.correctAnswer,
        question.options.length,
        maxPoints
      );

      // Full credit only if all correct answers selected and no incorrect ones
      isCorrect = pointsEarned === maxPoints;
    } else {
      // Single-choice question
      const userAnswerIndex = Array.isArray(answer) ? answer[0] : answer;
      isCorrect = userAnswerIndex === question.correctAnswer;
      pointsEarned = isCorrect ? maxPoints : 0;
    }

    const attempt: QuestionAttempt = {
      questionId: question.id,
      question,
      userAnswer: answer,
      isCorrect,
      pointsEarned,
      maxPoints,
      answeredAt: Date.now(),
    };

    const updatedQuiz = {
      ...currentQuiz,
      questions: [...currentQuiz.questions, attempt],
      score: currentQuiz.questions.filter(q => q.isCorrect).length + (isCorrect ? 1 : 0),
      totalPoints: currentQuiz.totalPoints + pointsEarned,
      maxPoints: currentQuiz.maxPoints + maxPoints,
    };

    setCurrentQuiz(updatedQuiz);

    console.log('Question answered:', {
      questionType: question.questionType,
      difficulty: question.difficulty,
      pointsEarned,
      maxPoints,
      isCorrect,
      partialCredit: pointsEarned < maxPoints && pointsEarned > 0
    });
  };

  const endQuiz = async () => {
    if (!currentQuiz || !userId) {
      console.error('Cannot end quiz: missing currentQuiz or userId', { currentQuiz, userId });
      return;
    }

    // Only save quiz if at least one question was answered
    if (currentQuiz.questions.length === 0) {
      console.log('Quiz ended without answering any questions - not saving');
      setCurrentQuiz(null);
      return;
    }

    console.log('Ending quiz with data:', {
      userId,
      quizId: currentQuiz.id,
      questionsAnswered: currentQuiz.questions.length,
      score: currentQuiz.score
    });

    const finalQuiz = {
      ...currentQuiz,
      endedAt: Date.now(),
      completed: true,
    };

    try {
      await saveQuizSession(userId, finalQuiz);
      console.log('Quiz session saved successfully');
      setCurrentQuiz(null);
      await refreshProgress();
      console.log('Progress refreshed successfully');
    } catch (error) {
      console.error('Error in endQuiz:', error);
      throw error;
    }
  };

  const resetProgress = async () => {
    if (!userId) {
      console.error('Cannot reset progress: missing userId');
      return;
    }

    try {
      await resetUserProgress(userId);
      await refreshProgress();
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  };

  const generatePairingCode = async (): Promise<string> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const code = await createPairingCode(userId);
      return code;
    } catch (error) {
      console.error('Error generating pairing code:', error);
      throw error;
    }
  };

  const enterPairingCode = async (code: string): Promise<boolean> => {
    if (!authUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const pairedUserId = await validatePairingCode(code);

      if (!pairedUserId) {
        return false;
      }

      // Store paired user ID in localStorage
      setPairedUserId(pairedUserId);

      // Update state
      setUserId(pairedUserId);
      setIsPaired(true);

      // Load progress from paired account
      await loadUserProgress(pairedUserId);

      console.log('Device paired successfully:', {
        authUserId,
        pairedUserId
      });

      return true;
    } catch (error) {
      console.error('Error entering pairing code:', error);
      throw error;
    }
  };

  const showAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // Auth state will be handled by onAuthStateChanged
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserId(null);
      setAuthUserId(null);
      setUserProgress(null);
      setCurrentQuiz(null);
      setIsAuthModalOpen(true);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    userId,
    user,
    userProgress,
    currentQuiz,
    loading,
    predictedScore,
    startNewQuiz,
    answerQuestion,
    endQuiz,
    refreshProgress,
    resetProgress,
    generatePairingCode,
    enterPairingCode,
    isPaired,
    showAuthModal,
    handleSignOut,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
