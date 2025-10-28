'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { QuizSession } from '@/lib/types';
import QuestionCard from '@/components/quiz/QuestionCard';
import ExplanationSection from '@/components/quiz/ExplanationSection';
import QuestionMetadata from '@/components/quiz/QuestionMetadata';
import Header from '@/components/Header';

export default function QuizReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userProgress, loading: authLoading, liquidGlass } = useApp();
  const [quiz, setQuiz] = useState<QuizSession | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Find the quiz from user progress
  useEffect(() => {
    if (userProgress && params.quizId) {
      const foundQuiz = userProgress.quizHistory.find(
        (q) => q.id === params.quizId
      );
      setQuiz(foundQuiz || null);
    }
  }, [userProgress, params.quizId]);

  if (authLoading || !quiz) {
    return (
      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
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
            <div className={`text-center relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-16 shadow-2xl' : ''}`}>
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}
              <div className={`animate-spin rounded-2xl h-32 w-32 md:h-40 md:w-40 border-4 ${liquidGlass ? 'border-white/10 border-t-violet-400/80' : 'border-zinc-800 border-t-zinc-400'} mx-auto relative`}></div>
              <p className={`mt-10 text-3xl md:text-4xl font-bold relative ${liquidGlass ? 'text-white' : 'text-zinc-200'}`}>Loading quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const date = new Date(quiz.startedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Calculate time taken
  const timeTakenMs = (quiz.endedAt || quiz.startedAt) - quiz.startedAt;
  const timeTakenMinutes = Math.floor(timeTakenMs / 60000);
  const timeTakenSeconds = Math.floor((timeTakenMs % 60000) / 1000);
  const timeDisplay = timeTakenMinutes > 0
    ? `${timeTakenMinutes}m ${timeTakenSeconds}s`
    : `${timeTakenSeconds}s`;

  return (
    <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {/* Animated Background Gradients */}
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="mb-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4">
              Quiz Review
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-lg md:text-xl text-zinc-400">
              <span>{formattedDate} • {formattedTime}</span>
              <span>•</span>
              <span>{quiz.questions.length} questions</span>
              <span>•</span>
              <span>Time: {timeDisplay}</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-2xl md:text-3xl font-bold">
                <span className="text-white">{quiz.score}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-300">{quiz.questions.length}</span>
                <span className="text-zinc-500 ml-3 text-xl md:text-2xl">
                  ({((quiz.score / quiz.questions.length) * 100).toFixed(0)}%)
                </span>
              </div>
              {!quiz.completed && (
                <span className={`px-4 py-2 text-sm font-bold ${liquidGlass ? 'bg-yellow-500/20 backdrop-blur-xl border border-yellow-500/50 rounded-2xl text-yellow-300' : 'bg-yellow-950 text-yellow-300 border border-yellow-500 rounded-md'}`}>
                  Incomplete Quiz
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-20 pb-8">
          {quiz.questions.map((attempt, index) => {
            const { question } = attempt;
            const userAnswers = Array.isArray(attempt.userAnswer)
              ? attempt.userAnswer
              : (attempt.userAnswer !== null ? [attempt.userAnswer] : []);

            const correctAnswers = Array.isArray(question.correctAnswer)
              ? question.correctAnswer
              : [question.correctAnswer];

            // Check if partially correct (for multiple-response questions)
            const isPartiallyCorrect = question.questionType === 'multiple' &&
              !attempt.isCorrect &&
              userAnswers.some(ans => correctAnswers.includes(ans)) &&
              userAnswers.length > 0;

            return (
              <div key={attempt.questionId} className="space-y-12">
                {/* Question Number Header */}
                <div className="flex items-center gap-5 mb-8">
                  <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-white font-bold text-2xl md:text-3xl relative ${liquidGlass ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl' : 'bg-zinc-800 border-2 border-zinc-700 rounded-md'}`}>
                    {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl" />}
                    <span className="relative">{index + 1}</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Question {index + 1}</h3>
                </div>

                {/* Question Card with Answer Options */}
                <QuestionCard
                  question={question}
                  questionNumber={index + 1}
                  showExplanation={true}
                  selectedAnswer={question.questionType === 'single' ? (userAnswers[0] ?? null) : null}
                  selectedAnswers={question.questionType === 'multiple' ? userAnswers : []}
                  liquidGlass={liquidGlass}
                />

                {/* Explanation Section */}
                <ExplanationSection
                  question={question}
                  isCorrect={attempt.isCorrect}
                  isPartiallyCorrect={isPartiallyCorrect}
                  liquidGlass={liquidGlass}
                />

                {/* Question Metadata */}
                <QuestionMetadata
                  question={question}
                  liquidGlass={liquidGlass}
                />
              </div>
            );
          })}
        </div>

        {/* Back to Performance Button */}
        <div className="mt-20 text-center">
          <button
            id="back-to-performance"
            onClick={() => router.push('/cybersecurity/performance')}
            className={`relative px-16 md:px-20 py-6 md:py-7 font-bold text-xl md:text-2xl transition-all duration-700 ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 hover:border-white/30 text-white rounded-3xl hover:scale-105 shadow-xl hover:shadow-2xl' : 'bg-zinc-800 hover:bg-zinc-700 text-white rounded-md'}`}
          >
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-700" />}
            {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />}
            <span className="relative">Back to Performance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
