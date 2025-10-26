'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { QuizSession } from '@/lib/types';
import { getDomainFromTopics } from '@/lib/domainDetection';

export default function QuizReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userProgress, loading: authLoading, handleSignOut } = useApp();
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
        <div className="text-zinc-300 text-sm font-mono">Loading...</div>
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
    <div className="min-h-screen bg-black font-mono flex flex-col">
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
                      <span className="text-sm text-zinc-300 font-mono">{user?.displayName || 'User'}</span>
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
                    <span className="font-mono">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 text-white font-mono tracking-tight">
              Quiz Review
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 font-mono">
              <span>{formattedDate} • {formattedTime}</span>
              <span>•</span>
              <span>{quiz.questions.length} questions</span>
              <span>•</span>
              <span>Time: {timeDisplay}</span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-lg font-semibold font-mono">
                <span className="text-white">{quiz.score}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-300">{quiz.questions.length}</span>
                <span className="text-zinc-500 ml-2">
                  ({((quiz.score / quiz.questions.length) * 100).toFixed(0)}%)
                </span>
              </div>
              {!quiz.completed && (
                <span className="text-xs px-2 py-1 rounded-md bg-yellow-950 text-yellow-300 border border-yellow-500 font-mono">
                  Incomplete Quiz
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Questions List */}
        <div className="space-y-8 pb-8">
          {quiz.questions.map((attempt, index) => {
            const { question } = attempt;
            const correctAnswers = Array.isArray(question.correctAnswer)
              ? question.correctAnswer
              : [question.correctAnswer];
            const userAnswers = Array.isArray(attempt.userAnswer)
              ? attempt.userAnswer
              : (attempt.userAnswer !== null ? [attempt.userAnswer] : []);

            // Check if partially correct (for multiple-response questions)
            const isPartiallyCorrect = question.questionType === 'multiple' &&
              !attempt.isCorrect &&
              userAnswers.some(ans => correctAnswers.includes(ans)) &&
              userAnswers.length > 0;

            return (
              <div key={attempt.questionId} className="space-y-4">
                {/* Question Number Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white font-mono">Question {index + 1}</h3>
                </div>

                {/* Question Card */}
                <div className="bg-zinc-950 rounded-md p-8 border border-zinc-800">
                  <h2 className="text-lg md:text-xl font-bold mb-4 leading-tight text-white">{question.question}</h2>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {question.options.map((option, idx) => {
                      const isSelected = userAnswers.includes(idx);
                      const isCorrectAnswer = correctAnswers.includes(idx);
                      const showCorrect = isCorrectAnswer;
                      const showIncorrect = isSelected && !isCorrectAnswer;

                      return (
                        <div
                          key={idx}
                          className={`w-full text-left p-4 rounded-md border-2 ${
                            showCorrect
                              ? 'border-green-500 bg-zinc-900'
                              : showIncorrect
                              ? 'border-red-500 bg-zinc-900'
                              : isSelected
                              ? 'border-zinc-600 bg-zinc-900'
                              : 'border-zinc-700 bg-zinc-950'
                          }`}
                        >
                          <div>
                            <div className="inline-flex items-center gap-3 mr-3 align-top">
                              {/* Checkbox or Radio indicator */}
                              {question.questionType === 'multiple' ? (
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-zinc-700 border-zinc-600' : 'border-zinc-600'
                                }`}>
                                  {isSelected && <span className="text-white text-xs">✓</span>}
                                </div>
                              ) : (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-zinc-600' : 'border-zinc-600'
                                }`}>
                                  {isSelected && <div className="w-3 h-3 rounded-full bg-zinc-700"></div>}
                                </div>
                              )}
                              <span className="font-bold text-zinc-400">
                                {String.fromCharCode(65 + idx)}.
                              </span>
                            </div>
                            <span className="text-zinc-100 text-lg md:text-xl leading-relaxed inline align-top">{option}</span>
                            {showCorrect && <span className="ml-2 text-green-400 text-2xl align-top">✓</span>}
                            {showIncorrect && <span className="ml-2 text-red-400 text-2xl align-top">✗</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Section */}
                <div className="space-y-4">
                  <div
                    className={`rounded-md p-6 border-2 ${
                      attempt.isCorrect
                        ? 'border-green-500 bg-zinc-950'
                        : isPartiallyCorrect
                        ? 'border-yellow-500 bg-zinc-950'
                        : 'border-red-500 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-xl font-bold font-mono ${
                        attempt.isCorrect
                          ? 'text-green-400'
                          : isPartiallyCorrect
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {attempt.isCorrect ? '✓ Correct!' : isPartiallyCorrect ? '◐ Partially Correct' : '✗ Incorrect'}
                      </h3>
                      <span className={`px-3 py-1 rounded-md text-sm font-medium font-mono ${
                        question.difficulty === 'easy'
                          ? 'bg-green-950 text-green-300 border border-green-500'
                          : question.difficulty === 'medium'
                          ? 'bg-yellow-950 text-yellow-300 border border-yellow-500'
                          : 'bg-red-950 text-red-300 border border-red-500'
                      }`}>
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="font-medium text-zinc-300 mb-2 font-mono">
                        {question.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
                      </p>
                      {question.questionType === 'multiple' && Array.isArray(question.correctAnswer) ? (
                        <div className="space-y-2">
                          {question.correctAnswer.map((answerIndex) => (
                            <p key={answerIndex} className="text-white font-mono">
                              {String.fromCharCode(65 + answerIndex)}. {question.options[answerIndex]}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white font-mono">
                          {String.fromCharCode(65 + (question.correctAnswer as number))}. {question.options[question.correctAnswer as number]}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-300 mb-2 font-mono">Explanation:</p>
                      <p className="text-zinc-100 leading-relaxed font-mono">{question.explanation}</p>
                    </div>
                  </div>

                  {/* Why Other Answers Are Wrong */}
                  {question.incorrectExplanations && question.incorrectExplanations.length > 0 && (
                    <div className="bg-zinc-950 rounded-md p-6 border border-zinc-800">
                      <h4 className="font-bold text-zinc-300 mb-3 font-mono">Why Other Answers Are Incorrect:</h4>
                      <div className="space-y-3">
                        {question.incorrectExplanations.map((explanation, idx) => {
                          if (correctAnswers.includes(idx)) return null;

                          return (
                            <div key={idx} className="text-sm">
                              <span className="font-bold text-zinc-400 font-mono">
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              <span className="text-zinc-300 ml-2 font-mono">{explanation}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Domain and Topics */}
                  <div className="bg-zinc-950 rounded-md p-6 border border-zinc-800">
                    <div className="space-y-4">
                      {/* Domain */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400 font-semibold font-mono">Domain:</span>
                        <span className="px-3 py-1 rounded-md text-sm bg-zinc-900 text-zinc-300 border border-zinc-700 font-mono">
                          {getDomainFromTopics(question.topics)}
                        </span>
                      </div>

                      {/* Topics */}
                      {question.topics && question.topics.length > 0 && (
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="text-sm text-zinc-400 font-semibold font-mono">Topics:</span>
                          <div className="flex flex-wrap gap-2">
                            {question.topics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-md text-sm bg-zinc-900 text-zinc-300 border border-zinc-700 font-mono"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
