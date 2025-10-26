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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-3 text-sm text-slate-200 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium tracking-wide">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-sm text-left text-slate-200 hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-3 focus:outline-none focus:bg-white/5"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium tracking-wide">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading spinner */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-800 border-t-violet-500 mx-auto shadow-lg"></div>
              <p className="mt-6 text-slate-300 text-lg font-medium tracking-wide">Generating first question...</p>
              <p className="mt-2 text-slate-400 text-sm tracking-wide">This will take about 10 seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-3 text-sm text-slate-200 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium tracking-wide">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-sm text-left text-slate-200 hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-3 focus:outline-none focus:bg-white/5"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium tracking-wide">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center max-w-md">
              <div className="bg-red-950/30 border-2 border-red-500/50 rounded-[28px] p-8 mb-6 shadow-2xl backdrop-blur-sm">
                <div className="text-red-400 text-6xl mb-6">⚠️</div>
                <h3 className="text-2xl font-bold text-red-400 mb-4 tracking-wide">Question Generation Failed</h3>
                <p className="text-slate-300 text-base leading-relaxed tracking-wide">
                  {errorMessage || 'Failed to generate questions. Please try again.'}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setErrorMessage('');
                    router.push('/cybersecurity');
                  }}
                  className="bg-slate-800/95 backdrop-blur-sm hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-8 py-3 rounded-full font-medium tracking-wide transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  Back to Cybersecurity
                </button>
                <button
                  onClick={() => {
                    setErrorMessage('');
                    window.location.reload();
                  }}
                  className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white px-8 py-3 rounded-full font-medium tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
      {/* Celebration Modal (Peak-End Rule) */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-[28px] p-10 max-w-lg w-full border-2 border-violet-500/30 shadow-2xl animate-spring-in">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6 text-white tracking-wide">
                Quiz Complete!
              </h2>

              <div className="mb-8">
                <div className="text-7xl font-bold mb-3 text-violet-400 tracking-tight">
                  {correctAnswers}/{totalAnswered}
                </div>
                <div className="text-2xl text-slate-300 font-medium tracking-wide">{accuracy}% Accuracy</div>
              </div>

              {isPassing ? (
                <div className="bg-green-950/40 border-2 border-green-500/50 rounded-3xl p-6 mb-8 backdrop-blur-sm">
                  <p className="text-green-400 font-bold text-xl mb-3 tracking-wide">Great Job!</p>
                  <p className="text-slate-300 text-base leading-relaxed tracking-wide">
                    You&apos;re showing strong understanding of Security+ concepts. Keep up the excellent work!
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-950/40 border-2 border-yellow-500/50 rounded-3xl p-6 mb-8 backdrop-blur-sm">
                  <p className="text-yellow-400 font-bold text-xl mb-3 tracking-wide">Keep Practicing!</p>
                  <p className="text-slate-300 text-base leading-relaxed tracking-wide">
                    Review the explanations and try again. Each quiz helps you improve!
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-8 text-base text-slate-400 tracking-wide">
                <p>✓ Progress saved to your account</p>
                <p>✓ IRT score updated</p>
                <p>✓ Predicted exam score recalculated</p>
              </div>

              <button
                onClick={handleCelebrationClose}
                className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold py-5 rounded-full text-lg tracking-wide transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">Question {currentQuestionIndex + 1} of {totalQuestions}</h1>
            {generatingNext && (
              <div className="text-sm text-violet-400 mt-2 flex items-center gap-2 font-medium tracking-wide">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-700 border-t-violet-400"></div>
                Generating next question...
              </div>
            )}
            <div className="text-sm text-slate-400 mt-1 tracking-wide">
              {questions.length} question{questions.length !== 1 ? 's' : ''} generated so far
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-3 text-sm text-slate-200 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium tracking-wide">{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-sm text-left text-slate-200 hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-3 focus:outline-none focus:bg-white/5"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium tracking-wide">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="w-full bg-slate-800/95 backdrop-blur-sm rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-violet-600 to-violet-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-violet-500/20"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-10 border border-slate-700/50 shadow-2xl mb-8">
          <h2 className="text-2xl font-medium mb-6 leading-relaxed text-slate-100 tracking-wide">{currentQuestion.question}</h2>

          {/* Multiple-response instruction */}
          {currentQuestion.questionType === 'multiple' && !showExplanation && (
            <div className="mb-6 text-base text-violet-400 bg-violet-950/30 border-2 border-violet-500/30 rounded-3xl p-4 backdrop-blur-sm">
              <strong className="font-bold tracking-wide">Select all that apply</strong> - This question has multiple correct answers
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-4">
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
                  className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-300 ${
                    showCorrect
                      ? 'border-green-500 bg-green-950/30 shadow-lg shadow-green-500/10'
                      : showIncorrect
                      ? 'border-red-500 bg-red-950/30 shadow-lg shadow-red-500/10'
                      : isSelected
                      ? 'border-violet-500 bg-violet-950/30 shadow-lg shadow-violet-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700/30 hover:bg-slate-700/50 hover:shadow-lg'
                  } ${showExplanation ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01]'} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox or Radio indicator */}
                    <div className="flex items-center mt-1">
                      {currentQuestion.questionType === 'multiple' ? (
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-400'
                        }`}>
                          {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                        </div>
                      ) : (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'border-violet-500' : 'border-slate-400'
                        }`}>
                          {isSelected && <div className="w-3.5 h-3.5 rounded-full bg-violet-500"></div>}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-lg text-slate-400 tracking-wide min-w-[1.5rem]">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1 text-slate-200 text-base leading-relaxed tracking-wide">{option}</span>
                    {showCorrect && <span className="ml-2 text-green-400 text-xl">✓</span>}
                    {showIncorrect && <span className="ml-2 text-red-400 text-xl">✗</span>}
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
              className={`w-full mt-8 py-4 rounded-full font-bold text-lg tracking-wide transition-all duration-300 ${
                (currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null)
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white hover:shadow-xl hover:shadow-violet-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50'
              }`}
            >
              Submit Answer
            </button>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="space-y-6 mb-8">
            <div
              className={`rounded-[28px] p-8 border-2 backdrop-blur-sm shadow-2xl ${
                isCorrect
                  ? 'border-green-500 bg-green-950/30 shadow-green-500/10'
                  : isPartiallyCorrect
                  ? 'border-yellow-500 bg-yellow-950/30 shadow-yellow-500/10'
                  : 'border-red-500 bg-red-950/30 shadow-red-500/10'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-2xl font-bold tracking-wide ${
                  isCorrect
                    ? 'text-green-400'
                    : isPartiallyCorrect
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {isCorrect ? '✓ Correct!' : isPartiallyCorrect ? '◐ Partially Correct' : '✗ Incorrect'}
                </h3>
                <span className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-900/40 text-green-300 border border-green-500/30'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/30'
                    : 'bg-red-900/40 text-red-300 border border-red-500/30'
                }`}>
                  {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                </span>
              </div>
              <div className="mb-6">
                <p className="font-bold text-slate-300 mb-3 text-lg tracking-wide">
                  {currentQuestion.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
                </p>
                {currentQuestion.questionType === 'multiple' && Array.isArray(currentQuestion.correctAnswer) ? (
                  <div className="space-y-2">
                    {currentQuestion.correctAnswer.map((answerIndex) => (
                      <p key={answerIndex} className="text-white text-base tracking-wide">
                        {String.fromCharCode(65 + answerIndex)}. {currentQuestion.options[answerIndex]}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-white text-base tracking-wide">
                    {String.fromCharCode(65 + (currentQuestion.correctAnswer as number))}. {currentQuestion.options[currentQuestion.correctAnswer as number]}
                  </p>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-300 mb-3 text-lg tracking-wide">Explanation:</p>
                <p className="text-slate-200 leading-relaxed text-base tracking-wide">{currentQuestion.explanation}</p>
              </div>
            </div>

            {/* Why Other Answers Are Wrong */}
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-slate-700/50 shadow-xl">
              <h4 className="font-bold text-slate-200 mb-5 text-xl tracking-wide">Why Other Answers Are Incorrect:</h4>
              <div className="space-y-4">
                {currentQuestion.incorrectExplanations.map((explanation, index) => {
                  const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                    ? currentQuestion.correctAnswer
                    : [currentQuestion.correctAnswer];

                  if (correctAnswers.includes(index)) return null;

                  return (
                    <div key={index} className="text-base">
                      <span className="font-bold text-slate-400 tracking-wide">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-slate-300 ml-3 tracking-wide leading-relaxed">{explanation}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain and Topics */}
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-slate-700/50 shadow-xl">
              <div className="space-y-5">
                {/* Domain */}
                <div className="flex items-center gap-3">
                  <span className="text-base text-slate-300 font-bold tracking-wide">Domain:</span>
                  <span className="px-4 py-2 rounded-full text-sm bg-violet-950/40 text-violet-300 border border-violet-500/30 font-medium tracking-wide">
                    {getDomainFromTopics(currentQuestion.topics)}
                  </span>
                </div>

                {/* Topics */}
                {currentQuestion.topics && currentQuestion.topics.length > 0 && (
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-base text-slate-300 font-bold tracking-wide">Topics:</span>
                    <div className="flex flex-wrap gap-3">
                      {currentQuestion.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 rounded-full text-sm bg-slate-700/50 text-slate-300 border border-slate-600/50 font-medium tracking-wide"
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
              className={`w-full py-5 rounded-full font-bold text-lg tracking-wide transition-all duration-300 ${
                currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? 'bg-slate-700/50 cursor-not-allowed text-slate-500'
                  : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white hover:shadow-xl hover:shadow-violet-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50'
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
        <div className="mt-10 text-center">
          <button
            id="end-quiz"
            onClick={handleEndQuiz}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-10 py-4 rounded-full font-bold text-base tracking-wide transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            End Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
