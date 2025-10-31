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
  // Ensure correctAnswers is always an array of numbers, handle undefined/null
  const correctAnswers: number[] = question.correctAnswer === undefined || question.correctAnswer === null
    ? []
    : Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

  // Helper function to clean explanation text
  // Removes prefixes like "Correct:", "Incorrect:", "This option is correct", etc.
  const cleanExplanation = (text: string): string => {
    if (!text) return text;

    return text
      // Remove "Correct:" or "Incorrect:" at the start
      .replace(/^(Correct|Incorrect):\s*/i, '')
      // Remove "This option is correct/incorrect" patterns
      .replace(/^This option is (correct|incorrect)\.?\s*/i, '')
      .trim();
  };

  return (
    <div className="space-y-8">
      {/* Unified Explanation Card */}
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

        {/* Unified Explanation Section - All options explained */}
        <div className="relative space-y-8">
          <p className="font-bold text-white mb-6 text-2xl md:text-3xl">Explanation:</p>

          {/* Show explanation for ALL options (correct first, then A-D order for incorrect) */}
          {question.incorrectExplanations && question.incorrectExplanations.length === 4 ? (
            <div className="space-y-6">
              {/* Show correct answer explanations first */}
              {correctAnswers.map((index) => {
                const explanation = question.incorrectExplanations[index];
                if (!explanation || explanation.trim() === '') return null;

                return (
                  <div key={`correct-${index}`} className="text-xl md:text-2xl">
                    <div className="font-bold text-green-400 mb-2">
                      {String.fromCharCode(65 + index)}. {question.options[index]}
                    </div>
                    <div className="text-zinc-100 leading-relaxed pl-6">
                      {cleanExplanation(explanation)}
                    </div>
                  </div>
                );
              })}

              {/* Then show incorrect answer explanations in A-D order */}
              {question.incorrectExplanations.map((explanation, index) => {
                // Skip if this is a correct answer or if explanation is empty
                const isCorrectAnswer = correctAnswers.includes(index);
                const isEmpty = !explanation || explanation.trim() === '';

                if (isCorrectAnswer || isEmpty) {
                  return null;
                }

                return (
                  <div key={`incorrect-${index}`} className="text-xl md:text-2xl">
                    <div className="font-bold text-zinc-400 mb-2">
                      {String.fromCharCode(65 + index)}. {question.options[index]}
                    </div>
                    <div className="text-zinc-200 leading-relaxed pl-6">
                      {cleanExplanation(explanation)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback to old explanation if incorrectExplanations is not properly formatted
            <p className="text-zinc-100 leading-relaxed text-xl md:text-2xl">{question.explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
