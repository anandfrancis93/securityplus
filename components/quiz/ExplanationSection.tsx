'use client';

import { useState } from 'react';
import { Question } from '@/lib/types';

interface ExplanationSectionProps {
  question: Question;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  showDifficultyBadge?: boolean; // For quiz review page
}

export default function ExplanationSection({
  question,
  isCorrect,
  isPartiallyCorrect = false,
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

  // Determine accent color and border glow based on correctness
  const getAccentStyles = () => {
    if (isCorrect) {
      return {
        borderColor: '#10b981',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        accentColor: '#10b981',
      };
    } else if (isPartiallyCorrect) {
      return {
        borderColor: '#f59e0b',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        accentColor: '#f59e0b',
      };
    } else {
      return {
        borderColor: '#f43f5e',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        accentColor: '#f43f5e',
      };
    }
  };

  const accentStyles = getAccentStyles();

  // Difficulty badge styles
  const getDifficultyStyles = () => {
    if (!difficulty) return {};

    const baseStyle = {
      padding: '12px 20px',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: 500,
      boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    if (difficulty === 'easy') {
      return { ...baseStyle, background: '#0f0f0f', color: '#10b981' };
    } else if (difficulty === 'medium') {
      return { ...baseStyle, background: '#0f0f0f', color: '#f59e0b' };
    } else {
      return { ...baseStyle, background: '#0f0f0f', color: '#f43f5e' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Unified Explanation Card */}
      <div
        style={{
          position: 'relative',
          padding: showDifficultyBadge ? '48px' : '64px',
          background: '#0f0f0f',
          border: `2px solid ${accentStyles.borderColor}`,
          borderRadius: '24px',
          boxShadow: accentStyles.boxShadow,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header with status and optional difficulty badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: showDifficultyBadge ? '32px' : '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <h3
            style={{
              fontSize: showDifficultyBadge ? '28px' : '32px',
              fontWeight: 700,
              color: accentStyles.accentColor,
              margin: 0,
            }}
          >
            {isCorrect ? 'Correct!' : isPartiallyCorrect ? 'Partially Correct' : 'Incorrect'}
          </h3>

          {showDifficultyBadge && difficulty && (
            <span style={getDifficultyStyles()}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Unified Explanation Section - All options explained */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <p
            style={{
              fontWeight: 700,
              color: '#e5e5e5',
              margin: 0,
              marginBottom: '24px',
              fontSize: '20px',
            }}
          >
            Explanation:
          </p>

          {/* Show explanation for ALL options (correct first, then A-D order for incorrect) */}
          {question.incorrectExplanations && question.incorrectExplanations.length === 4 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Show correct answer explanations first */}
              {correctAnswers.map((index) => {
                const explanation = question.incorrectExplanations[index];
                if (!explanation || explanation.trim() === '') return null;

                return (
                  <div key={`correct-${index}`} style={{ fontSize: '16px' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#10b981',
                        marginBottom: '8px',
                      }}
                    >
                      {String.fromCharCode(65 + index)}. {question.options[index]}
                    </div>
                    <div
                      style={{
                        color: '#e5e5e5',
                        lineHeight: '1.6',
                        paddingLeft: '24px',
                      }}
                    >
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
                  <div key={`incorrect-${index}`} style={{ fontSize: '16px' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#a8a8a8',
                        marginBottom: '8px',
                      }}
                    >
                      {String.fromCharCode(65 + index)}. {question.options[index]}
                    </div>
                    <div
                      style={{
                        color: '#e5e5e5',
                        lineHeight: '1.6',
                        paddingLeft: '24px',
                      }}
                    >
                      {cleanExplanation(explanation)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback to old explanation if incorrectExplanations is not properly formatted
            <p
              style={{
                color: '#e5e5e5',
                lineHeight: '1.6',
                fontSize: '16px',
                margin: 0,
              }}
            >
              {question.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
