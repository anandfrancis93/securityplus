'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { Question } from '@/lib/types';
import { getDomainFromTopics } from '@/lib/domainDetection';

export default function QuizPage() {
  const { currentQuiz, userProgress, answerQuestion, endQuiz, startNewQuiz, user, loading: authLoading, handleSignOut } = useApp();
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  const [quizStats, setQuizStats] = useState<{ total: number; correct: number; accuracy: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  useEffect(() => {
    initQuiz();
  }, []);

  // Automatically generate next question in background whenever a new question is added
  useEffect(() => {
    if (!loading && questions.length > 0 && questions.length < totalQuestions && !generatingNext) {
      // Generate the next question immediately after the current one is added
      console.log(`Auto-generating question ${questions.length + 1} in background...`);
      setGeneratingNext(true);
      generateNextQuestion().then(() => {
        setGeneratingNext(false);
      });
    }
  }, [loading, questions.length, generatingNext]); // Watch generatingNext too

  const initQuiz = async () => {
    if (!currentQuiz) {
      startNewQuiz();
    }

    // Check if there's a cached quiz available
    if (userProgress?.cachedQuiz && userProgress.cachedQuiz.questions.length === totalQuestions) {
      console.log('✅ Using pre-generated cached quiz!');
      console.log(`  Phase: ${userProgress.quizMetadata?.allTopicsCoveredOnce ? 2 : 1}`);
      console.log(`  Generated ${(Date.now() - userProgress.cachedQuiz.generatedAt) / 1000}s ago`);
      setQuestions(userProgress.cachedQuiz.questions);
      setLoading(false);

      // Clear cached quiz after using it (will be regenerated after quiz completion)
      clearCachedQuiz();
      return;
    }

    // No cached quiz - generate first question only
    console.log('No cached quiz found, generating questions on-demand');
    await generateNextQuestion();
    // The useEffect will automatically start generating Q2 in the background
  };

  const clearCachedQuiz = async () => {
    if (!user?.uid) return;

    try {
      // Clear cached quiz from Firebase
      await fetch('/api/clear-cached-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
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

      // Calculate current ability for adaptive selection
      const currentAbility = userProgress?.estimatedAbility || 0;
      const useAdaptive = true; // Enable pseudo-adaptive selection

      const response = await fetch('/api/generate-single-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excludeTopics: userProgress?.answeredQuestions || [],
          questionNumber,
          currentAbility,
          useAdaptive,
        }),
      });

      const data = await response.json();

      // Check for API errors
      if (!response.ok) {
        if (response.status === 429) {
          setErrorMessage('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 500) {
          setErrorMessage('Server error generating questions. This may be due to API limits or a temporary issue. Please try again in a few minutes.');
        } else if (response.status === 401 || response.status === 403) {
          setErrorMessage('Authentication error. Please contact support.');
        } else {
          setErrorMessage(`Failed to generate question: ${data.error || 'Unknown error'}. Please try again.`);
        }
        console.error('API error:', data);
        return;
      }

      if (data.question) {
        setQuestions(prev => [...prev, data.question]);
        console.log(`Question ${questionNumber} loaded`);
      } else {
        setErrorMessage('No question was generated. Please try again.');
      }
    } catch (error) {
      console.error('Error generating question:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
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

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.questionType === 'multiple') {
      if (selectedAnswers.length === 0) return;
      answerQuestion(currentQuestion, selectedAnswers);
    } else {
      if (selectedAnswer === null) return;
      answerQuestion(currentQuestion, selectedAnswer);
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

      await endQuiz();
      console.log('Quiz ended successfully, showing celebration...');
      setShowCelebration(true);
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Failed to save quiz results. Please try again.');
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setQuizStats(null);
    router.push('/cybersecurity');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono">
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-3 rounded-md transition-all duration-150 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                title="Menu"
              >
                <svg
                  className="w-6 h-6 text-zinc-300 transition-colors duration-150"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-3 bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-5 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-zinc-800">
                        <svg
                          className="w-5 h-5 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-zinc-200 hover:bg-zinc-800 transition-colors duration-150 flex items-center gap-3"
                  >
                    <div className="p-2 rounded-md bg-red-950">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading spinner */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-150">
              <div className="animate-spin rounded-md h-24 w-24 md:h-32 md:w-32 border-4 border-zinc-800 border-t-zinc-400 mx-auto"></div>
              <p className="mt-8 text-zinc-200 text-2xl md:text-3xl font-bold">Generating first question...</p>
              <p className="mt-3 text-zinc-400 text-lg md:text-xl">This will take about 10 seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white font-mono">
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-3 rounded-md transition-all duration-150 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                title="Menu"
              >
                <svg
                  className="w-6 h-6 text-zinc-300 transition-colors duration-150"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-3 bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-5 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-zinc-800">
                        <svg
                          className="w-5 h-5 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-zinc-200 hover:bg-zinc-800 transition-colors duration-150 flex items-center gap-3"
                  >
                    <div className="p-2 rounded-md bg-red-950">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-150">
              <div className="bg-zinc-950 border-2 border-red-500 rounded-md p-10 md:p-12 mb-8">
                <div className="text-red-400 text-7xl md:text-8xl mb-8">⚠️</div>
                <h3 className="text-3xl md:text-4xl font-bold text-red-400 mb-6">Question Generation Failed</h3>
                <p className="text-zinc-200 text-lg md:text-xl leading-relaxed">
                  {errorMessage || 'Failed to generate questions. Please try again.'}
                </p>
              </div>
              <div className="flex gap-4 md:gap-6 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setErrorMessage('');
                    router.push('/cybersecurity');
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-10 md:px-12 py-4 md:py-5 rounded-md font-bold text-lg md:text-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                >
                  Back to Cybersecurity
                </button>
                <button
                  onClick={() => {
                    setErrorMessage('');
                    window.location.reload();
                  }}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-10 md:px-12 py-4 md:py-5 rounded-md font-bold text-lg md:text-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 rounded-md p-12 md:p-16 max-w-2xl w-full border-2 border-zinc-800 animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white">
                Quiz Complete!
              </h2>

              <div className="mb-10">
                <div className="text-8xl md:text-9xl font-bold mb-4 text-zinc-100">
                  {correctAnswers}/{totalAnswered}
                </div>
                <div className="text-3xl md:text-4xl text-zinc-200 font-bold">{accuracy}% Accuracy</div>
              </div>

              {isPassing ? (
                <div className="bg-zinc-900 border-2 border-green-500 rounded-md p-8 mb-10">
                  <p className="text-green-400 font-bold text-2xl mb-4">Great Job!</p>
                  <p className="text-zinc-200 text-lg leading-relaxed">
                    You&apos;re showing strong understanding of Security+ concepts. Keep up the excellent work!
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-900 border-2 border-yellow-500 rounded-md p-8 mb-10">
                  <p className="text-yellow-400 font-bold text-2xl mb-4">Keep Practicing!</p>
                  <p className="text-zinc-200 text-lg leading-relaxed">
                    Review the explanations and try again. Each quiz helps you improve!
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-10 text-lg text-zinc-300">
                <p>✓ Progress saved to your account</p>
                <p>✓ IRT score updated</p>
                <p>✓ Predicted exam score recalculated</p>
              </div>

              <button
                onClick={handleCelebrationClose}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-6 rounded-md text-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 md:mb-16">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-150">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </h1>
            {generatingNext && (
              <div className="text-base md:text-lg text-zinc-400 mt-3 flex items-center gap-3 font-medium animate-in fade-in duration-150">
                <div className="animate-spin rounded-md h-5 w-5 border-2 border-zinc-700 border-t-zinc-400"></div>
                Generating next question...
              </div>
            )}
            <div className="text-base md:text-lg text-zinc-400 mt-2">
              {questions.length} question{questions.length !== 1 ? 's' : ''} generated so far
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-3 rounded-md transition-all duration-150 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                title="Menu"
              >
                <svg
                  className="w-6 h-6 text-zinc-300 transition-colors duration-150"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-3 bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-5 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-zinc-800">
                        <svg
                          className="w-5 h-5 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-zinc-200 hover:bg-zinc-800 transition-colors duration-150 flex items-center gap-3"
                  >
                    <div className="p-2 rounded-md bg-red-950">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 md:mb-16 animate-in fade-in duration-150">
          <div className="w-full bg-zinc-900 rounded-md h-4 md:h-5">
            <div
              className="bg-zinc-700 h-4 md:h-5 rounded-md transition-all duration-150"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-zinc-950 rounded-md p-10 md:p-12 border-2 border-zinc-800 mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-150">
          <h2 className="text-lg md:text-xl font-bold mb-8 md:mb-10 leading-tight text-white">{currentQuestion.question}</h2>

          {/* Multiple-response instruction */}
          {currentQuestion.questionType === 'multiple' && !showExplanation && (
            <div className="mb-8 text-lg md:text-xl text-zinc-300 bg-zinc-900 border-2 border-zinc-700 rounded-md p-6">
              <strong className="font-bold">Select all that apply</strong> - This question has multiple correct answers
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-5 md:space-y-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentQuestion.questionType === 'multiple'
                ? selectedAnswers.includes(index)
                : selectedAnswer === index;

              const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                ? currentQuestion.correctAnswer
                : [currentQuestion.correctAnswer];

              const isCorrectAnswer = correctAnswers.includes(index);
              const showCorrect = showExplanation && isCorrectAnswer;
              const showIncorrect = showExplanation && isSelected && !isCorrectAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full text-left p-6 md:p-8 rounded-md border-2 transition-all duration-150 ${
                    showCorrect
                      ? 'border-green-500 bg-zinc-900'
                      : showIncorrect
                      ? 'border-red-500 bg-zinc-900'
                      : isSelected
                      ? 'border-zinc-600 bg-zinc-900'
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900'
                  } ${showExplanation ? 'cursor-default' : 'cursor-pointer'} focus:outline-none focus:ring-2 focus:ring-zinc-700`}
                >
                  <div>
                    <div className="inline-flex items-center gap-3 mr-3 align-top">
                      {/* Checkbox or Radio indicator */}
                      {currentQuestion.questionType === 'multiple' ? (
                        <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
                          isSelected ? 'bg-zinc-700 border-zinc-600' : 'border-zinc-600'
                        }`}>
                          {isSelected && <span className="text-white text-base font-bold">✓</span>}
                        </div>
                      ) : (
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
                          isSelected ? 'border-zinc-600' : 'border-zinc-600'
                        }`}>
                          {isSelected && <div className="w-4 h-4 rounded-full bg-zinc-700"></div>}
                        </div>
                      )}
                      <span className="font-bold text-xl text-zinc-400">
                        {String.fromCharCode(65 + index)}.
                      </span>
                    </div>
                    <span className="text-zinc-100 text-lg md:text-xl leading-relaxed inline align-top">{option}</span>
                    {showCorrect && <span className="ml-2 text-green-400 text-2xl align-top">✓</span>}
                    {showIncorrect && <span className="ml-2 text-red-400 text-2xl align-top">✗</span>}
                  </div>
                </button>
              );
            })}
          </div>

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
              className={`w-full mt-10 md:mt-12 py-5 md:py-6 rounded-md font-bold text-xl md:text-2xl transition-all duration-150 ${
                (currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null)
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-zinc-700'
              }`}
            >
              Submit Answer
            </button>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="space-y-8 md:space-y-10 mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-150">
            <div
              className={`rounded-md p-10 md:p-12 border-2 ${
                isCorrect
                  ? 'bg-zinc-950 border-green-500'
                  : isPartiallyCorrect
                  ? 'bg-zinc-950 border-yellow-500'
                  : 'bg-zinc-950 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-3xl md:text-4xl font-bold ${
                  isCorrect
                    ? 'text-green-400'
                    : isPartiallyCorrect
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {isCorrect ? '✓ Correct!' : isPartiallyCorrect ? '◐ Partially Correct' : '✗ Incorrect'}
                </h3>
                <span className={`px-5 py-3 rounded-md text-base md:text-lg font-bold ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-950 text-green-300 border-2 border-green-500'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-950 text-yellow-300 border-2 border-yellow-500'
                    : 'bg-red-950 text-red-300 border-2 border-red-500'
                }`}>
                  {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                </span>
              </div>
              <div className="mb-8">
                <p className="font-bold text-zinc-200 mb-4 text-xl md:text-2xl">
                  {currentQuestion.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
                </p>
                {currentQuestion.questionType === 'multiple' && Array.isArray(currentQuestion.correctAnswer) ? (
                  <div className="space-y-3">
                    {currentQuestion.correctAnswer.map((answerIndex) => (
                      <p key={answerIndex} className="text-white text-lg md:text-xl leading-relaxed">
                        {String.fromCharCode(65 + answerIndex)}. {currentQuestion.options[answerIndex]}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-white text-lg md:text-xl leading-relaxed">
                    {String.fromCharCode(65 + (currentQuestion.correctAnswer as number))}. {currentQuestion.options[currentQuestion.correctAnswer as number]}
                  </p>
                )}
              </div>
              <div>
                <p className="font-bold text-zinc-200 mb-4 text-xl md:text-2xl">Explanation:</p>
                <p className="text-zinc-100 leading-relaxed text-lg md:text-xl">{currentQuestion.explanation}</p>
              </div>
            </div>

            {/* Why Other Answers Are Wrong */}
            <div className="bg-zinc-950 rounded-md p-10 md:p-12 border-2 border-zinc-800">
              <h4 className="font-bold text-zinc-100 mb-6 text-2xl md:text-3xl">Why Other Answers Are Incorrect:</h4>
              <div className="space-y-5">
                {currentQuestion.incorrectExplanations.map((explanation, index) => {
                  const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                    ? currentQuestion.correctAnswer
                    : [currentQuestion.correctAnswer];

                  if (correctAnswers.includes(index)) return null;

                  return (
                    <div key={index} className="text-lg md:text-xl">
                      <span className="font-bold text-zinc-400">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-zinc-200 ml-4 leading-relaxed">{explanation}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain and Topics */}
            <div className="bg-zinc-950 rounded-md p-10 md:p-12 border-2 border-zinc-800">
              <div className="space-y-6">
                {/* Domain */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-lg md:text-xl text-zinc-200 font-bold">Domain:</span>
                  <span className="px-5 py-3 rounded-md text-base md:text-lg bg-zinc-900 text-zinc-300 border-2 border-zinc-700 font-bold">
                    {getDomainFromTopics(currentQuestion.topics)}
                  </span>
                </div>

                {/* Topics */}
                {currentQuestion.topics && currentQuestion.topics.length > 0 && (
                  <div className="flex items-start gap-4 flex-wrap">
                    <span className="text-lg md:text-xl text-zinc-200 font-bold">Topics:</span>
                    <div className="flex flex-wrap gap-3">
                      {currentQuestion.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-5 py-3 rounded-md text-base md:text-lg bg-zinc-900 text-zinc-200 border-2 border-zinc-700 font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Button */}
            <button
              id="next"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1}
              className={`w-full py-6 md:py-7 rounded-md font-bold text-xl md:text-2xl transition-all duration-150 ${
                currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? 'bg-zinc-800 cursor-not-allowed text-zinc-500'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-zinc-700'
              }`}
            >
              {currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                ? 'Generating next question...'
                : currentQuestionIndex < totalQuestions - 1
                ? 'Next Question'
                : 'Finish Quiz'}
            </button>
          </div>
        )}

        {/* End Quiz Button */}
        <div className="mt-12 md:mt-16 text-center">
          <button
            id="end-quiz"
            onClick={handleEndQuiz}
            className="bg-red-900 hover:bg-red-800 text-white px-12 md:px-16 py-5 md:py-6 rounded-md font-bold text-lg md:text-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-800"
          >
            End Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
