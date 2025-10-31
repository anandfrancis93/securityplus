'use client';

import { useState } from 'react';
import { Question } from '@/lib/types';

interface ExplanationSectionProps {
  question: Question;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  showDifficultyBadge?: boolean; // For quiz review page
  selectedAnswer?: number | null;
  selectedAnswers?: number[];
}

export default function ExplanationSection({
  question,
  isCorrect,
  isPartiallyCorrect = false,
  difficulty,
  showDifficultyBadge = false,
  selectedAnswer = null,
  selectedAnswers = [],
}: ExplanationSectionProps) {
  // Ensure correctAnswers is always an array of numbers, handle undefined/null
  const correctAnswers: number[] = question.correctAnswer === undefined || question.correctAnswer === null
    ? []
    : Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

  // Determine user's selected answers as an array
  const userSelectedAnswers: number[] = question.questionType === 'multiple'
    ? selectedAnswers
    : selectedAnswer !== null ? [selectedAnswer] : [];

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

  // Helper function to check if explanation is valid (not a placeholder or too short)
  const isValidExplanation = (text: string, optionIndex: number): boolean => {
    if (!text || text.trim() === '') return false;

    const cleaned = cleanExplanation(text).toLowerCase();

    // Check for common placeholder phrases that indicate poor AI generation
    const invalidPhrases = [
      'based on the question requirements',
      'based on the requirements',
      'not applicable',
      'n/a',
      'see above',
      'as mentioned',
      'refer to',
      'placeholder',
    ];

    // Check if explanation is just a placeholder phrase
    if (invalidPhrases.some(phrase => cleaned === phrase || cleaned.startsWith(phrase))) {
      return false;
    }

    // Check if explanation is too short (less than 10 characters after cleaning)
    if (cleaned.length < 10) {
      return false;
    }

    // Check if explanation mentions OTHER options' text (indicating misalignment)
    // This happens when AI generates explanations in wrong order
    const currentOption = question.options[optionIndex]?.toLowerCase() || '';
    const currentOptionKeywords = currentOption.split(/\s+/).filter(word => word.length > 4);

    for (let i = 0; i < question.options.length; i++) {
      if (i === optionIndex) continue; // Skip the current option

      const otherOption = question.options[i]?.toLowerCase() || '';
      const otherOptionKeywords = otherOption.split(/\s+/).filter(word => word.length > 4);

      // If the explanation contains significant keywords from a DIFFERENT option,
      // it's likely explaining the wrong option
      const matchCount = otherOptionKeywords.filter(keyword =>
        cleaned.includes(keyword)
      ).length;

      // If more than 2 keywords from another option appear, it's likely misaligned
      if (matchCount >= 2) {
        console.warn(`[ExplanationSection] Detected misaligned explanation for option ${optionIndex}: contains keywords from option ${i}`);
        return false;
      }
    }

    return true;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 32px)' }}>
      {/* Unified Explanation Card */}
      <div
        className="explanation-card"
        style={{
          position: 'relative',
          background: '#0f0f0f',
          border: `2px solid ${accentStyles.borderColor}`,
          borderRadius: 'clamp(16px, 2vw, 24px)',
          boxShadow: accentStyles.boxShadow,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header with status and optional difficulty badge */}
        <div
          className="explanation-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'clamp(12px, 2vw, 16px)',
          }}
        >
          <h3
            className="explanation-title"
            style={{
              fontWeight: 700,
              color: accentStyles.accentColor,
              margin: 0,
            }}
          >
            {isCorrect ? 'Correct!' : isPartiallyCorrect ? 'Partially Correct' : 'Incorrect'}
          </h3>

          {showDifficultyBadge && difficulty && (
            <span className="difficulty-badge" style={getDifficultyStyles()}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Unified Explanation Section - All options explained */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 32px)' }}>
          <p
            className="explanation-label"
            style={{
              fontWeight: 700,
              color: '#e5e5e5',
              margin: 0,
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
                if (!isValidExplanation(explanation, index)) return null;

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
                        color: '#a8a8a8',
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
                // Skip if this is a correct answer or if explanation is invalid
                const isCorrectAnswer = correctAnswers.includes(index);
                const wasSelectedByUser = userSelectedAnswers.includes(index);
                const isWrongSelection = wasSelectedByUser && !isCorrectAnswer;

                if (isCorrectAnswer || !isValidExplanation(explanation, index)) {
                  return null;
                }

                return (
                  <div key={`incorrect-${index}`} style={{ fontSize: '16px' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: isWrongSelection ? '#f43f5e' : '#a8a8a8',
                        marginBottom: '8px',
                      }}
                    >
                      {String.fromCharCode(65 + index)}. {question.options[index]}
                    </div>
                    <div
                      style={{
                        color: '#a8a8a8',
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

      <style jsx>{`
        /* ============================================
           MOBILE-FIRST RESPONSIVE DESIGN
           Fluid scaling from 320px to 3840px (4K)
           Breakpoints: 768px, 1024px, 1280px, 1440px, 1920px
           ============================================ */

        /* Base styles: Mobile (320px+) */
        .explanation-card {
          padding: clamp(20px, 4vw, 32px);
        }

        .explanation-header {
          margin-bottom: clamp(20px, 3vw, 32px);
        }

        .explanation-title {
          font-size: clamp(22px, 4vw, 32px);
        }

        .difficulty-badge {
          padding: clamp(8px, 1.5vw, 12px) clamp(12px, 2.5vw, 20px);
          border-radius: clamp(8px, 1.5vw, 12px);
          font-size: clamp(14px, 2.5vw, 18px);
        }

        .explanation-label {
          font-size: clamp(16px, 3vw, 20px);
          margin-bottom: clamp(16px, 2.5vw, 24px);
        }

        /* Tablet (768px+) */
        @media (min-width: 768px) {
          .explanation-card {
            padding: clamp(32px, 4vw, 48px);
          }

          .explanation-header {
            margin-bottom: clamp(24px, 3vw, 36px);
          }

          .explanation-title {
            font-size: clamp(24px, 3vw, 32px);
          }

          .difficulty-badge {
            font-size: clamp(15px, 2vw, 18px);
          }

          .explanation-label {
            font-size: clamp(17px, 2.5vw, 20px);
          }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .explanation-card {
            padding: clamp(40px, 3.5vw, 56px);
          }

          .explanation-title {
            font-size: clamp(26px, 2.5vw, 32px);
          }
        }

        /* Large Desktop (1280px+) */
        @media (min-width: 1280px) {
          .explanation-card {
            padding: clamp(48px, 3vw, 64px);
          }
        }

        /* XL Desktop (1440px+) */
        @media (min-width: 1440px) {
          .explanation-card {
            padding: 64px;
          }

          .explanation-header {
            margin-bottom: 40px;
          }

          .explanation-title {
            font-size: 32px;
          }

          .difficulty-badge {
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 18px;
          }

          .explanation-label {
            font-size: 20px;
            margin-bottom: 24px;
          }
        }

        /* 4K (1920px+) - Cap maximum sizes */
        @media (min-width: 1920px) {
          .explanation-card {
            max-width: 1600px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </div>
  );
}
