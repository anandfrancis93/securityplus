'use client';

import { useState } from 'react';
import { Question } from '@/lib/types';

interface ExplanationSectionProps {
  question: Question;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  liquidGlass?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  showDifficultyBadge?: boolean; // For quiz review page
}

export default function ExplanationSection({
  question,
  isCorrect,
  isPartiallyCorrect = false,
  liquidGlass = true,
  difficulty,
  showDifficultyBadge = false,
}: ExplanationSectionProps) {
  const [isIncorrectExpanded, setIsIncorrectExpanded] = useState(false);
  // Ensure correctAnswers is always an array of numbers, handle undefined/null
  const correctAnswers: number[] = question.correctAnswer === undefined || question.correctAnswer === null
    ? []
    : Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

  // Filter out correct answers and empty explanations from incorrect explanations
  const hasIncorrectExplanations = question.incorrectExplanations &&
    correctAnswers.length > 0 &&
    question.incorrectExplanations.some((explanation, index) =>
      !correctAnswers.includes(index) && explanation && explanation.trim() !== ''
    );

  return (
    <div className="space-y-8">
      {/* Main Explanation Card */}
      <div
        className={`relative p-12 md:p-16 border-2 ${
          liquidGlass
            ? isCorrect
              ? 'bg-white/5 backdrop-blur-2xl border-green-500/50 rounded-[40px] shadow-2xl shadow-green-500/20'
              : isPartiallyCorrect
              ? 'bg-white/5 backdrop-blur-2xl border-yellow-500/50 rounded-[40px] shadow-2xl shadow-yellow-500/20'
              : 'bg-white/5 backdrop-blur-2xl border-red-500/50 rounded-[40px] shadow-2xl shadow-red-500/20'
            : isCorrect
            ? 'border-green-500 bg-zinc-950 rounded-md'
            : isPartiallyCorrect
            ? 'border-yellow-500 bg-zinc-950 rounded-md'
            : 'border-red-500 bg-zinc-950 rounded-md'
        }`}
      >
        {liquidGlass && isCorrect && <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent rounded-[40px]" />}
        {liquidGlass && isPartiallyCorrect && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent rounded-[40px]" />}
        {liquidGlass && !isCorrect && !isPartiallyCorrect && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent rounded-[40px]" />}
        {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}

        {/* Header with status and optional difficulty badge */}
        <div className={`flex items-center justify-between ${showDifficultyBadge ? 'mb-8' : 'mb-10'} flex-wrap gap-4 relative`}>
          <h3 className={`${showDifficultyBadge ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-bold ${
            isCorrect
              ? 'text-green-400'
              : isPartiallyCorrect
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            {isCorrect ? 'Correct!' : isPartiallyCorrect ? 'Partially Correct' : 'Incorrect'}
          </h3>

          {showDifficultyBadge && difficulty && (
            <span className={`px-5 py-3 rounded-md text-lg font-medium ${
              difficulty === 'easy'
                ? 'bg-green-950 text-green-300 border-2 border-green-500'
                : difficulty === 'medium'
                ? 'bg-yellow-950 text-yellow-300 border-2 border-yellow-500'
                : 'bg-red-950 text-red-300 border-2 border-red-500'
            }`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Correct Answer(s) - Only show if user answered incorrectly */}
        {!isCorrect && (
          <div className="mb-10 relative">
            <p className="font-bold text-white mb-6 text-2xl md:text-3xl">
              {question.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
            </p>
            {question.questionType === 'multiple' && Array.isArray(question.correctAnswer) ? (
              <div className="space-y-4">
                {question.correctAnswer.map((answerIndex) => (
                  <p key={answerIndex} className="text-white text-xl md:text-2xl leading-relaxed">
                    {String.fromCharCode(65 + answerIndex)}. {question.options[answerIndex]}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-white text-xl md:text-2xl leading-relaxed">
                {String.fromCharCode(65 + (question.correctAnswer as number))}. {question.options[question.correctAnswer as number]}
              </p>
            )}
          </div>
        )}

        {/* Explanation */}
        <div className="relative">
          <p className="font-bold text-white mb-6 text-2xl md:text-3xl">Explanation:</p>
          <p className="text-zinc-100 leading-relaxed text-xl md:text-2xl">{question.explanation}</p>
        </div>
      </div>

      {/* Why Other Options Are Incorrect - Collapsible */}
      {hasIncorrectExplanations && (
        <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-zinc-950 border-2 border-zinc-800 rounded-md'} overflow-hidden`}>
          {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}

          {/* Collapsible Header */}
          <button
            onClick={() => setIsIncorrectExpanded(!isIncorrectExpanded)}
            className="relative w-full p-12 md:p-16 text-left transition-all duration-300 hover:bg-white/5"
          >
            <div className="flex items-center justify-between gap-4">
              <h4 className="font-bold text-white text-3xl md:text-4xl relative">Why Other Options Are Incorrect</h4>
              <svg
                className={`w-8 h-8 md:w-10 md:h-10 text-white transition-transform duration-300 flex-shrink-0 ${
                  isIncorrectExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Collapsible Content */}
          {isIncorrectExpanded && (
            <div className="px-12 md:px-16 pb-12 md:pb-16 space-y-6 relative animate-slideDown">
              {question.incorrectExplanations?.map((explanation, index) => {
                // Skip if this is a correct answer or if explanation is empty
                const isCorrect = correctAnswers.includes(index);
                const isEmpty = !explanation || explanation.trim() === '';

                if (isCorrect || isEmpty) {
                  return null;
                }

                return (
                  <div key={index} className="text-xl md:text-2xl">
                    <span className="font-bold text-zinc-400">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-zinc-200 ml-4 leading-relaxed">{explanation}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
