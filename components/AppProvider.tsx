'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, initializeAnonymousAuth } from '@/lib/firebase';
import { getUserProgress, saveQuizSession, calculatePredictedScore, resetUserProgress } from '@/lib/db';
import { UserProgress, QuizSession, Question, QuestionAttempt } from '@/lib/types';
import {
  getEffectiveUserId,
  createPairingCode,
  validatePairingCode,
  setPairedUserId,
  getPairedUserId
} from '@/lib/pairing';

interface AppContextType {
  userId: string | null;
  userProgress: UserProgress | null;
  currentQuiz: QuizSession | null;
  loading: boolean;
  predictedScore: number;
  startNewQuiz: () => void;
  answerQuestion: (question: Question, answerIndex: number) => void;
  endQuiz: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
  generatePairingCode: () => Promise<string>;
  enterPairingCode: (code: string) => Promise<boolean>;
  isPaired: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUserId, setAuthUserId] = useState<string | null>(null); // Firebase auth user ID
  const [userId, setUserId] = useState<string | null>(null); // Effective user ID (paired or auth)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictedScore, setPredictedScore] = useState(0);
  const [isPaired, setIsPaired] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (userProgress) {
      calculatePredictedScore(userProgress).then(setPredictedScore);
    }
  }, [userProgress]);

  const initAuth = async () => {
    try {
      const user = await initializeAnonymousAuth();
      setAuthUserId(user.uid);

      // Check if there's a paired user ID
      const effectiveId = getEffectiveUserId(user.uid);
      setUserId(effectiveId);
      setIsPaired(effectiveId !== user.uid);

      console.log('Auth initialized:', {
        authUserId: user.uid,
        effectiveUserId: effectiveId,
        isPaired: effectiveId !== user.uid
      });

      await loadUserProgress(effectiveId);
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
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
      completed: false,
    };
    setCurrentQuiz(newQuiz);
  };

  const answerQuestion = (question: Question, answerIndex: number) => {
    if (!currentQuiz) return;

    const isCorrect = answerIndex === question.correctAnswer;
    const attempt: QuestionAttempt = {
      questionId: question.id,
      question,
      userAnswer: answerIndex,
      isCorrect,
      answeredAt: Date.now(),
    };

    const updatedQuiz = {
      ...currentQuiz,
      questions: [...currentQuiz.questions, attempt],
      score: currentQuiz.questions.filter(q => q.isCorrect).length + (isCorrect ? 1 : 0),
    };

    setCurrentQuiz(updatedQuiz);
  };

  const endQuiz = async () => {
    if (!currentQuiz || !userId) {
      console.error('Cannot end quiz: missing currentQuiz or userId', { currentQuiz, userId });
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

  const value: AppContextType = {
    userId,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
