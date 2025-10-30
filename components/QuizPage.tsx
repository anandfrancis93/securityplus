'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { Question } from '@/lib/types';
import { authenticatedPost } from '@/lib/apiClient';
import Header from './Header';
import QuestionCard from './quiz/QuestionCard';
import ExplanationSection from './quiz/ExplanationSection';
import QuestionMetadata from './quiz/QuestionMetadata';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { AdaptiveBackground } from '@/components/ui/LiquidGlassBackground';

export default function Quiz() {
  const { currentQuiz, userProgress, answerQuestion, endQuiz, startNewQuiz, restoreQuiz, saveQuizToServer, loadQuizFromServer, deleteSavedQuiz, user, loading: authLoading, liquidGlass, handleSignOut, refreshProgress } = useApp();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingNext, setGeneratingNext] = useState(false);
  const [totalQuestions] = useState(10);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizEnding, setQuizEnding] = useState(false); // Flag to stop generation when ending quiz

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  const [quizStats, setQuizStats] = useState<{ total: number; correct: number; accuracy: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Save quiz state to localStorage as backup
  const saveQuizToLocalStorage = () => {
    if (!user?.uid || !quizSessionId) return;

    const quizState = {
      userId: user.uid,
      quizSessionId,
      questions,
      currentQuestionIndex,
      selectedAnswer,
      selectedAnswers,
      showExplanation,
      timestamp: Date.now(),
      // IMPORTANT: Also save currentQuiz from AppProvider for proper restoration
      currentQuiz: currentQuiz ? {
        id: currentQuiz.id,
        startedAt: currentQuiz.startedAt,
        questions: currentQuiz.questions,
        score: currentQuiz.score,
        totalPoints: currentQuiz.totalPoints,
        maxPoints: currentQuiz.maxPoints,
        completed: currentQuiz.completed,
        quizSessionId: currentQuiz.quizSessionId,
      } : null,
    };

    try {
      localStorage.setItem('quizInProgress', JSON.stringify(quizState));
      console.log('Quiz state saved to localStorage');
    } catch (error) {
      console.error('Failed to save quiz to localStorage:', error);
    }
  };

  // Clear quiz from localStorage
  const clearQuizFromLocalStorage = () => {
    try {
      localStorage.removeItem('quizInProgress');
      console.log('Quiz state cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear quiz from localStorage:', error);
    }
  };

  // Try to restore quiz from localStorage
  const restoreQuizFromLocalStorage = (): boolean => {
    if (!user?.uid) return false;

    try {
      const savedQuiz = localStorage.getItem('quizInProgress');
      if (!savedQuiz) return false;

      const quizState = JSON.parse(savedQuiz);

      // Check if the quiz is for the current user and not too old (1 hour)
      const isExpired = Date.now() - quizState.timestamp > 60 * 60 * 1000;
      if (quizState.userId !== user.uid || isExpired) {
        clearQuizFromLocalStorage();
        return false;
      }

      // Restore quiz state to local state
      setQuizSessionId(quizState.quizSessionId);
      setQuestions(quizState.questions);
      setCurrentQuestionIndex(quizState.currentQuestionIndex);
      setSelectedAnswer(quizState.selectedAnswer);
      setSelectedAnswers(quizState.selectedAnswers);
      setShowExplanation(quizState.showExplanation);

      // CRITICAL: Restore currentQuiz in AppProvider with ALL previously answered questions
      // This ensures answerQuestion() has correct question count for server validation
      if (currentQuiz === null) {
        if (quizState.currentQuiz) {
          // Restore full quiz state including all answered questions
          restoreQuiz(quizState.currentQuiz);
        } else if (quizState.quizSessionId) {
          // Fallback: if no currentQuiz was saved (old localStorage format), create empty one
          startNewQuiz(quizState.quizSessionId);
        }
      }

      console.log('Quiz restored from localStorage');
      return true;
    } catch (error) {
      console.error('Failed to restore quiz from localStorage:', error);
      clearQuizFromLocalStorage();
      return false;
    }
  };

  useEffect(() => {
    // Don't initialize until auth is complete and user exists
    if (authLoading || !user) {
      console.log('Waiting for auth to complete...', { authLoading, user: !!user });
      return;
    }

    // Prevent multiple initializations
    if (hasInitialized) {
      console.log('Already initialized, skipping...');
      return;
    }

    console.log('Auth complete, initializing quiz...');
    setHasInitialized(true);

    // Priority order: Firebase (cross-device) → localStorage (same device) → New quiz
    initQuizWithRestore();
  }, [authLoading, user]); // Don't include hasInitialized - it triggers re-runs!

  // Automatically generate next question in background whenever a new question is added
  useEffect(() => {
    // Don't generate if quiz has ended or is ending
    if (!loading && !showCelebration && !quizEnding && questions.length > 0 && questions.length < totalQuestions && !generatingNext) {
      // Generate the next question immediately after the current one is added
      console.log(`Auto-generating question ${questions.length + 1} in background...`);
      setGeneratingNext(true);
      generateNextQuestion().then(() => {
        setGeneratingNext(false);
      });
    }
  }, [loading, showCelebration, quizEnding, questions.length, generatingNext]); // Watch quizEnding to stop generation immediately

  // Auto-save quiz state whenever it changes
  useEffect(() => {
    if (!loading && questions.length > 0 && quizSessionId) {
      saveQuizToLocalStorage();
    }
  }, [questions, currentQuestionIndex, selectedAnswer, selectedAnswers, showExplanation]);

  // Handle browser navigation (back/forward/refresh/close)
  useEffect(() => {
    if (loading || showCelebration || questions.length === 0) return;

    // Warn before page unload (refresh/close)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Save to localStorage before leaving
      saveQuizToLocalStorage();
      // Modern browsers ignore custom messages, but we still need to set returnValue
      e.returnValue = '';
      return '';
    };

    // Handle back/forward navigation
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Show custom warning modal
      setShowNavigationWarning(true);
      // Store the navigation action to execute if user confirms
      setPendingNavigation(() => () => {
        saveQuizToLocalStorage();
        window.history.back();
      });
      // Push current state back to prevent immediate navigation
      window.history.pushState(null, '', window.location.pathname);
    };

    // Push initial state to enable popstate detection
    window.history.pushState(null, '', window.location.pathname);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loading, showCelebration, questions.length, quizSessionId]);

  // Initialize quiz with proper restoration priority
  const initQuizWithRestore = async () => {
    // 1. Try Firebase first (for cross-device resume)
    console.log('Checking Firebase for saved quiz...');
    const serverQuiz = await loadQuizFromServer();
    if (serverQuiz) {
      console.log('Found saved quiz on Firebase, restoring...');
      const restored = restoreQuizFromServer(serverQuiz);
      if (restored) {
        setLoading(false);
        return;
      }
    }

    // 2. Try localStorage next (for same-device resume after close/refresh)
    console.log('Checking localStorage for saved quiz...');
    const localRestored = restoreQuizFromLocalStorage();
    if (localRestored) {
      console.log('Restored quiz from localStorage');
      setLoading(false);
      return;
    }

    // 3. Start new quiz
    console.log('No saved quiz found, starting new quiz...');
    await initQuiz();
  };

  // Restore quiz from Firebase (used for cross-device resume)
  const restoreQuizFromServer = (serverQuizState: any): boolean => {
    if (!serverQuizState || !user?.uid) return false;

    try {
      // Validate the quiz state
      if (serverQuizState.userId !== user.uid) {
        console.error('Quiz user ID mismatch');
        return false;
      }

      // Restore all state
      setQuizSessionId(serverQuizState.quizSessionId);
      setQuestions(serverQuizState.questions);
      setCurrentQuestionIndex(serverQuizState.currentQuestionIndex);
      setSelectedAnswer(serverQuizState.selectedAnswer);
      setSelectedAnswers(serverQuizState.selectedAnswers);
      setShowExplanation(serverQuizState.showExplanation);

      // Restore currentQuiz in AppProvider
      if (serverQuizState.currentQuiz) {
        restoreQuiz(serverQuizState.currentQuiz);
      }

      console.log('Quiz restored from server');
      return true;
    } catch (error) {
      console.error('Failed to restore quiz from server:', error);
      return false;
    }
  };

  const initQuiz = async () => {
    console.log('Starting fresh quiz - generating first question...');

    // Reset quiz ending flag
    setQuizEnding(false);

    // Clear any old cached quiz
    await clearCachedQuiz();

    // Start new quiz (quizSessionId will be created with first question)
    startNewQuiz();

    // Generate first question
    await generateNextQuestion();
  };

  const clearCachedQuiz = async () => {
    if (!user?.uid) return;

    try {
      // Clear cached quiz from Firebase
      await authenticatedPost('/api/clear-cached-quiz', {
        userId: user.uid,
      });
      console.log('Cached quiz cleared from Firebase');
    } catch (error) {
      console.error('Error clearing cached quiz:', error);
      // Non-critical error, don't throw
    }
  };

  const generateNextQuestion = async () => {
    try {
      const questionNumber = questions.length + 1;

      if (questionNumber > totalQuestions) {
        console.log('All questions generated');
        return;
      }

      console.log(`Generating question ${questionNumber}...`);

      const data = await authenticatedPost('/api/generate-single-question', {
        userId: user?.uid,
        ...(quizSessionId ? { quizSessionId } : {}), // Only include if not null
        excludeTopics: userProgress?.answeredQuestions || [],
        questionNumber,
      });

      // Check for API errors (authenticatedPost will throw if there's an error, caught below)
      if (data.error) {
        setErrorMessage(`Failed to generate question: ${data.error}. Please try again.`);
        console.error('API error:', data);
        return;
      }

      if (data.question) {
        setQuestions(prev => [...prev, data.question]);
        console.log(`Question ${questionNumber} loaded`);

        // If this is the first question and we got a quizSessionId, store it
        if (questionNumber === 1 && data.quizSessionId) {
          setQuizSessionId(data.quizSessionId);
          startNewQuiz(data.quizSessionId);
          console.log('✅ Quiz session created:', data.quizSessionId);
        }
      } else {
        setErrorMessage('No question was generated. Please try again.');
      }
    } catch (error) {
      console.error('Error generating question:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else if (error instanceof Error && error.message.includes('Invalid authentication token')) {
        setErrorMessage('Your session has expired. Please sign out and sign in again to continue.');
      } else {
        setErrorMessage((error instanceof Error ? error.message : null) || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;

    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.questionType === 'multiple') {
      // Toggle selection for multiple-response questions
      setSelectedAnswers(prev =>
        prev.includes(answerIndex)
          ? prev.filter(i => i !== answerIndex)
          : [...prev, answerIndex].sort()
      );
    } else {
      // Single selection for single-choice questions
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = async () => {
    // Check if we have a quizSessionId
    if (!quizSessionId) {
      alert('Quiz session not ready. Please wait a moment and try again.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];

    let answerData: { correctAnswer: number | number[], explanation: string, incorrectExplanations: string[] } | undefined;
    if (currentQuestion.questionType === 'multiple') {
      if (selectedAnswers.length === 0) return;
      answerData = await answerQuestion(currentQuestion, selectedAnswers, quizSessionId || undefined);
    } else {
      if (selectedAnswer === null) return;
      answerData = await answerQuestion(currentQuestion, selectedAnswer, quizSessionId || undefined);
    }

    // Update the question with the returned answer data
    if (answerData && answerData.correctAnswer !== undefined) {
      setQuestions(prev => {
        const updated = [...prev];
        updated[currentQuestionIndex] = {
          ...updated[currentQuestionIndex],
          correctAnswer: answerData.correctAnswer,
          explanation: answerData.explanation,
          incorrectExplanations: answerData.incorrectExplanations,
        };
        return updated;
      });
    }

    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    // Check if we're on the last question
    if (currentQuestionIndex >= totalQuestions - 1) {
      handleEndQuiz();
      return;
    }

    // Check if next question is already generated
    if (currentQuestionIndex < questions.length - 1) {
      // Next question is ready, move to it immediately
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setSelectedAnswers([]);
      setShowExplanation(false);
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // The useEffect will automatically generate the question after next
    } else {
      // Next question is not ready yet, wait for it
      alert('Please wait, the next question is still being generated...');
    }
  };

  const handleEndQuiz = async () => {
    // Immediately set flag to stop any background generation
    setQuizEnding(true);

    try {
      console.log('Ending quiz...');
      console.log('currentQuiz:', currentQuiz);
      console.log('currentQuiz?.questions:', currentQuiz?.questions);

      // Capture quiz stats before endQuiz clears currentQuiz
      if (currentQuiz) {
        const totalAnswered = currentQuiz.questions.length;
        const correctAnswers = currentQuiz.questions.filter(q => q.isCorrect).length;
        const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
        console.log('Captured stats:', { totalAnswered, correctAnswers, accuracy });
        setQuizStats({ total: totalAnswered, correct: correctAnswers, accuracy });
      } else {
        console.error('currentQuiz is null or undefined!');
      }

      // Collect unused pre-generated questions to save for next quiz
      // Unused questions are those generated but not answered yet
      // Use answered count (not currentQuestionIndex) in case user moved to next question without answering
      const answeredCount = currentQuiz?.questions.length || 0;
      const unusedQuestions = questions.slice(answeredCount);
      console.log('Unused questions to cache:', {
        totalGenerated: questions.length,
        currentIndex: currentQuestionIndex,
        answeredCount,
        unusedCount: unusedQuestions.length
      });

      await endQuiz(unusedQuestions.length > 0 ? unusedQuestions : undefined);
      console.log('Quiz ended successfully, showing celebration...');

      // Clear both localStorage and Firebase since quiz is completed
      clearQuizFromLocalStorage();
      await deleteSavedQuiz();

      setShowCelebration(true);
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Failed to save quiz results. Please try again.');
    }
  };

  const handleCelebrationClose = () => {
    console.log('Celebration close clicked, navigating to /cybersecurity');
    setShowCelebration(false);
    setQuizStats(null);
    console.log('About to call router.push...');
    router.push('/cybersecurity');
    console.log('router.push called');
  };

  // Handle navigation warning confirmation
  const handleNavigationConfirm = () => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const handleNavigationCancel = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  // Handle home button click
  const handleHomeClick = () => {
    // Show warning modal
    setShowNavigationWarning(true);
    // Store the navigation action to execute if user confirms
    setPendingNavigation(() => () => {
      router.push('/');
    });
  };

  // Handle sign out click
  const handleSignOutClick = () => {
    // Show warning modal
    setShowNavigationWarning(true);
    // Store the navigation action to execute if user confirms
    setPendingNavigation(() => async () => {
      await handleSignOut();
      router.push('/');
    });
  };

  if (loading) {
    return (
      <AdaptiveBackground liquidGlass={liquidGlass}>
        <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
          <Header onHomeClick={handleHomeClick} onSignOutClick={handleSignOutClick} />
        </div>
        <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">

          {/* Loading spinner */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className={`${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl'} p-16 md:p-20 shadow-2xl relative`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
              )}
              <div className="relative text-center">
                {/* Animated icon */}
                <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-8">
                  {/* Outer ring */}
                  <div className={`absolute inset-0 ${liquidGlass ? 'border-4 border-white/20 rounded-full' : 'border-4 border-slate-700 rounded-full'}`}></div>
                  {/* Spinning gradient ring */}
                  <div className="absolute inset-0 animate-spin">
                    <div className={`w-full h-full rounded-full ${liquidGlass ? 'border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50' : 'border-4 border-transparent border-t-cyan-500 border-r-cyan-500/50'}`}></div>
                  </div>
                  {/* Center icon - graduation cap */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className={`w-16 h-16 md:w-20 md:h-20 ${liquidGlass ? 'text-cyan-400' : 'text-cyan-500'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                      <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                      <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                    </svg>
                  </div>
                </div>
                {/* Loading text */}
                <p className={`text-2xl md:text-3xl font-bold tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>
                  Generating first question...
                </p>
                <p className={`text-base md:text-lg mt-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                  This will take about 10 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdaptiveBackground>
    );
  }

  if (questions.length === 0) {
    return (
      <AdaptiveBackground liquidGlass={liquidGlass} colors={{ top: 'bg-red-500/10', bottom: 'bg-red-500/10' }}>
        <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
          <Header onHomeClick={handleHomeClick} onSignOutClick={handleSignOutClick} />
        </div>
        <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">

          {/* Error message */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center max-w-3xl">
              <div className={`border-2 border-red-500/50 p-16 mb-12 relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-950 rounded-md'}`}>
                {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent rounded-[40px]" />}
                {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}
                <div className="text-red-400 text-8xl md:text-9xl mb-10 relative">⚠️</div>
                <h3 className="text-4xl md:text-5xl font-bold text-red-400 mb-8 relative">Question Generation Failed</h3>
                <p className={`text-xl md:text-2xl leading-relaxed relative ${liquidGlass ? 'text-zinc-300' : 'text-zinc-200'}`}>
                  {errorMessage || 'Failed to generate questions. Please try again.'}
                </p>
              </div>
              <div className="flex gap-6 justify-center flex-wrap">
                {errorMessage?.includes('session has expired') || errorMessage?.includes('Invalid authentication') ? (
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      router.push('/');
                    }}
                    className={`px-12 py-5 font-bold text-xl ${liquidGlass ? 'bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/50 rounded-3xl text-red-300 transition-all duration-700 hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-red-500/30' : 'bg-red-900 hover:bg-red-800 text-red-200 rounded-md transition-all duration-150'}`}
                  >
                    Sign Out and Return to Login
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setErrorMessage('');
                        router.push('/cybersecurity');
                      }}
                      className={`px-12 py-5 font-bold text-xl ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl text-white transition-all duration-700 hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-white/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-all duration-150'}`}
                    >
                      Back to Cybersecurity
                    </button>
                    <button
                      onClick={() => {
                        setErrorMessage('');
                        window.location.reload();
                      }}
                      className={`px-12 py-5 font-bold text-xl ${liquidGlass ? 'bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-white transition-all duration-700 hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-white/20' : 'bg-zinc-700 hover:bg-zinc-600 text-white rounded-md transition-all duration-150'}`}
                >
                  Try Again
                </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdaptiveBackground>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Check if answer is correct
  const isCorrect = currentQuestion.questionType === 'multiple'
    ? Array.isArray(currentQuestion.correctAnswer) &&
      selectedAnswers.length === currentQuestion.correctAnswer.length &&
      selectedAnswers.every(ans => (currentQuestion.correctAnswer as number[]).includes(ans))
    : selectedAnswer === currentQuestion.correctAnswer;

  // Check if answer is partially correct (for multiple-response questions)
  const isPartiallyCorrect = currentQuestion.questionType === 'multiple' &&
    !isCorrect &&
    Array.isArray(currentQuestion.correctAnswer) &&
    selectedAnswers.some(ans => (currentQuestion.correctAnswer as number[]).includes(ans));

  // Calculate quiz stats for celebration - use captured stats if available, otherwise try currentQuiz
  const totalAnswered = quizStats?.total ?? currentQuiz?.questions.length ?? 0;
  const correctAnswers = quizStats?.correct ?? currentQuiz?.questions.filter(q => q.isCorrect).length ?? 0;
  const accuracy = quizStats?.accuracy ?? (totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0);
  const isPassing = accuracy >= 75;

  // Debug logging for celebration modal
  if (showCelebration) {
    console.log('Celebration modal stats:', {
      quizStats,
      totalAnswered,
      correctAnswers,
      accuracy,
      currentQuizExists: !!currentQuiz,
      currentQuizQuestionsLength: currentQuiz?.questions.length
    });
  }

  return (
    <AdaptiveBackground liquidGlass={liquidGlass} colors={{ top: 'bg-violet-500/10', bottom: 'bg-cyan-500/10', center: 'bg-emerald-500/5' }}>
      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${liquidGlass ? 'bg-black/80 backdrop-blur-xl' : 'bg-black/90'}`}>
          <div className={`p-8 sm:p-12 md:p-16 max-w-3xl w-full border relative ${liquidGlass ? 'bg-white/10 backdrop-blur-2xl border-white/20 rounded-[40px] shadow-2xl' : 'bg-zinc-950 border-zinc-800 rounded-md'}`}>
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent rounded-[40px]" />}
            <div className="text-center relative space-y-8">
              <div className="text-6xl mb-4">💾</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                What would you like to do?
              </h2>

              <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 leading-relaxed">
                You can save your quiz to resume later (even from a different device), end the quiz and record your progress, or stay and continue.
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={handleNavigationCancel}
                  className={`px-6 sm:px-8 py-4 sm:py-5 font-bold text-lg sm:text-xl ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl text-white transition-all duration-700 hover:scale-105 shadow-xl hover:shadow-2xl' : 'bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-all duration-150'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Save quiz to server for cross-device resume
                    const quizState = {
                      userId: user?.uid,
                      quizSessionId,
                      questions,
                      currentQuestionIndex,
                      selectedAnswer,
                      selectedAnswers,
                      showExplanation,
                      currentQuiz: currentQuiz ? {
                        id: currentQuiz.id,
                        startedAt: currentQuiz.startedAt,
                        questions: currentQuiz.questions,
                        score: currentQuiz.score,
                        totalPoints: currentQuiz.totalPoints,
                        maxPoints: currentQuiz.maxPoints,
                        completed: currentQuiz.completed,
                        quizSessionId: currentQuiz.quizSessionId,
                      } : null,
                      savedAt: Date.now(),
                    };

                    const saved = await saveQuizToServer(quizState);
                    if (saved) {
                      console.log('Quiz saved to server before navigation');
                    } else {
                      console.error('Failed to save quiz to server');
                    }

                    // Also save to localStorage as backup
                    saveQuizToLocalStorage();

                    // Execute the pending navigation
                    handleNavigationConfirm();
                  }}
                  className={`px-6 sm:px-8 py-4 sm:py-5 font-bold text-lg sm:text-xl ${liquidGlass ? 'bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-xl border border-blue-500/50 rounded-3xl text-blue-300 transition-all duration-700 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30' : 'bg-blue-900 hover:bg-blue-800 text-blue-200 rounded-md transition-all duration-150'}`}
                >
                  Save & Leave
                </button>
                <button
                  onClick={async () => {
                    // End the quiz and record progress
                    setShowNavigationWarning(false);

                    // Get unused questions to record in performance
                    const unusedQuestions = questions.slice(currentQuestionIndex + 1);

                    // End quiz (this will record progress)
                    await endQuiz(unusedQuestions.length > 0 ? unusedQuestions : undefined);
                    console.log('Quiz ended, progress recorded');

                    // Clear both storages since quiz is ended
                    clearQuizFromLocalStorage();
                    await deleteSavedQuiz();

                    // Execute the pending navigation
                    if (pendingNavigation) {
                      pendingNavigation();
                      setPendingNavigation(null);
                    }
                  }}
                  className={`px-6 sm:px-8 py-4 sm:py-5 font-bold text-lg sm:text-xl ${liquidGlass ? 'bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/50 rounded-3xl text-red-300 transition-all duration-700 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-red-500/30' : 'bg-red-900 hover:bg-red-800 text-red-200 rounded-md transition-all duration-150'}`}
                >
                  End Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto ${liquidGlass ? 'bg-black/80 backdrop-blur-xl' : 'bg-black/90'}`}>
          <div className={`p-8 sm:p-12 md:p-16 max-w-2xl w-full my-auto border relative ${liquidGlass ? 'bg-white/10 backdrop-blur-2xl border-white/20 rounded-[40px] shadow-2xl' : 'bg-zinc-950 border-zinc-800 rounded-md'}`}>
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}
            {liquidGlass && isPassing && <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent rounded-[40px]" />}
            {liquidGlass && !isPassing && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent rounded-[40px]" />}
            <div className="text-center relative space-y-8">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                Quiz Complete!
              </h2>

              <div className="space-y-4">
                <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-white">
                  {correctAnswers}/{totalAnswered}
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl text-zinc-200 font-bold">{accuracy}% Accuracy</div>
              </div>

              {isPassing ? (
                <div className={`border-2 border-green-500/50 p-6 sm:p-8 relative ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl' : 'bg-zinc-900 rounded-md'}`}>
                  {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent rounded-3xl" />}
                  <p className="text-green-400 font-bold text-xl sm:text-2xl md:text-3xl mb-3 relative">Great Job!</p>
                  <p className="text-zinc-200 text-lg sm:text-xl md:text-2xl leading-relaxed relative">
                    You&apos;re showing strong understanding of Security+ concepts. Keep up the excellent work!
                  </p>
                </div>
              ) : (
                <div className={`border-2 border-yellow-500/50 p-6 sm:p-8 relative ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl' : 'bg-zinc-900 rounded-md'}`}>
                  {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent rounded-3xl" />}
                  <p className="text-yellow-400 font-bold text-xl sm:text-2xl md:text-3xl mb-3 relative">Keep Practicing!</p>
                  <p className="text-zinc-200 text-lg sm:text-xl md:text-2xl leading-relaxed relative">
                    Review the explanations and try again. Each quiz helps you improve!
                  </p>
                </div>
              )}

              <div className="space-y-2 text-lg sm:text-xl md:text-2xl text-zinc-300">
                <p>✓ Progress saved to your account</p>
                <p>✓ IRT score updated</p>
                <p>✓ Predicted exam score recalculated</p>
              </div>

              <button
                onClick={handleCelebrationClose}
                className={`w-full font-bold py-5 text-xl sm:text-2xl ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl text-white transition-all duration-700 hover:scale-105 shadow-xl hover:shadow-2xl' : 'bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-all duration-150'}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header onHomeClick={handleHomeClick} onSignOutClick={handleSignOutClick} />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        {/* Question Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </h1>
          {generatingNext && (
            <div className="text-lg md:text-xl text-zinc-400 mt-4 flex items-center gap-3 font-medium">
              <div className={`animate-spin rounded-xl h-6 w-6 border-2 ${liquidGlass ? 'border-white/10 border-t-violet-400/80' : 'border-zinc-700 border-t-zinc-400'}`}></div>
              Generating next question...
            </div>
          )}
          <div className="text-lg md:text-xl text-zinc-400 mt-3">
            {questions.length} question{questions.length !== 1 ? 's' : ''} generated so far
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-16">
          <div className={`w-full h-6 relative overflow-hidden ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl' : 'bg-zinc-900 rounded-md'}`}>
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl" />}
            <div
              className={`h-6 relative transition-all duration-700 ${liquidGlass ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 rounded-2xl' : 'bg-zinc-700 rounded-md'}`}
              style={{ width: `${progress}%` }}
            >
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" />}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="mb-16">
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            showExplanation={showExplanation}
            selectedAnswer={currentQuestion.questionType === 'single' ? selectedAnswer : null}
            selectedAnswers={currentQuestion.questionType === 'multiple' ? selectedAnswers : []}
            liquidGlass={liquidGlass}
            onAnswerSelect={handleAnswerSelect}
          />

          {/* Submit Button */}
          {!showExplanation && (
            <button
              id="submit-answer"
              onClick={handleSubmitAnswer}
              disabled={
                currentQuestion.questionType === 'multiple'
                  ? selectedAnswers.length === 0
                  : selectedAnswer === null
              }
              className={`relative w-full mt-12 py-6 md:py-7 font-bold text-2xl md:text-3xl transition-all duration-700 ${
                (currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null)
                  ? liquidGlass
                    ? 'bg-white/5 backdrop-blur-xl border border-white/10 text-zinc-500 cursor-not-allowed rounded-3xl'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed rounded-md'
                  : liquidGlass
                    ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 hover:border-violet-400/50 text-white rounded-3xl hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-violet-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white rounded-md'
              }`}
            >
              {liquidGlass && !(currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null) && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-700" />
              )}
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />}
              <span className="relative">Submit Answer</span>
            </button>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="space-y-20 mb-16">
            {/* Question Number Header */}
            <div className="flex items-center gap-5">
              <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-white font-bold text-2xl md:text-3xl relative ${liquidGlass ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl' : 'bg-zinc-800 border-2 border-zinc-700 rounded-md'}`}>
                {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl" />}
                <span className="relative">{currentQuestionIndex + 1}</span>
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Question {currentQuestionIndex + 1}</h3>
            </div>

            <ExplanationSection
              question={currentQuestion}
              isCorrect={isCorrect}
              isPartiallyCorrect={isPartiallyCorrect}
              liquidGlass={liquidGlass}
            />

            <QuestionMetadata
              question={currentQuestion}
              liquidGlass={liquidGlass}
              pointsEarned={currentQuiz?.questions[currentQuestionIndex]?.pointsEarned}
              maxPoints={currentQuiz?.questions[currentQuestionIndex]?.maxPoints}
            />

            {/* Next Button */}
            <button
              id="next"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1}
              className={`relative w-full py-6 md:py-7 font-bold text-2xl md:text-3xl transition-all duration-700 ${
                currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? liquidGlass
                    ? 'bg-white/5 backdrop-blur-xl border border-white/10 cursor-not-allowed text-zinc-500 rounded-3xl'
                    : 'bg-zinc-800 cursor-not-allowed text-zinc-500 rounded-md'
                  : liquidGlass
                    ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 hover:border-cyan-400/50 text-white rounded-3xl hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white rounded-md'
              }`}
            >
              {liquidGlass && !(currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1) && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-700" />
              )}
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />}
              <span className="relative">
                {currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? 'Generating next question...'
                  : currentQuestionIndex < totalQuestions - 1
                  ? 'Next Question'
                  : 'Finish Quiz'}
              </span>
            </button>
          </div>
        )}

        {/* End Quiz Button */}
        <div className="mt-20 text-center">
          <button
            id="end-quiz"
            onClick={handleEndQuiz}
            className={`relative px-16 md:px-20 py-6 md:py-7 font-bold text-xl md:text-2xl transition-all duration-700 ${liquidGlass ? 'bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/50 hover:border-red-500/80 text-red-300 hover:text-red-200 rounded-3xl hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-red-500/30' : 'bg-red-900 hover:bg-red-800 text-white rounded-md'}`}
          >
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-700" />}
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />}
            <span className="relative">End Quiz</span>
          </button>
        </div>
      </div>
    </AdaptiveBackground>
  );
}
