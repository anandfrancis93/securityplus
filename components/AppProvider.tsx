'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, initializeAnonymousAuth } from '@/lib/firebase';
import { getUserProgress, saveQuizSession, calculatePredictedScore } from '@/lib/db';
import { UserProgress, QuizSession, Question, QuestionAttempt } from '@/lib/types';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictedScore, setPredictedScore] = useState(0);

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
      setUserId(user.uid);
      await loadUserProgress(user.uid);
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
    if (!currentQuiz || !userId) return;

    const finalQuiz = {
      ...currentQuiz,
      endedAt: Date.now(),
      completed: true,
    };

    await saveQuizSession(userId, finalQuiz);
    setCurrentQuiz(null);
    await refreshProgress();
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
