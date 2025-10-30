'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { QuizSession } from '@/lib/types';
import { formatQuizSummary } from '@/lib/quizFormatting';
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
          {/* Loading screen */}
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className={`${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl'} p-16 md:p-20 shadow-2xl`}>
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
                  Loading quiz review...
                </p>
                <p className={`text-base md:text-lg mt-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                  Please wait
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format quiz summary data using shared utility
  const { formattedDate, formattedTime, timeDisplay, accuracy, totalQuestions, isIncomplete } = formatQuizSummary(quiz);

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
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8">
              Quiz Review
            </h1>

            {/* Quiz Summary Card */}
            <div className={`relative p-8 md:p-10 ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl' : 'bg-zinc-900 border border-zinc-800 rounded-xl'}`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none" />
              )}
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Date */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Date</div>
                  <div className="text-2xl font-bold text-white">{formattedDate}</div>
                </div>

                {/* Time Started */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Time Started</div>
                  <div className="text-2xl font-bold text-white">{formattedTime}</div>
                </div>

                {/* Total Time */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Total Time</div>
                  <div className="text-2xl font-bold text-white">{timeDisplay}</div>
                </div>

                {/* Accuracy */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Accuracy</div>
                  <div className="text-2xl font-bold text-white">
                    {accuracy}%
                  </div>
                </div>

                {/* Total Questions */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Total Questions</div>
                  <div className="text-2xl font-bold text-white">{totalQuestions}</div>
                </div>

                {/* Incomplete Quiz Badge */}
                {isIncomplete && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Status</div>
                    <div>
                      <span className={`inline-block px-4 py-2 text-sm font-bold ${liquidGlass ? 'bg-yellow-500/20 backdrop-blur-xl border border-yellow-500/50 rounded-2xl text-yellow-300' : 'bg-yellow-950 text-yellow-300 border border-yellow-500 rounded-md'}`}>
                        Incomplete Quiz
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
                  pointsEarned={attempt.pointsEarned}
                  maxPoints={attempt.maxPoints}
                />
              </div>
            );
          })}
        </div>

        {/* Back to Performance Button */}
        <div className="mt-20 mb-20 text-center">
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
