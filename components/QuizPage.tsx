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

export default function Quiz() {
  const { currentQuiz, userProgress, answerQuestion, endQuiz, startNewQuiz, user, loading: authLoading, liquidGlass, handleSignOut, refreshProgress } = useApp();
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  const [quizStats, setQuizStats] = useState<{ total: number; correct: number; accuracy: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

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
    initQuiz();
  }, [authLoading, user]); // Don't include hasInitialized - it triggers re-runs!

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
    console.log('Starting fresh quiz - generating first question...');

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
      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
          <Header />
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
                    <div className={`w-full h-full rounded-full ${liquidGlass ? 'border-4 border-transparent border-t-violet-400 border-r-violet-400/50' : 'border-4 border-transparent border-t-violet-500 border-r-violet-500/50'}`}></div>
                  </div>
                  {/* Center icon - question mark */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className={`w-16 h-16 md:w-20 md:h-20 ${liquidGlass ? 'text-violet-400' : 'text-violet-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
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
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
          <Header />
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
    <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
      {/* Animated Background Gradients */}
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
        <Header />
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
    </div>
  );
}
