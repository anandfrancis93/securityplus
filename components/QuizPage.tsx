'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { Question } from '@/lib/types';
import { getDomainFromTopics } from '@/lib/domainDetection';

export default function QuizPage() {
  const { currentQuiz, userProgress, answerQuestion, endQuiz, startNewQuiz, user, handleSignOut } = useApp();
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

    // Generate first question only
    await generateNextQuestion();
    // The useEffect will automatically start generating Q2 in the background
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
      <div className="min-h-screen bg-black text-white">
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative group p-3 rounded-full transition-all duration-300 ease-out hover:bg-violet-500/10 active:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
              >
                <span className="absolute inset-0 rounded-full bg-violet-400/0 group-hover:bg-violet-400/10 transition-colors duration-300" />
                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-violet-300 transition-colors duration-300 relative z-10"
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
                <div className="absolute right-0 top-full mt-3 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)] min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <svg
                          className="w-5 h-5 text-violet-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-slate-200 hover:bg-slate-700/50 active:bg-slate-700/70 transition-colors duration-200 flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
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
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="animate-spin rounded-full h-24 w-24 md:h-32 md:w-32 border-4 border-slate-800 border-t-violet-500 mx-auto shadow-2xl shadow-violet-500/30"></div>
              <p className="mt-8 text-slate-200 text-2xl md:text-3xl font-bold tracking-tight">Generating first question...</p>
              <p className="mt-3 text-slate-400 text-lg md:text-xl tracking-wide font-light">This will take about 10 seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative group p-3 rounded-full transition-all duration-300 ease-out hover:bg-violet-500/10 active:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
              >
                <span className="absolute inset-0 rounded-full bg-violet-400/0 group-hover:bg-violet-400/10 transition-colors duration-300" />
                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-violet-300 transition-colors duration-300 relative z-10"
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
                <div className="absolute right-0 top-full mt-3 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)] min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <svg
                          className="w-5 h-5 text-violet-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-slate-200 hover:bg-slate-700/50 active:bg-slate-700/70 transition-colors duration-200 flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
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
            <div className="text-center max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10 border-2 border-red-500/50 rounded-[32px] p-10 md:p-12 mb-8 shadow-2xl shadow-red-500/20 backdrop-blur-xl">
                <div className="text-red-400 text-7xl md:text-8xl mb-8">⚠️</div>
                <h3 className="text-3xl md:text-4xl font-bold text-red-400 mb-6 tracking-tight">Question Generation Failed</h3>
                <p className="text-slate-200 text-lg md:text-xl leading-relaxed tracking-wide">
                  {errorMessage || 'Failed to generate questions. Please try again.'}
                </p>
              </div>
              <div className="flex gap-4 md:gap-6 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setErrorMessage('');
                    router.push('/cybersecurity');
                  }}
                  className="bg-slate-800/95 backdrop-blur-sm hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-10 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl tracking-tight transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  Back to Cybersecurity
                </button>
                <button
                  onClick={() => {
                    setErrorMessage('');
                    window.location.reload();
                  }}
                  className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white px-10 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl tracking-tight transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
    <div className="min-h-screen bg-black text-white">
      {/* Background Pattern Overlay - MD3 Surface Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Celebration Modal (Peak-End Rule) */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl rounded-[32px] p-12 md:p-16 max-w-2xl w-full border-2 border-violet-500/30 shadow-[0_20px_60px_rgba(139,92,246,0.4)] animate-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-br from-white via-violet-100 to-violet-200 bg-clip-text text-transparent tracking-tight">
                Quiz Complete!
              </h2>

              <div className="mb-10">
                <div className="text-8xl md:text-9xl font-bold mb-4 bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
                  {correctAnswers}/{totalAnswered}
                </div>
                <div className="text-3xl md:text-4xl text-slate-200 font-bold tracking-tight">{accuracy}% Accuracy</div>
              </div>

              {isPassing ? (
                <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-green-500/50 rounded-[28px] p-8 mb-10 backdrop-blur-sm shadow-lg shadow-green-500/20">
                  <p className="text-green-400 font-bold text-2xl mb-4 tracking-tight">Great Job!</p>
                  <p className="text-slate-200 text-lg leading-relaxed tracking-wide">
                    You&apos;re showing strong understanding of Security+ concepts. Keep up the excellent work!
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-2 border-yellow-500/50 rounded-[28px] p-8 mb-10 backdrop-blur-sm shadow-lg shadow-yellow-500/20">
                  <p className="text-yellow-400 font-bold text-2xl mb-4 tracking-tight">Keep Practicing!</p>
                  <p className="text-slate-200 text-lg leading-relaxed tracking-wide">
                    Review the explanations and try again. Each quiz helps you improve!
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-10 text-lg text-slate-300 tracking-wide">
                <p>✓ Progress saved to your account</p>
                <p>✓ IRT score updated</p>
                <p>✓ Predicted exam score recalculated</p>
              </div>

              <button
                onClick={handleCelebrationClose}
                className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold py-6 rounded-full text-xl tracking-tight transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-br from-white via-violet-100 to-violet-200 bg-clip-text text-transparent tracking-tight mb-3">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </h1>
            {generatingNext && (
              <div className="text-base md:text-lg text-violet-400 mt-3 flex items-center gap-3 font-medium tracking-wide animate-in fade-in duration-300">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-700 border-t-violet-400"></div>
                Generating next question...
              </div>
            )}
            <div className="text-base md:text-lg text-slate-400 mt-2 tracking-wide font-light">
              {questions.length} question{questions.length !== 1 ? 's' : ''} generated so far
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative group p-3 rounded-full transition-all duration-300 ease-out hover:bg-violet-500/10 active:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
              >
                {/* State Layer */}
                <span className="absolute inset-0 rounded-full bg-violet-400/0 group-hover:bg-violet-400/10 transition-colors duration-300" />

                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-violet-300 transition-colors duration-300 relative z-10"
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
                <div className="absolute right-0 top-full mt-3 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)] min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Name Section - MD3 List Item */}
                  <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <svg
                          className="w-5 h-5 text-violet-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out Button - MD3 List Item with State Layer */}
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-slate-200 hover:bg-slate-700/50 active:bg-slate-700/70 transition-colors duration-200 flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
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
        <div className="mb-12 md:mb-16 animate-in fade-in duration-500">
          <div className="w-full bg-slate-800/95 backdrop-blur-sm rounded-full h-4 md:h-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
            <div
              className="bg-gradient-to-r from-violet-600 to-violet-400 h-4 md:h-5 rounded-full transition-all duration-500 shadow-lg shadow-violet-500/50"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl rounded-[32px] p-10 md:p-12 border-2 border-violet-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-10 leading-tight text-white tracking-tight">{currentQuestion.question}</h2>

          {/* Multiple-response instruction */}
          {currentQuestion.questionType === 'multiple' && !showExplanation && (
            <div className="mb-8 text-lg md:text-xl text-violet-300 bg-violet-950/40 border-2 border-violet-500/40 rounded-3xl p-6 backdrop-blur-sm shadow-lg shadow-violet-500/10">
              <strong className="font-bold tracking-tight">Select all that apply</strong> - This question has multiple correct answers
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
                  className={`group w-full text-left p-6 md:p-8 rounded-3xl border-2 transition-all duration-300 ${
                    showCorrect
                      ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 shadow-xl shadow-green-500/20'
                      : showIncorrect
                      ? 'border-red-500/50 bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10 shadow-xl shadow-red-500/20'
                      : isSelected
                      ? 'border-violet-500/50 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 shadow-xl shadow-violet-500/30'
                      : 'border-slate-600/50 hover:border-violet-400/50 bg-slate-700/20 hover:bg-white/5 hover:shadow-xl'
                  } ${showExplanation ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'} focus:outline-none focus:ring-2 focus:ring-violet-500/50 backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-5">
                    {/* Checkbox or Radio indicator */}
                    <div className="flex items-center mt-1">
                      {currentQuestion.questionType === 'multiple' ? (
                        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'bg-violet-500 border-violet-500 shadow-lg shadow-violet-500/50' : 'border-slate-400'
                        }`}>
                          {isSelected && <span className="text-white text-base font-bold">✓</span>}
                        </div>
                      ) : (
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'border-violet-500 shadow-lg shadow-violet-500/50' : 'border-slate-400'
                        }`}>
                          {isSelected && <div className="w-4 h-4 rounded-full bg-violet-500"></div>}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-xl text-slate-400 tracking-tight min-w-[2rem]">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1 text-slate-100 text-lg md:text-xl leading-relaxed tracking-wide">{option}</span>
                    {showCorrect && <span className="ml-2 text-green-400 text-2xl">✓</span>}
                    {showIncorrect && <span className="ml-2 text-red-400 text-2xl">✗</span>}
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
              className={`w-full mt-10 md:mt-12 py-5 md:py-6 rounded-full font-bold text-xl md:text-2xl tracking-tight transition-all duration-300 ${
                (currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null)
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white hover:shadow-2xl hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500/50'
              }`}
            >
              Submit Answer
            </button>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="space-y-8 md:space-y-10 mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
              className={`rounded-[32px] p-10 md:p-12 border-2 backdrop-blur-xl shadow-2xl ${
                isCorrect
                  ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/50 shadow-green-500/20'
                  : isPartiallyCorrect
                  ? 'bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-yellow-500/50 shadow-yellow-500/20'
                  : 'bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10 border-red-500/50 shadow-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-3xl md:text-4xl font-bold tracking-tight ${
                  isCorrect
                    ? 'text-green-400'
                    : isPartiallyCorrect
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {isCorrect ? '✓ Correct!' : isPartiallyCorrect ? '◐ Partially Correct' : '✗ Incorrect'}
                </h3>
                <span className={`px-5 py-3 rounded-full text-base md:text-lg font-bold tracking-tight ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-900/40 text-green-300 border-2 border-green-500/40 shadow-lg shadow-green-500/10'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-900/40 text-yellow-300 border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                    : 'bg-red-900/40 text-red-300 border-2 border-red-500/40 shadow-lg shadow-red-500/10'
                }`}>
                  {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                </span>
              </div>
              <div className="mb-8">
                <p className="font-bold text-slate-200 mb-4 text-xl md:text-2xl tracking-tight">
                  {currentQuestion.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
                </p>
                {currentQuestion.questionType === 'multiple' && Array.isArray(currentQuestion.correctAnswer) ? (
                  <div className="space-y-3">
                    {currentQuestion.correctAnswer.map((answerIndex) => (
                      <p key={answerIndex} className="text-white text-lg md:text-xl tracking-wide leading-relaxed">
                        {String.fromCharCode(65 + answerIndex)}. {currentQuestion.options[answerIndex]}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-white text-lg md:text-xl tracking-wide leading-relaxed">
                    {String.fromCharCode(65 + (currentQuestion.correctAnswer as number))}. {currentQuestion.options[currentQuestion.correctAnswer as number]}
                  </p>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-200 mb-4 text-xl md:text-2xl tracking-tight">Explanation:</p>
                <p className="text-slate-100 leading-relaxed text-lg md:text-xl tracking-wide">{currentQuestion.explanation}</p>
              </div>
            </div>

            {/* Why Other Answers Are Wrong */}
            <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-[32px] p-10 md:p-12 border-2 border-slate-700/50 shadow-2xl">
              <h4 className="font-bold text-slate-100 mb-6 text-2xl md:text-3xl tracking-tight">Why Other Answers Are Incorrect:</h4>
              <div className="space-y-5">
                {currentQuestion.incorrectExplanations.map((explanation, index) => {
                  const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                    ? currentQuestion.correctAnswer
                    : [currentQuestion.correctAnswer];

                  if (correctAnswers.includes(index)) return null;

                  return (
                    <div key={index} className="text-lg md:text-xl">
                      <span className="font-bold text-slate-400 tracking-tight">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-slate-200 ml-4 tracking-wide leading-relaxed">{explanation}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain and Topics */}
            <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl rounded-[32px] p-10 md:p-12 border-2 border-violet-500/30 shadow-2xl">
              <div className="space-y-6">
                {/* Domain */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-lg md:text-xl text-slate-200 font-bold tracking-tight">Domain:</span>
                  <span className="px-5 py-3 rounded-full text-base md:text-lg bg-violet-950/60 text-violet-300 border-2 border-violet-500/40 font-bold tracking-tight shadow-lg shadow-violet-500/10">
                    {getDomainFromTopics(currentQuestion.topics)}
                  </span>
                </div>

                {/* Topics */}
                {currentQuestion.topics && currentQuestion.topics.length > 0 && (
                  <div className="flex items-start gap-4 flex-wrap">
                    <span className="text-lg md:text-xl text-slate-200 font-bold tracking-tight">Topics:</span>
                    <div className="flex flex-wrap gap-3">
                      {currentQuestion.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-5 py-3 rounded-full text-base md:text-lg bg-slate-700/60 text-slate-200 border-2 border-slate-600/50 font-medium tracking-wide shadow-lg"
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
              className={`w-full py-6 md:py-7 rounded-full font-bold text-xl md:text-2xl tracking-tight transition-all duration-300 ${
                currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? 'bg-slate-700/50 cursor-not-allowed text-slate-500'
                  : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white hover:shadow-2xl hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500/50'
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
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-12 md:px-16 py-5 md:py-6 rounded-full font-bold text-lg md:text-xl tracking-tight transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            End Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
