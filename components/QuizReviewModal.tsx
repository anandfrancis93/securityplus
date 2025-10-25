'use client';

import { QuizSession, QuestionAttempt } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getDomainFromTopics } from '@/lib/domainDetection';

interface QuizReviewModalProps {
  quiz: QuizSession;
  onClose: () => void;
}

export default function QuizReviewModal({ quiz, onClose }: QuizReviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

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

  const modalContent = (
    <>
      {/* Modal Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 999998
        }}
      />

      {/* Modal Content */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#111827',
        color: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1024px',
        maxHeight: '90vh',
        overflowY: 'auto',
        zIndex: 999999,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #374151'
      }}>
      <div className="relative w-full bg-gray-900 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 rounded-t-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Quiz Review</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{formattedDate} • {formattedTime}</span>
                <span>•</span>
                <span>{quiz.questions.length} questions</span>
                <span>•</span>
                <span>Time: {timeDisplay}</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="text-lg font-semibold">
                  <span className="text-blue-400">{quiz.score}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-300">{quiz.questions.length}</span>
                  <span className="text-gray-500 ml-2">
                    ({((quiz.score / quiz.questions.length) * 100).toFixed(0)}%)
                  </span>
                </div>
                {!quiz.completed && (
                  <span className="text-xs px-2 py-1 rounded bg-yellow-700/30 text-yellow-400 border border-yellow-600/50">
                    Incomplete Quiz
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 -mr-2"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="p-6 space-y-8">
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
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
                </div>

                {/* Question Card - matches QuizPage */}
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 shadow-xl">
                  <h2 className="text-xl font-medium mb-4 leading-relaxed">{question.question}</h2>

                  {/* Answer Options - matches QuizPage */}
                  <div className="space-y-3">
                    {question.options.map((option, idx) => {
                      const isSelected = userAnswers.includes(idx);
                      const isCorrectAnswer = correctAnswers.includes(idx);
                      const showCorrect = isCorrectAnswer;
                      const showIncorrect = isSelected && !isCorrectAnswer;

                      return (
                        <div
                          key={idx}
                          className={`w-full text-left p-4 rounded-lg border-2 ${
                            showCorrect
                              ? 'border-green-500 bg-green-900/20'
                              : showIncorrect
                              ? 'border-red-500 bg-red-900/20'
                              : isSelected
                              ? 'border-blue-500 bg-blue-900/20'
                              : 'border-gray-600 bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start">
                            {/* Checkbox or Radio indicator */}
                            <div className="flex items-center mr-3">
                              {question.questionType === 'multiple' ? (
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
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            {showCorrect && <span className="ml-2 text-green-400">✓</span>}
                            {showIncorrect && <span className="ml-2 text-red-400">✗</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Section - matches QuizPage */}
                <div className="space-y-4">
                  <div
                    className={`rounded-lg p-6 border-2 ${
                      attempt.isCorrect
                        ? 'border-green-500 bg-green-900/20'
                        : isPartiallyCorrect
                        ? 'border-yellow-500 bg-yellow-900/20'
                        : 'border-red-500 bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-xl font-bold ${
                        attempt.isCorrect
                          ? 'text-green-400'
                          : isPartiallyCorrect
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {attempt.isCorrect ? '✓ Correct!' : isPartiallyCorrect ? '◐ Partially Correct' : '✗ Incorrect'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        question.difficulty === 'easy'
                          ? 'bg-green-700/30 text-green-300'
                          : question.difficulty === 'medium'
                          ? 'bg-yellow-700/30 text-yellow-300'
                          : 'bg-red-700/30 text-red-300'
                      }`}>
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="font-medium text-gray-300 mb-2">
                        {question.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
                      </p>
                      {question.questionType === 'multiple' && Array.isArray(question.correctAnswer) ? (
                        <div className="space-y-2">
                          {question.correctAnswer.map((answerIndex) => (
                            <p key={answerIndex} className="text-white">
                              {String.fromCharCode(65 + answerIndex)}. {question.options[answerIndex]}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white">
                          {String.fromCharCode(65 + (question.correctAnswer as number))}. {question.options[question.correctAnswer as number]}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-300 mb-2">Explanation:</p>
                      <p className="text-gray-100 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>

                  {/* Why Other Answers Are Wrong */}
                  {question.incorrectExplanations && question.incorrectExplanations.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <h4 className="font-bold text-gray-300 mb-3">Why Other Answers Are Incorrect:</h4>
                      <div className="space-y-3">
                        {question.incorrectExplanations.map((explanation, idx) => {
                          if (correctAnswers.includes(idx)) return null;

                          return (
                            <div key={idx} className="text-sm">
                              <span className="font-bold text-gray-400">
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              <span className="text-gray-300 ml-2">{explanation}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Domain and Topics */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex flex-wrap gap-4 items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-semibold">Domain:</span>
                        <span className="px-3 py-1 rounded-full text-sm bg-indigo-700/30 text-indigo-300 border border-indigo-600/50">
                          {getDomainFromTopics(question.topics)}
                        </span>
                      </div>

                      {question.topics && question.topics.length > 0 && (
                        <>
                          <span className="text-gray-600">|</span>
                          <div className="flex items-start gap-2 flex-wrap flex-1">
                            <span className="text-sm text-gray-400 font-semibold">Topics:</span>
                            <div className="flex flex-wrap gap-2">
                              {question.topics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 rounded-b-xl p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Close Review
          </button>
        </div>
      </div>
      </div>
    </>
  );

  return modalContent;
}
