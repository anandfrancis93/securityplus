'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { QuizSession } from '@/lib/types';
import QuestionCard from '@/components/quiz/QuestionCard';
import ExplanationSection from '@/components/quiz/ExplanationSection';
import QuestionMetadata from '@/components/quiz/QuestionMetadata';

export default function QuizReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userProgress, loading: authLoading, handleSignOut, liquidGlass } = useApp();
  const [quiz, setQuiz] = useState<QuizSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-300 text-sm">Loading...</div>
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
    <div className={`min-h-screen text-white relative overflow-hidden flex flex-col ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl flex-1 flex flex-col">
        {/* Header */}
        <header className="mb-4 sm:mb-6 md:mb-8">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
            <div className="relative">
              <button
                id="back-to-performance"
                onClick={() => router.push('/cybersecurity/performance')}
                className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                title="Back to Performance"
                aria-label="Back to Performance"
              >
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                id="menu"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                title="Menu"
                aria-label="Open menu"
              >
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-md overflow-hidden min-w-[200px] z-50">
                  {/* User Name Section */}
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm text-zinc-300">{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    id="sign-out"
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-sm text-left text-zinc-300 hover:bg-zinc-900 transition-colors duration-150 flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 text-white tracking-tight">
              Quiz Review
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span>{formattedDate} • {formattedTime}</span>
              <span>•</span>
              <span>{quiz.questions.length} questions</span>
              <span>•</span>
              <span>Time: {timeDisplay}</span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-lg font-semibold">
                <span className="text-white">{quiz.score}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-300">{quiz.questions.length}</span>
                <span className="text-zinc-500 ml-2">
                  ({((quiz.score / quiz.questions.length) * 100).toFixed(0)}%)
                </span>
              </div>
              {!quiz.completed && (
                <span className="text-xs px-2 py-1 rounded-md bg-yellow-950 text-yellow-300 border border-yellow-500">
                  Incomplete Quiz
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Questions List */}
        <div className="space-y-12 pb-8">
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
              <div key={attempt.questionId} className="space-y-8">
                {/* Question Number Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-md bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white">Question {index + 1}</h3>
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
                  difficulty={question.difficulty}
                  showDifficultyBadge={true}
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
      </div>
    </div>
  );
}
