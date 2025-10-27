'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, signOut } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getUserProgress, saveQuizSession, calculatePredictedScore, resetUserProgress, saveUnusedQuestionsToCache } from '@/lib/db';
import { UserProgress, QuizSession, Question, QuestionAttempt, CachedQuiz } from '@/lib/types';
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
  endQuiz: (unusedQuestions?: Question[]) => Promise<void>;
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
  const [isPregenerating, setIsPregenerating] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (userProgress) {
      calculatePredictedScore(userProgress).then(setPredictedScore);
    }
  }, [userProgress]);

  // Background check: Ensure quiz cache always has 10 questions ready
  // Runs on initial load and periodically every 10 minutes
  useEffect(() => {
    if (!userId || !userProgress) return;

    const checkAndEnsureQuizCache = async () => {
      if (isPregenerating) {
        console.log('⏭️ Skipping cache check - pre-generation already in progress');
        return;
      }

      const cachedCount = userProgress.cachedQuiz?.questions?.length || 0;

      if (cachedCount < 10) {
        console.log(`📋 Background check: Only ${cachedCount}/10 questions cached, triggering pre-generation...`);

        setIsPregenerating(true);
        // Trigger pre-generation in background
        try {
          const response = await fetch('/api/pregenerate-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              completedQuestions: [], // No completed questions, just fill the cache
            }),
          });

          const data = await response.json();
          if (data.success) {
            console.log('✅ Background pre-generation complete:', {
              questionsCount: data.questionsCount,
              generationTime: `${data.generationTimeMs}ms`,
            });
            // Refresh progress to get the newly cached quiz
            await refreshProgress();
          } else {
            console.error('Background pre-generation failed:', data.error);
          }
        } catch (error) {
          console.error('Error in background pre-generation:', error);
        } finally {
          setIsPregenerating(false);
        }
      } else {
        console.log(`✅ Quiz cache ready: ${cachedCount}/10 questions available`);
      }
    };

    // Run initial check after 2 seconds to avoid blocking initial load
    const initialCheckTimeout = setTimeout(checkAndEnsureQuizCache, 2000);

    // Set up periodic check every 10 minutes
    const periodicCheckInterval = setInterval(checkAndEnsureQuizCache, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(periodicCheckInterval);
    };
  }, [userId]); // Only re-run when userId changes (login/logout)

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
          // No user signed in - don't show modal, let route handle it
          setUser(null);
          setAuthUserId(null);
          setUserId(null);
          setLoading(false);
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

  const endQuiz = async (unusedQuestions?: Question[]) => {
    if (!currentQuiz || !userId) {
      console.error('Cannot end quiz: missing currentQuiz or userId', { currentQuiz, userId });
      return;
    }

    // Check if no questions were answered
    if (currentQuiz.questions.length === 0) {
      console.log('Quiz ended without answering any questions - not saving quiz session');

      // Still save unused questions to cache if available
      if (unusedQuestions && unusedQuestions.length > 0) {
        try {
          const cachedQuiz: CachedQuiz = {
            questions: unusedQuestions,
            generatedAt: Date.now(),
            generatedForAbility: userProgress?.estimatedAbility || 0,
            generatedAfterQuiz: userProgress?.quizHistory?.length || 0
          };

          await saveUnusedQuestionsToCache(userId, cachedQuiz);
          console.log(`✅ Saved ${unusedQuestions.length} unused questions to cache (quiz not started)`);
        } catch (error) {
          console.error('Error saving unused questions:', error);
        }
      }

      setCurrentQuiz(null);
      return;
    }

    console.log('Ending quiz with data:', {
      userId,
      quizId: currentQuiz.id,
      questionsAnswered: currentQuiz.questions.length,
      score: currentQuiz.score,
      unusedQuestionsCount: unusedQuestions?.length || 0
    });

    const finalQuiz = {
      ...currentQuiz,
      endedAt: Date.now(),
      completed: true,
    };

    try {
      await saveQuizSession(userId, finalQuiz);
      console.log('Quiz session saved successfully');

      // Save unused pre-generated questions to cache for next quiz
      if (unusedQuestions && unusedQuestions.length > 0) {
        const cachedQuiz: CachedQuiz = {
          questions: unusedQuestions,
          generatedAt: Date.now(),
          generatedForAbility: userProgress?.estimatedAbility || 0,
          generatedAfterQuiz: userProgress?.quizHistory?.length || 0
        };

        await saveUnusedQuestionsToCache(userId, cachedQuiz);
        console.log(`✅ Saved ${unusedQuestions.length} unused questions to cache for next quiz`);
      }

      setCurrentQuiz(null);
      await refreshProgress();
      console.log('Progress refreshed successfully');

      // Only trigger pre-generation if we didn't save unused questions
      if (!unusedQuestions || unusedQuestions.length === 0) {
        triggerPregenerateQuiz(finalQuiz);
      } else {
        console.log('Skipping pre-generation - using cached unused questions instead');
      }
    } catch (error) {
      console.error('Error in endQuiz:', error);
      throw error;
    }
  };

  const triggerPregenerateQuiz = async (completedQuiz: QuizSession) => {
    if (!userId) return;

    try {
      console.log('Triggering pre-generation for next quiz...');

      // Prepare completed questions data for metadata update
      const completedQuestions = completedQuiz.questions.map(attempt => ({
        questionId: attempt.questionId,
        question: attempt.question,
        isCorrect: attempt.isCorrect,
      }));

      // Call pre-generation API (non-blocking)
      fetch('/api/pregenerate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          completedQuestions,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('✅ Next quiz pre-generated successfully:', {
              questionsCount: data.questionsCount,
              generationTime: `${data.generationTimeMs}ms`,
              phase: data.phase,
              totalQuizzesCompleted: data.totalQuizzesCompleted,
            });
          } else {
            console.error('Pre-generation failed:', data.error);
          }
        })
        .catch(error => {
          console.error('Error triggering pre-generation:', error);
          // Don't throw - this is a background operation
        });
    } catch (error) {
      console.error('Error in triggerPregenerateQuiz:', error);
      // Don't throw - this is a background operation
    }
  };

  const resetProgress = async () => {
    console.log('[DEBUG AppProvider] resetProgress called');
    console.log('[DEBUG AppProvider] userId:', userId);
    console.log('[DEBUG AppProvider] user:', user?.uid);
    console.log('[DEBUG AppProvider] authUserId:', authUserId);

    if (!userId) {
      console.error('[ERROR AppProvider] Cannot reset progress: missing userId');
      throw new Error('User ID is missing');
    }

    try {
      console.log('[DEBUG AppProvider] Starting progress reset for user:', userId);
      await resetUserProgress(userId);
      console.log('[DEBUG AppProvider] Database reset complete, refreshing progress...');

      await refreshProgress();
      console.log('[DEBUG AppProvider] Progress refreshed');

      // Explicitly reset predicted score to 0
      setPredictedScore(0);
      console.log('[DEBUG AppProvider] Predicted score reset to 0');

      console.log('[DEBUG AppProvider] Progress reset complete');
    } catch (error) {
      console.error('[ERROR AppProvider] Error resetting progress:', error);
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
      // Redirect will be handled by the route's useEffect hook
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
