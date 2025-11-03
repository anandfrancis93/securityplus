'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, signOut } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getUserProgress, saveQuizSession, calculatePredictedScore, resetUserProgress, saveUnusedQuestionsToCache } from '@/lib/db';
import { UserProgress, QuizSession, Question, QuestionAttempt, CachedQuiz } from '@/lib/types';
import { authenticatedPost } from '@/lib/apiClient';
import { calculatePartialCredit } from '@/lib/irt';
import AuthModal from './AuthModal';

interface AppContextType {
  userId: string | null;
  user: User | null;
  userProgress: UserProgress | null;
  currentQuiz: QuizSession | null;
  loading: boolean;
  predictedScore: number;
  liquidGlass: boolean;
  toggleLiquidGlass: () => void;
  startNewQuiz: (quizSessionId?: string) => void;
  restoreQuiz: (quiz: QuizSession) => void;
  saveQuizToServer: (quizState: any) => Promise<boolean>; // Save quiz to Firebase for cross-device
  loadQuizFromServer: () => Promise<any | null>; // Load quiz from Firebase
  deleteSavedQuiz: () => Promise<boolean>; // Delete saved quiz from Firebase
  answerQuestion: (question: Question, answer: number | number[], quizSessionId?: string, confidence?: number, reflection?: 'knew' | 'recognized' | 'narrowed' | 'guessed') => Promise<{ correctAnswer: number | number[], explanation: string, incorrectExplanations: string[] } | undefined>;
  updateReflection: (questionIndex: number, reflection: 'knew' | 'recognized' | 'narrowed' | 'guessed') => void;
  endQuiz: (unusedQuestions?: Question[]) => Promise<void>;
  refreshProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPregenerating, setIsPregenerating] = useState(false);
  const [liquidGlass, setLiquidGlass] = useState(() => {
    // Initialize from localStorage, default to true (enabled)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('liquidGlass');
      return stored !== null ? stored === 'true' : true;
    }
    return true;
  });

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (userProgress) {
      calculatePredictedScore(userProgress).then(setPredictedScore);
    }
  }, [userProgress]);

  // DISABLED: Background quiz pregeneration (to save API costs)
  // Previously ran on page load (2s delay) and every 10 minutes
  // Quizzes now only generate when user clicks "Start Quiz"
  //
  // To re-enable, uncomment the useEffect below:
  /*
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
        try {
          const data = await authenticatedPost('/api/pregenerate-quiz', {
            userId,
            completedQuestions: [],
          });

          if (data.success) {
            console.log('✅ Background pre-generation complete:', {
              questionsCount: data.questionsCount,
              generationTime: `${data.generationTimeMs}ms`,
            });

            // Log difficulty distribution if available
            if (data.difficultyDistribution) {
              const { easy, medium, hard } = data.difficultyDistribution;
              const isCorrect = easy === 3 && medium === 4 && hard === 3;
              console.log(
                `${isCorrect ? '✅' : '⚠️'} [QUIZ DISTRIBUTION] ${easy} easy, ${medium} medium, ${hard} hard (Expected: 3/4/3)`
              );
            }

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

    const initialCheckTimeout = setTimeout(checkAndEnsureQuizCache, 2000);
    const periodicCheckInterval = setInterval(checkAndEnsureQuizCache, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(periodicCheckInterval);
    };
  }, [userId]);
  */

  const initAuth = async () => {
    try {
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setAuthUserId(firebaseUser.uid);
          setUserId(firebaseUser.uid);

          console.log('Auth initialized:', {
            userId: firebaseUser.uid,
            isAnonymous: firebaseUser.isAnonymous,
            email: firebaseUser.email
          });

          await loadUserProgress(firebaseUser.uid);
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

  const startNewQuiz = (quizSessionId?: string) => {
    const newQuiz: QuizSession = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startedAt: Date.now(),
      questions: [],
      score: 0,
      totalPoints: 0,
      maxPoints: 0,
      completed: false,
      quizSessionId, // Store the server-side session ID
    };
    setCurrentQuiz(newQuiz);
  };

  // Restore quiz state from localStorage (used after page refresh/reload)
  const restoreQuiz = (quiz: QuizSession) => {
    setCurrentQuiz(quiz);
    console.log('Quiz restored in AppProvider:', {
      questionsCount: quiz.questions.length,
      score: quiz.score,
      totalPoints: quiz.totalPoints,
      maxPoints: quiz.maxPoints
    });
  };

  // Save quiz to Firebase for cross-device resume
  const saveQuizToServer = async (quizState: any): Promise<boolean> => {
    if (!userId) {
      console.error('Cannot save quiz: no userId');
      return false;
    }

    try {
      await authenticatedPost('/api/save-quiz', {
        userId,
        quizState,
      });
      console.log('Quiz saved to server');
      return true;
    } catch (error) {
      console.error('Error saving quiz to server:', error);
      return false;
    }
  };

  // Load quiz from Firebase
  const loadQuizFromServer = async (): Promise<any | null> => {
    if (!userId) {
      console.error('Cannot load quiz: no userId');
      return null;
    }

    try {
      const response = await authenticatedPost('/api/load-quiz', {
        userId,
      });
      console.log('Quiz loaded from server:', response.quizState ? 'Found' : 'None');
      return response.quizState;
    } catch (error) {
      console.error('Error loading quiz from server:', error);
      return null;
    }
  };

  // Delete saved quiz from Firebase
  const deleteSavedQuiz = async (): Promise<boolean> => {
    if (!userId) {
      console.error('Cannot delete saved quiz: no userId');
      return false;
    }

    try {
      await authenticatedPost('/api/delete-saved-quiz', {
        userId,
      });
      console.log('Saved quiz deleted from server');
      return true;
    } catch (error) {
      console.error('Error deleting saved quiz from server:', error);
      return false;
    }
  };

  const answerQuestion = async (
    question: Question,
    answer: number | number[],
    quizSessionId?: string,
    confidence?: number,
    reflection?: 'knew' | 'recognized' | 'narrowed' | 'guessed'
  ): Promise<{ correctAnswer: number | number[], explanation: string, incorrectExplanations: string[] } | undefined> => {
    if (!currentQuiz || !userId) {
      console.error('Cannot answer question: missing currentQuiz or userId');
      alert('Error: Quiz session not initialized. Please refresh the page and try again.');
      return undefined;
    }

    // Use provided quizSessionId or fall back to currentQuiz.quizSessionId
    const sessionId = quizSessionId || currentQuiz.quizSessionId;

    if (!sessionId) {
      console.error('Cannot answer question: missing quizSessionId');
      console.error('currentQuiz:', currentQuiz);
      console.error('Provided quizSessionId:', quizSessionId);
      alert('Error: Quiz session ID is missing. Please refresh the page and try again.');
      return undefined;
    }

    try {
      // SECURITY: Verify answer server-side
      const verificationResult = await authenticatedPost('/api/verify-answer', {
        userId,
        quizSessionId: sessionId,
        questionId: question.id,
        userAnswer: answer,
        questionNumber: currentQuiz.questions.length + 1,
      });

      const { isCorrect, pointsEarned, maxPoints, correctAnswer, explanation, incorrectExplanations } = verificationResult;

      // Merge verification result with question data for display
      const questionWithAnswer = {
        ...question,
        correctAnswer: correctAnswer !== undefined ? correctAnswer : question.correctAnswer,
        explanation: explanation || question.explanation,
        incorrectExplanations: incorrectExplanations || question.incorrectExplanations,
      };

      const attempt: QuestionAttempt = {
        questionId: question.id,
        question: questionWithAnswer,
        userAnswer: answer,
        isCorrect,
        pointsEarned,
        maxPoints,
        answeredAt: Date.now(),
        confidence,
        reflection,
      };

      const updatedQuiz = {
        ...currentQuiz,
        questions: [...currentQuiz.questions, attempt],
        score: currentQuiz.questions.filter(q => q.isCorrect).length + (isCorrect ? 1 : 0),
        totalPoints: currentQuiz.totalPoints + pointsEarned,
        maxPoints: currentQuiz.maxPoints + maxPoints,
      };

      setCurrentQuiz(updatedQuiz);

      console.log('Question answered (server-verified):', {
        questionType: question.questionType,
        difficulty: question.difficulty,
        pointsEarned,
        maxPoints,
        isCorrect,
        partialCredit: pointsEarned < maxPoints && pointsEarned > 0
      });

      // Return the answer data so QuizPage can update its local state
      return {
        correctAnswer: correctAnswer !== undefined ? correctAnswer : question.correctAnswer,
        explanation: explanation || question.explanation,
        incorrectExplanations: incorrectExplanations || question.incorrectExplanations,
      };
    } catch (error) {
      console.error('Error verifying answer:', error);
      // Handle error - show user feedback
      alert('Failed to submit answer. Please try again.');
      return undefined;
    }
  };

  const updateReflection = (questionIndex: number, reflection: 'knew' | 'recognized' | 'narrowed' | 'guessed') => {
    if (!currentQuiz) {
      console.error('Cannot update reflection: missing currentQuiz');
      return;
    }

    const updatedQuestions = [...currentQuiz.questions];
    if (questionIndex >= 0 && questionIndex < updatedQuestions.length) {
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        reflection,
      };

      setCurrentQuiz({
        ...currentQuiz,
        questions: updatedQuestions,
      });

      console.log('Reflection updated:', { questionIndex, reflection });
    }
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

      // Clear quiz from localStorage
      try {
        localStorage.removeItem('quizInProgress');
        console.log('Cleared quiz from localStorage (no questions answered)');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }

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

      // Clear quiz from localStorage
      try {
        localStorage.removeItem('quizInProgress');
        console.log('Cleared quiz from localStorage after ending quiz');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }

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
      authenticatedPost('/api/pregenerate-quiz', {
        userId,
        completedQuestions,
      })
        .then(data => {
          if (data.success) {
            console.log('✅ Next quiz pre-generated successfully:', {
              questionsCount: data.questionsCount,
              generationTime: `${data.generationTimeMs}ms`,
              phase: data.phase,
              totalQuizzesCompleted: data.totalQuizzesCompleted,
            });

            // Log difficulty distribution if available
            if (data.difficultyDistribution) {
              const { easy, medium, hard } = data.difficultyDistribution;
              const isCorrect = easy === 3 && medium === 4 && hard === 3;
              console.log(
                `${isCorrect ? '✅' : '⚠️'} [QUIZ DISTRIBUTION] ${easy} easy, ${medium} medium, ${hard} hard (Expected: 3/4/3)`
              );
            }
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

      // Clear any saved quiz from localStorage
      try {
        localStorage.removeItem('quizInProgress');
        console.log('[DEBUG AppProvider] Cleared quiz from localStorage');
      } catch (e) {
        console.error('[ERROR AppProvider] Failed to clear localStorage:', e);
      }

      console.log('[DEBUG AppProvider] Progress reset complete');
    } catch (error) {
      console.error('[ERROR AppProvider] Error resetting progress:', error);
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
      // Clear any in-progress quiz from localStorage before signing out
      try {
        localStorage.removeItem('quizInProgress');
        console.log('Cleared quiz from localStorage on sign out');
      } catch (e) {
        console.error('Failed to clear localStorage on sign out:', e);
      }

      await signOut();
      setUser(null);
      setUserId(null);
      setAuthUserId(null);
      setCurrentQuiz(null); // Clear current quiz state
      setUserProgress(null);
      // Redirect will be handled by the route's useEffect hook
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const toggleLiquidGlass = () => {
    setLiquidGlass(prev => {
      const newValue = !prev;
      localStorage.setItem('liquidGlass', String(newValue));
      return newValue;
    });
  };

  const value: AppContextType = {
    userId,
    user,
    userProgress,
    currentQuiz,
    loading,
    predictedScore,
    liquidGlass,
    toggleLiquidGlass,
    startNewQuiz,
    restoreQuiz,
    saveQuizToServer,
    loadQuizFromServer,
    deleteSavedQuiz,
    answerQuestion,
    updateReflection,
    endQuiz,
    refreshProgress,
    resetProgress,
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
