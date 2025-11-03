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

  // Multi-step workflow states
  const [showConfidenceSelection, setShowConfidenceSelection] = useState(true);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [reflection, setReflection] = useState<string | null>(null);

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
  const [generationPaused, setGenerationPaused] = useState(false);

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
    // Don't generate if quiz has ended, is ending, or generation is paused
    if (!loading && !showCelebration && !quizEnding && !generationPaused && questions.length > 0 && questions.length < totalQuestions && !generatingNext) {
      // Generate the next question immediately after the current one is added
      console.log(`Auto-generating question ${questions.length + 1} in background...`);
      setGeneratingNext(true);
      generateNextQuestion().then(() => {
        setGeneratingNext(false);
      });
    }
  }, [loading, showCelebration, quizEnding, generationPaused, questions.length, generatingNext]); // Watch generationPaused to stop/resume generation

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

        // Log difficulty distribution for current quiz
        const distribution = {
          easy: questions.filter(q => q.questionCategory === 'single-domain-single-topic').length,
          medium: questions.filter(q => q.questionCategory === 'single-domain-multiple-topics').length,
          hard: questions.filter(q => q.questionCategory === 'multiple-domains-multiple-topics').length,
        };
        const isCorrect = distribution.easy === 3 && distribution.medium === 4 && distribution.hard === 3;
        console.log(
          `${isCorrect ? '✅' : '⚠️'} [CURRENT QUIZ DISTRIBUTION] ${distribution.easy} easy, ${distribution.medium} medium, ${distribution.hard} hard (Expected: 3/4/3)`
        );

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

  const handleConfidenceSelect = (confidenceLevel: number) => {
    setConfidence(confidenceLevel);
    // Automatically show options after confidence is selected
    setShowConfidenceSelection(false);
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

  const handleReflectionSelect = (reflectionChoice: string) => {
    setReflection(reflectionChoice);

    // TODO: Save confidence and reflection data to database for Dunning-Kruger tracking
    console.log('Confidence:', confidence, 'Reflection:', reflectionChoice);
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
      // Reset multi-step workflow for next question
      setShowConfidenceSelection(true);
      setConfidence(null);
      setReflection(null);
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // The useEffect will automatically generate the question after next
    } else {
      // Next question is not ready yet, wait for it
      alert('Please wait, the next question is still being generated...');
    }
  };

  /**
   * Shared function to end quiz - handles all cleanup consistently
   * @param showCelebrationScreen - Whether to show celebration (false when navigating away)
   * @param onComplete - Optional callback to run after quiz ends (e.g., navigation)
   */
  const performEndQuiz = async (showCelebrationScreen: boolean = true, onComplete?: () => void) => {
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
      console.log('Quiz ended successfully');

      // Clear both localStorage and Firebase since quiz is completed
      clearQuizFromLocalStorage();
      await deleteSavedQuiz();

      if (showCelebrationScreen) {
        setShowCelebration(true);
      }

      // Execute callback if provided (e.g., navigation)
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Failed to save quiz results. Please try again.');
    }
  };

  // Wrapper for normal "End Quiz" button - shows celebration
  const handleEndQuiz = async () => {
    await performEndQuiz(true);
  };

  const handleCelebrationClose = () => {
    console.log('Celebration close clicked, navigating to /cybersecurity/quiz');
    // Use window.location.href for guaranteed navigation
    window.location.href = '/cybersecurity/quiz';
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
      <div className="loading-screen">
        <div className="header-container">
          <Header onHomeClick={handleHomeClick} onSignOutClick={handleSignOutClick} />
        </div>
        <div className="content-container">
          <div className="loading-wrapper">
            <div className="loading-card">
              <div className="loading-icon-container">
                <div className="loading-icon-outer-ring"></div>
                <div className="loading-icon-spinner">
                  <div className="loading-icon-spinner-ring"></div>
                </div>
                <div className="loading-icon-center">
                  <svg className="graduation-cap-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              <p className="loading-text-primary">Generating first question...</p>
              <p className="loading-text-secondary">This will take about 10 seconds</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            background: #0f0f0f;
          }

          .header-container {
            padding: 24px 0 16px;
          }

          @media (min-width: 768px) {
            .header-container {
              padding: 32px 0 24px;
            }
          }

          .content-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 24px;
          }

          @media (min-width: 640px) {
            .content-container {
              padding: 0 32px;
            }
          }

          @media (min-width: 1024px) {
            .content-container {
              padding: 0 48px;
            }
          }

          .loading-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 200px);
          }

          .loading-card {
            background: #0f0f0f;
            padding: 64px;
            border-radius: 24px;
            box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
            text-align: center;
          }

          @media (min-width: 768px) {
            .loading-card {
              padding: 80px;
            }
          }

          .loading-icon-container {
            position: relative;
            width: 128px;
            height: 128px;
            margin: 0 auto 32px;
          }

          @media (min-width: 768px) {
            .loading-icon-container {
              width: 160px;
              height: 160px;
            }
          }

          .loading-icon-outer-ring {
            position: absolute;
            inset: 0;
            border: 4px solid #1a1a1a;
            border-radius: 50%;
          }

          .loading-icon-spinner {
            position: absolute;
            inset: 0;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-icon-spinner-ring {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: #06b6d4;
            border-right-color: rgba(6, 182, 212, 0.5);
          }

          .loading-icon-center {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .graduation-cap-icon {
            width: 64px;
            height: 64px;
            color: #06b6d4;
          }

          @media (min-width: 768px) {
            .graduation-cap-icon {
              width: 80px;
              height: 80px;
            }
          }

          .loading-text-primary {
            font-size: 24px;
            font-weight: 700;
            color: #e5e5e5;
            margin: 0;
          }

          @media (min-width: 768px) {
            .loading-text-primary {
              font-size: 30px;
            }
          }

          .loading-text-secondary {
            font-size: 16px;
            color: #a8a8a8;
            margin-top: 16px;
          }

          @media (min-width: 768px) {
            .loading-text-secondary {
              font-size: 18px;
            }
          }
        `}</style>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="error-screen">
        <div className="header-container">
          <Header onHomeClick={handleHomeClick} onSignOutClick={handleSignOutClick} />
        </div>
        <div className="content-container">
          <div className="error-wrapper">
            <div className="error-content">
              <div className="error-card">
                <div className="error-icon">⚠️</div>
                <h3 className="error-title">Question Generation Failed</h3>
                <p className="error-message">
                  {errorMessage || 'Failed to generate questions. Please try again.'}
                </p>
              </div>
              <div className="error-actions">
                {errorMessage?.includes('session has expired') || errorMessage?.includes('Invalid authentication') ? (
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      router.push('/');
                    }}
                    className="error-button error-button-signout"
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
                      className="error-button error-button-back"
                    >
                      Back to Cybersecurity
                    </button>
                    <button
                      onClick={() => {
                        setErrorMessage('');
                        window.location.reload();
                      }}
                      className="error-button error-button-retry"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .error-screen {
            min-height: 100vh;
            background: #0f0f0f;
          }

          .header-container {
            padding: 24px 0 16px;
          }

          @media (min-width: 768px) {
            .header-container {
              padding: 32px 0 24px;
            }
          }

          .content-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 24px;
          }

          @media (min-width: 640px) {
            .content-container {
              padding: 0 32px;
            }
          }

          @media (min-width: 1024px) {
            .content-container {
              padding: 0 48px;
            }
          }

          .error-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 200px);
          }

          .error-content {
            text-align: center;
            max-width: 768px;
          }

          .error-card {
            background: #0f0f0f;
            padding: 64px;
            margin-bottom: 48px;
            border-radius: 24px;
            box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
            border: 2px solid rgba(239, 68, 68, 0.3);
          }

          .error-icon {
            font-size: 96px;
            margin-bottom: 40px;
          }

          @media (min-width: 768px) {
            .error-icon {
              font-size: 112px;
            }
          }

          .error-title {
            font-size: 36px;
            font-weight: 700;
            color: #f87171;
            margin: 0 0 32px;
          }

          @media (min-width: 768px) {
            .error-title {
              font-size: 48px;
            }
          }

          .error-message {
            font-size: 20px;
            color: #e5e5e5;
            line-height: 1.6;
            margin: 0;
          }

          @media (min-width: 768px) {
            .error-message {
              font-size: 24px;
            }
          }

          .error-actions {
            display: flex;
            gap: 24px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .error-button {
            padding: 20px 48px;
            font-size: 20px;
            font-weight: 700;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .error-button-signout {
            background: #0f0f0f;
            color: #f87171;
            box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          }

          .error-button-signout:hover {
            box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
            transform: translateY(2px);
          }

          .error-button-back {
            background: #0f0f0f;
            color: #e5e5e5;
            box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          }

          .error-button-back:hover {
            box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
            transform: translateY(2px);
          }

          .error-button-retry {
            background: #0f0f0f;
            color: #e5e5e5;
            box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          }

          .error-button-retry:hover {
            box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
            transform: translateY(2px);
          }
        `}</style>
      </div>
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
    <div className="quiz-page">
      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="modal-overlay">
          <div className="modal-card modal-navigation">
            <div className="modal-content">
              <div className="modal-icon">💾</div>
              <h2 className="modal-title">What would you like to do?</h2>
              <p className="modal-description">
                You can save your quiz to resume later (even from a different device), end the quiz and record your progress, or stay and continue.
              </p>
              <div className="modal-actions">
                <button onClick={handleNavigationCancel} className="modal-button modal-button-cancel">
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
                  className="modal-button modal-button-save"
                >
                  Save & Leave
                </button>
                <button
                  onClick={async () => {
                    setShowNavigationWarning(false);

                    // End quiz and execute pending navigation
                    await performEndQuiz(false, () => {
                      if (pendingNavigation) {
                        pendingNavigation();
                        setPendingNavigation(null);
                      }
                    });
                  }}
                  className="modal-button modal-button-end"
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
        <div className="modal-overlay">
          <div className={`modal-card modal-celebration ${isPassing ? 'modal-celebration-pass' : 'modal-celebration-fail'}`}>
            <div className="modal-content">
              <h2 className="modal-title celebration-title">Quiz Complete!</h2>
              <div className="celebration-stats">
                <div className="celebration-score">{correctAnswers}/{totalAnswered}</div>
                <div className="celebration-accuracy">{accuracy}% Accuracy</div>
              </div>
              {isPassing ? (
                <div className="celebration-feedback celebration-feedback-pass">
                  <p className="celebration-feedback-title">Great Job!</p>
                  <p className="celebration-feedback-text">
                    You&apos;re showing strong understanding of Security+ concepts. Keep up the excellent work!
                  </p>
                </div>
              ) : (
                <div className="celebration-feedback celebration-feedback-fail">
                  <p className="celebration-feedback-title">Keep Practicing!</p>
                  <p className="celebration-feedback-text">
                    Review the explanations and try again. Each quiz helps you improve!
                  </p>
                </div>
              )}
              <div className="celebration-info">
                <p>✓ Progress saved to your account</p>
                <p>✓ IRT score updated</p>
                <p>✓ Predicted exam score recalculated</p>
              </div>
              <button onClick={handleCelebrationClose} className="modal-button modal-button-done">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header-container">
        <Header onHomeClick={handleHomeClick} onSignOutClick={handleSignOutClick} />
      </div>

      <div className="content-container">
        {/* Question Header */}
        <div className="question-header">
          <div className="question-title-row">
            <h1 className="question-title">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </h1>
            {/* Pause/Resume Button - Only show if not all questions generated */}
            {questions.length < totalQuestions && (
              <button
                onClick={() => setGenerationPaused(!generationPaused)}
                className="generation-control-button"
                title={generationPaused ? 'Resume generating questions' : 'Pause question generation'}
              >
                {generationPaused ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3 2l10 6-10 6V2z"/>
                    </svg>
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 2h3v12H4V2zm5 0h3v12H9V2z"/>
                    </svg>
                    <span>Pause</span>
                  </>
                )}
              </button>
            )}
          </div>
          {generatingNext && !generationPaused && (
            <div className="generating-indicator">
              <div className="generating-spinner"></div>
              Generating next question...
            </div>
          )}
          {generationPaused && questions.length < totalQuestions && (
            <div className="generation-paused-indicator">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1a5 5 0 110 10A5 5 0 018 3zm-1 2h2v4H7V5z"/>
              </svg>
              Question generation paused
            </div>
          )}
          <div className="questions-count">
            {questions.length} question{questions.length !== 1 ? 's' : ''} generated so far
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="question-section">
          {/* Always show the question text */}
          <div className="question-text-container">
            <h2 className="question-text-title">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Step 1: Confidence Selection (shown first, before options) */}
          {showConfidenceSelection && !showExplanation && (
            <div className="confidence-selection-container">
              <div className="confidence-card">
                <h3 className="confidence-title">How confident are you?</h3>
                <p className="confidence-subtitle">Select your confidence level before seeing the options</p>

                <div className="confidence-options">
                  <button
                    onClick={() => handleConfidenceSelect(20)}
                    className="confidence-option"
                  >
                    <div className="confidence-option-label">Not confident (guessing)</div>
                    <div className="confidence-option-percentage">~20% chance I&apos;m right</div>
                  </button>

                  <button
                    onClick={() => handleConfidenceSelect(40)}
                    className="confidence-option"
                  >
                    <div className="confidence-option-label">Slightly confident</div>
                    <div className="confidence-option-percentage">~40% chance I&apos;m right</div>
                  </button>

                  <button
                    onClick={() => handleConfidenceSelect(60)}
                    className="confidence-option"
                  >
                    <div className="confidence-option-label">Moderately confident</div>
                    <div className="confidence-option-percentage">~60% chance I&apos;m right</div>
                  </button>

                  <button
                    onClick={() => handleConfidenceSelect(80)}
                    className="confidence-option"
                  >
                    <div className="confidence-option-label">Confident</div>
                    <div className="confidence-option-percentage">~80% chance I&apos;m right</div>
                  </button>

                  <button
                    onClick={() => handleConfidenceSelect(95)}
                    className="confidence-option"
                  >
                    <div className="confidence-option-label">Very confident (almost certain)</div>
                    <div className="confidence-option-percentage">~95% chance I&apos;m right</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Answer Options (shown after confidence selected) */}
          {!showConfidenceSelection && !showExplanation && (
            <>
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                showExplanation={showExplanation}
                selectedAnswer={currentQuestion.questionType === 'single' ? selectedAnswer : null}
                selectedAnswers={currentQuestion.questionType === 'multiple' ? selectedAnswers : []}
                onAnswerSelect={handleAnswerSelect}
              />

              {/* Submit Button */}
              <button
                id="submit-answer"
                onClick={handleSubmitAnswer}
                disabled={
                  currentQuestion.questionType === 'multiple'
                    ? selectedAnswers.length === 0
                    : selectedAnswer === null
                }
                className={`submit-button ${
                  (currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null)
                    ? 'submit-button-disabled'
                    : 'submit-button-enabled'
                }`}
              >
                Submit Answer
              </button>
            </>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="explanation-container">
            {/* Question Number Header */}
            <div className="explanation-header">
              <div className="explanation-badge">
                <span>{currentQuestionIndex + 1}</span>
              </div>
              <h3 className="explanation-title">Question {currentQuestionIndex + 1}</h3>
            </div>

            <ExplanationSection
              question={currentQuestion}
              isCorrect={isCorrect}
              isPartiallyCorrect={isPartiallyCorrect}
              selectedAnswer={currentQuestion.questionType === 'single' ? selectedAnswer : null}
              selectedAnswers={currentQuestion.questionType === 'multiple' ? selectedAnswers : []}
            />

            <QuestionMetadata
              question={currentQuestion}
              pointsEarned={currentQuiz?.questions[currentQuestionIndex]?.pointsEarned}
              maxPoints={currentQuiz?.questions[currentQuestionIndex]?.maxPoints}
            />

            {/* Step 3: Reflection (shown after explanation) */}
            {reflection === null && (
              <div className="reflection-card">
                <h3 className="reflection-title">How did you arrive at your answer?</h3>
                <p className="reflection-subtitle">Select one option, then click Next</p>

                <div className="reflection-options">
                  <button
                    onClick={() => handleReflectionSelect('knew')}
                    className="reflection-option"
                  >
                    I knew the answer from memory before seeing the options
                  </button>

                  <button
                    onClick={() => handleReflectionSelect('recognized')}
                    className="reflection-option"
                  >
                    I wasn&apos;t sure, but recognized the right answer in the options
                  </button>

                  <button
                    onClick={() => handleReflectionSelect('narrowed')}
                    className="reflection-option"
                  >
                    I narrowed it down and made an educated guess
                  </button>

                  <button
                    onClick={() => handleReflectionSelect('guessed')}
                    className="reflection-option"
                  >
                    I guessed randomly
                  </button>
                </div>
              </div>
            )}

            {/* Next Button - shown after reflection is selected */}
            {reflection !== null && (
              <button
                id="next"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1}
                className={`next-button ${
                  currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                    ? 'next-button-disabled'
                    : 'next-button-enabled'
                }`}
              >
                {currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? 'Generating next question...'
                  : currentQuestionIndex < totalQuestions - 1
                  ? 'Next Question'
                  : 'Finish Quiz'}
              </button>
            )}
          </div>
        )}

        {/* End Quiz Button */}
        <div className="end-quiz-container">
          <button id="end-quiz" onClick={handleEndQuiz} className="end-quiz-button">
            End Quiz
          </button>
        </div>
      </div>

      <style jsx>{`
        .quiz-page {
          min-height: 100vh;
          background: #0f0f0f;
        }

        .header-container {
          padding: 24px 0 16px;
        }

        @media (min-width: 768px) {
          .header-container {
            padding: 32px 0 24px;
          }
        }

        .content-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px 80px 24px;
        }

        @media (min-width: 640px) {
          .content-container {
            padding: 0 32px 80px 32px;
          }
        }

        @media (min-width: 1024px) {
          .content-container {
            padding: 0 48px 80px 48px;
          }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
          background: rgba(0, 0, 0, 0.9);
        }

        .modal-card {
          background: #0f0f0f;
          padding: 48px;
          max-width: 768px;
          width: 100%;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
        }

        @media (min-width: 640px) {
          .modal-card {
            padding: 48px;
          }
        }

        @media (min-width: 768px) {
          .modal-card {
            padding: 64px;
          }
        }

        .modal-content {
          text-align: center;
        }

        .modal-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .modal-title {
          font-size: 36px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0 0 32px;
        }

        @media (min-width: 640px) {
          .modal-title {
            font-size: 42px;
          }
        }

        @media (min-width: 768px) {
          .modal-title {
            font-size: 48px;
          }
        }

        .modal-description {
          font-size: 18px;
          color: #a8a8a8;
          line-height: 1.6;
          margin: 0 0 32px;
        }

        @media (min-width: 640px) {
          .modal-description {
            font-size: 20px;
          }
        }

        @media (min-width: 768px) {
          .modal-description {
            font-size: 24px;
          }
        }

        .modal-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .modal-button {
          padding: 16px 24px;
          font-size: 18px;
          font-weight: 700;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        @media (min-width: 640px) {
          .modal-button {
            padding: 20px 32px;
            font-size: 18px;
          }
        }

        @media (min-width: 768px) {
          .modal-button {
            font-size: 20px;
          }
        }

        .modal-button-cancel {
          background: #0f0f0f;
          color: #e5e5e5;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .modal-button-cancel:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(2px);
        }

        .modal-button-save {
          background: #0f0f0f;
          color: #60a5fa;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .modal-button-save:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(2px);
        }

        .modal-button-end {
          background: #0f0f0f;
          color: #f87171;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .modal-button-end:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(2px);
        }

        .modal-button-done {
          width: 100%;
          padding: 20px;
          font-size: 20px;
          background: #0f0f0f;
          color: #e5e5e5;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        @media (min-width: 640px) {
          .modal-button-done {
            font-size: 24px;
          }
        }

        .modal-button-done:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(2px);
        }

        /* Celebration Modal */
        .celebration-title {
          font-size: 42px;
          margin-bottom: 32px;
        }

        @media (min-width: 640px) {
          .celebration-title {
            font-size: 48px;
          }
        }

        @media (min-width: 768px) {
          .celebration-title {
            font-size: 60px;
          }
        }

        .celebration-stats {
          margin-bottom: 32px;
        }

        .celebration-score {
          font-size: 64px;
          font-weight: 700;
          color: #e5e5e5;
          margin-bottom: 16px;
        }

        @media (min-width: 640px) {
          .celebration-score {
            font-size: 72px;
          }
        }

        @media (min-width: 768px) {
          .celebration-score {
            font-size: 96px;
          }
        }

        .celebration-accuracy {
          font-size: 24px;
          font-weight: 700;
          color: #e5e5e5;
        }

        @media (min-width: 640px) {
          .celebration-accuracy {
            font-size: 30px;
          }
        }

        @media (min-width: 768px) {
          .celebration-accuracy {
            font-size: 36px;
          }
        }

        .celebration-feedback {
          background: #0f0f0f;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 32px;
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        @media (min-width: 640px) {
          .celebration-feedback {
            padding: 32px;
          }
        }

        .celebration-feedback-pass {
          border: 2px solid rgba(16, 185, 129, 0.3);
        }

        .celebration-feedback-fail {
          border: 2px solid rgba(234, 179, 8, 0.3);
        }

        .celebration-feedback-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 12px;
        }

        @media (min-width: 640px) {
          .celebration-feedback-title {
            font-size: 24px;
          }
        }

        @media (min-width: 768px) {
          .celebration-feedback-title {
            font-size: 30px;
          }
        }

        .celebration-feedback-pass .celebration-feedback-title {
          color: #10b981;
        }

        .celebration-feedback-fail .celebration-feedback-title {
          color: #eab308;
        }

        .celebration-feedback-text {
          font-size: 18px;
          color: #e5e5e5;
          line-height: 1.6;
          margin: 0;
        }

        @media (min-width: 640px) {
          .celebration-feedback-text {
            font-size: 20px;
          }
        }

        @media (min-width: 768px) {
          .celebration-feedback-text {
            font-size: 24px;
          }
        }

        .celebration-info {
          font-size: 18px;
          color: #a8a8a8;
          margin-bottom: 32px;
        }

        @media (min-width: 640px) {
          .celebration-info {
            font-size: 20px;
          }
        }

        @media (min-width: 768px) {
          .celebration-info {
            font-size: 24px;
          }
        }

        .celebration-info p {
          margin: 8px 0;
        }

        /* Question Header */
        .question-header {
          margin-bottom: 32px;
        }

        @media (min-width: 768px) {
          .question-header {
            margin-bottom: 48px;
          }
        }

        .question-title {
          font-size: 48px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0 0 16px;
        }

        @media (min-width: 640px) {
          .question-title {
            font-size: 56px;
          }
        }

        @media (min-width: 768px) {
          .question-title {
            font-size: 64px;
          }
        }

        .generating-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          color: #a8a8a8;
          font-weight: 500;
          margin-top: 16px;
        }

        @media (min-width: 768px) {
          .generating-indicator {
            font-size: 20px;
          }
        }

        .generating-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #1a1a1a;
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .questions-count {
          font-size: 18px;
          color: #a8a8a8;
          margin-top: 12px;
        }

        @media (min-width: 768px) {
          .questions-count {
            font-size: 20px;
          }
        }

        /* Question Title Row */
        .question-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Generation Control Button */
        .generation-control-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #0f0f0f;
          color: #e5e5e5;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .generation-control-button:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(1px);
        }

        .generation-control-button:active {
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
          transform: translateY(2px);
        }

        .generation-control-button svg {
          flex-shrink: 0;
        }

        /* Generation Paused Indicator */
        .generation-paused-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          color: #f59e0b;
          font-weight: 500;
          margin-top: 16px;
        }

        @media (min-width: 768px) {
          .generation-paused-indicator {
            font-size: 20px;
          }
        }

        /* Progress Bar */
        .progress-container {
          margin-bottom: 64px;
        }

        .progress-bar {
          width: 100%;
          height: 24px;
          background: #0f0f0f;
          border-radius: 12px;
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #8b5cf6 100%);
          border-radius: 12px;
          transition: width 0.7s ease;
        }

        /* Question Section */
        .question-section {
          margin-bottom: 64px;
        }

        /* Question Text Container (always visible) */
        .question-text-container {
          background: #0f0f0f;
          padding: 48px;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          margin-bottom: 48px;
        }

        @media (min-width: 768px) {
          .question-text-container {
            padding: 64px;
          }
        }

        .question-text-title {
          font-size: 24px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0;
          line-height: 1.4;
        }

        @media (min-width: 768px) {
          .question-text-title {
            font-size: 28px;
          }
        }

        /* Confidence Selection Styles */
        .confidence-selection-container {
          margin-bottom: 48px;
        }

        .confidence-card {
          background: #0f0f0f;
          padding: 48px;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
        }

        @media (min-width: 768px) {
          .confidence-card {
            padding: 64px;
          }
        }

        .confidence-title {
          font-size: 24px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0 0 16px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .confidence-title {
            font-size: 28px;
          }
        }

        .confidence-subtitle {
          font-size: 16px;
          color: #a8a8a8;
          margin: 0 0 32px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .confidence-subtitle {
            font-size: 18px;
          }
        }

        .confidence-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .confidence-option {
          width: 100%;
          padding: 24px;
          background: #0f0f0f;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .confidence-option:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(1px);
        }

        .confidence-option-label {
          font-size: 18px;
          font-weight: 600;
          color: #e5e5e5;
          margin-bottom: 8px;
        }

        @media (min-width: 768px) {
          .confidence-option-label {
            font-size: 20px;
          }
        }

        .confidence-option-percentage {
          font-size: 16px;
          color: #a8a8a8;
        }

        @media (min-width: 768px) {
          .confidence-option-percentage {
            font-size: 18px;
          }
        }

        /* Reflection Styles (shown within explanation container) */
        .reflection-card {
          background: #0f0f0f;
          padding: 48px;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          margin-top: 64px;
        }

        @media (min-width: 768px) {
          .reflection-card {
            padding: 64px;
          }
        }

        .reflection-title {
          font-size: 24px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0 0 16px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .reflection-title {
            font-size: 28px;
          }
        }

        .reflection-subtitle {
          font-size: 16px;
          color: #a8a8a8;
          margin: 0 0 32px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .reflection-subtitle {
            font-size: 18px;
          }
        }

        .reflection-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .reflection-option {
          width: 100%;
          padding: 24px;
          background: #0f0f0f;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          font-size: 18px;
          color: #e5e5e5;
          line-height: 1.6;
        }

        @media (min-width: 768px) {
          .reflection-option {
            font-size: 20px;
          }
        }

        .reflection-option:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(1px);
        }

        .submit-button {
          width: 100%;
          margin-top: 48px;
          padding: 24px;
          font-size: 24px;
          font-weight: 700;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        @media (min-width: 768px) {
          .submit-button {
            padding: 28px;
            font-size: 30px;
          }
        }

        .submit-button-disabled {
          background: #0f0f0f;
          color: #666666;
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
          cursor: not-allowed;
        }

        .submit-button-enabled {
          background: #0f0f0f;
          color: #8b5cf6;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .submit-button-enabled:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(2px);
        }

        /* Explanation Section */
        .explanation-container {
          margin-bottom: 64px;
        }

        .explanation-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 80px;
        }

        .explanation-badge {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f0f0f;
          color: #e5e5e5;
          font-size: 24px;
          font-weight: 700;
          border-radius: 12px;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        @media (min-width: 768px) {
          .explanation-badge {
            width: 80px;
            height: 80px;
            font-size: 30px;
          }
        }

        .explanation-title {
          font-size: 30px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0;
        }

        @media (min-width: 768px) {
          .explanation-title {
            font-size: 36px;
          }
        }

        @media (min-width: 1024px) {
          .explanation-title {
            font-size: 48px;
          }
        }

        .next-button {
          width: 100%;
          padding: 24px;
          font-size: 24px;
          font-weight: 700;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 80px;
        }

        @media (min-width: 768px) {
          .next-button {
            padding: 28px;
            font-size: 30px;
          }
        }

        .next-button-disabled {
          background: #0f0f0f;
          color: #666666;
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
          cursor: not-allowed;
        }

        .next-button-enabled {
          background: #0f0f0f;
          color: #06b6d4;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .next-button-enabled:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(2px);
        }

        /* End Quiz Button */
        .end-quiz-container {
          margin-top: 80px;
          text-align: center;
        }

        .end-quiz-button {
          padding: 24px 64px;
          font-size: 20px;
          font-weight: 700;
          background: #0f0f0f;
          color: #f43f5e;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          transition: all 0.3s ease;
        }

        @media (min-width: 768px) {
          .end-quiz-button {
            padding: 28px 80px;
            font-size: 24px;
          }
        }

        .end-quiz-button:hover {
          box-shadow: 4px 4px 8px #050505, -4px -4px 8px #191919;
          transform: translateY(2px);
        }
      `}</style>
    </div>
  );
}
