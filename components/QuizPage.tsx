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
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                  <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading spinner */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Generating first question...</p>
              <p className="mt-2 text-gray-500 text-sm">This will take about 10 seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with hamburger menu */}
          <div className="flex justify-end items-center mb-8">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                  <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center max-w-md">
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-6">
                <div className="text-red-400 text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-400 mb-3">Question Generation Failed</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {errorMessage || 'Failed to generate questions. Please try again.'}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setErrorMessage('');
                    router.push('/cybersecurity');
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                >
                  Back to Cybersecurity
                </button>
                <button
                  onClick={() => {
                    setErrorMessage('');
                    window.location.reload();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Celebration Modal (Peak-End Rule) */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-lg w-full border-2 border-blue-500/30 shadow-2xl animate-spring-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Quiz Complete!
              </h2>

              <div className="mb-6">
                <div className="text-6xl font-bold mb-2 text-blue-400">
                  {correctAnswers}/{totalAnswered}
                </div>
                <div className="text-xl text-gray-400">{accuracy}% Accuracy</div>
              </div>

              {isPassing ? (
                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-6">
                  <p className="text-green-400 font-bold text-lg mb-2">Great Job!</p>
                  <p className="text-gray-300 text-sm">
                    You&apos;re showing strong understanding of Security+ concepts. Keep up the excellent work!
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6">
                  <p className="text-yellow-400 font-bold text-lg mb-2">Keep Practicing!</p>
                  <p className="text-gray-300 text-sm">
                    Review the explanations and try again. Each quiz helps you improve!
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-6 text-sm text-gray-400">
                <p>✓ Progress saved to your account</p>
                <p>✓ IRT score updated</p>
                <p>✓ Predicted exam score recalculated</p>
              </div>

              <button
                onClick={handleCelebrationClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-lg transition-spring hover-lift shadow-lg active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Question {currentQuestionIndex + 1} of {totalQuestions}</h1>
            {generatingNext && (
              <div className="text-xs text-blue-400 mt-1 flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                Generating next question...
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {questions.length} question{questions.length !== 1 ? 's' : ''} generated so far
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                  <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 shadow-xl mb-6">
          <h2 className="text-xl font-medium mb-4 leading-relaxed">{currentQuestion.question}</h2>

          {/* Multiple-response instruction */}
          {currentQuestion.questionType === 'multiple' && !showExplanation && (
            <div className="mb-4 text-sm text-blue-400 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <strong>Select all that apply</strong> - This question has multiple correct answers
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-3">
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
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-green-500 bg-green-900/20'
                      : showIncorrect
                      ? 'border-red-500 bg-red-900/20'
                      : isSelected
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start">
                    {/* Checkbox or Radio indicator */}
                    <div className="flex items-center mr-3">
                      {currentQuestion.questionType === 'multiple' ? (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                        }`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-blue-500' : 'border-gray-400'
                        }`}>
                          {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                        </div>
                      )}
                    </div>
                    <span className="font-bold mr-3 text-gray-400">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1">{option}</span>
                    {showCorrect && <span className="ml-2 text-green-400">✓</span>}
                    {showIncorrect && <span className="ml-2 text-red-400">✗</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          {!showExplanation && (
            <button
              onClick={handleSubmitAnswer}
              disabled={
                currentQuestion.questionType === 'multiple'
                  ? selectedAnswers.length === 0
                  : selectedAnswer === null
              }
              className={`w-full mt-6 py-3 rounded-lg font-bold text-lg transition-all ${
                (currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null)
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Submit Answer
            </button>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="space-y-4 mb-6">
            <div
              className={`rounded-lg p-6 border-2 ${
                isCorrect
                  ? 'border-green-500 bg-green-900/20'
                  : isPartiallyCorrect
                  ? 'border-yellow-500 bg-yellow-900/20'
                  : 'border-red-500 bg-red-900/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xl font-bold ${
                  isCorrect
                    ? 'text-green-400'
                    : isPartiallyCorrect
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {isCorrect ? '✓ Correct!' : isPartiallyCorrect ? '◐ Partially Correct' : '✗ Incorrect'}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-700/30 text-green-300'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-700/30 text-yellow-300'
                    : 'bg-red-700/30 text-red-300'
                }`}>
                  {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                </span>
              </div>
              <div className="mb-4">
                <p className="font-medium text-gray-300 mb-2">
                  {currentQuestion.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
                </p>
                {currentQuestion.questionType === 'multiple' && Array.isArray(currentQuestion.correctAnswer) ? (
                  <div className="space-y-2">
                    {currentQuestion.correctAnswer.map((answerIndex) => (
                      <p key={answerIndex} className="text-white">
                        {String.fromCharCode(65 + answerIndex)}. {currentQuestion.options[answerIndex]}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-white">
                    {String.fromCharCode(65 + (currentQuestion.correctAnswer as number))}. {currentQuestion.options[currentQuestion.correctAnswer as number]}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-300 mb-2">Explanation:</p>
                <p className="text-gray-100 leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            </div>

            {/* Why Other Answers Are Wrong */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="font-bold text-gray-300 mb-3">Why Other Answers Are Incorrect:</h4>
              <div className="space-y-3">
                {currentQuestion.incorrectExplanations.map((explanation, index) => {
                  const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                    ? currentQuestion.correctAnswer
                    : [currentQuestion.correctAnswer];

                  if (correctAnswers.includes(index)) return null;

                  return (
                    <div key={index} className="text-sm">
                      <span className="font-bold text-gray-400">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-gray-300 ml-2">{explanation}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain and Topics */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="space-y-4">
                {/* Domain */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 font-semibold">Domain:</span>
                  <span className="px-3 py-1 rounded-full text-sm bg-indigo-700/30 text-indigo-300 border border-indigo-600/50">
                    {getDomainFromTopics(currentQuestion.topics)}
                  </span>
                </div>

                {/* Topics */}
                {currentQuestion.topics && currentQuestion.topics.length > 0 && (
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-sm text-gray-400 font-semibold">Topics:</span>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300"
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
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
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
        <div className="mt-8 text-center">
          <button
            onClick={handleEndQuiz}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            End Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
