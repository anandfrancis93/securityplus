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

  // Auto-correct misaligned explanations by matching them to the right options
  const reorderExplanations = (explanations: string[]): string[] => {
    if (!explanations || explanations.length !== 4) return explanations;

    const reordered: string[] = [...explanations];
    const used: boolean[] = new Array(4).fill(false);

    console.log('[ExplanationSection] Original explanations order:', explanations.map((e, i) => `${i}: ${e.substring(0, 50)}...`));

    // Determine if each option is correct
    const isCorrectOption = (idx: number): boolean => {
      return correctAnswers.includes(idx);
    };

    // Check if explanation indicates correctness
    const explanationIndicatesCorrect = (exp: string): boolean => {
      const lower = exp.toLowerCase();
      // Check for "this is correct" type phrases
      return lower.includes('this is correct') ||
             lower.includes('this option is correct') ||
             lower.match(/^correct[:\s]/i) !== null;
    };

    const explanationIndicatesIncorrect = (exp: string): boolean => {
      const lower = exp.toLowerCase();
      // Check for "this is incorrect" type phrases
      return lower.includes('this is incorrect') ||
             lower.includes('this option is incorrect') ||
             lower.includes('this is wrong') ||
             lower.match(/^incorrect[:\s]/i) !== null;
    };

    // For each option, find the explanation that best matches it
    for (let optionIdx = 0; optionIdx < 4; optionIdx++) {
      const option = question.options[optionIdx]?.toLowerCase() || '';
      const optionKeywords = option.split(/\s+/).filter(word => word.length > 4);
      const isCorrect = isCorrectOption(optionIdx);

      console.log(`[ExplanationSection] Matching option ${optionIdx}: "${question.options[optionIdx]}" (correct: ${isCorrect}, keywords: ${optionKeywords.join(', ')})`);

      let bestMatchIdx = -1;
      let bestMatchScore = -1;

      // Check all unused explanations
      for (let expIdx = 0; expIdx < 4; expIdx++) {
        if (used[expIdx]) continue;

        const explanation = explanations[expIdx] || '';
        const explanationLower = explanation.toLowerCase();

        let score = 0;

        // CRITICAL: Check correct/incorrect alignment (highest priority)
        const expIndicatesCorrect = explanationIndicatesCorrect(explanation);
        const expIndicatesIncorrect = explanationIndicatesIncorrect(explanation);

        if (isCorrect && expIndicatesCorrect) {
          // Correct option should match "this is correct" explanation
          score += 1000; // Very high priority
          console.log(`  Explanation ${expIdx}: CORRECT MATCH (option is correct, exp says correct)`);
        } else if (!isCorrect && expIndicatesIncorrect) {
          // Incorrect option should match "this is incorrect" explanation
          score += 1000; // Very high priority
          console.log(`  Explanation ${expIdx}: CORRECT MATCH (option is incorrect, exp says incorrect)`);
        } else if (isCorrect && expIndicatesIncorrect) {
          // MISMATCH: correct option with "incorrect" explanation
          score -= 10000; // Massive penalty
          console.log(`  Explanation ${expIdx}: MISMATCH (option is correct but exp says incorrect)`);
        } else if (!isCorrect && expIndicatesCorrect) {
          // MISMATCH: incorrect option with "correct" explanation
          score -= 10000; // Massive penalty
          console.log(`  Explanation ${expIdx}: MISMATCH (option is incorrect but exp says correct)`);
        }

        // Count how many keywords from the option appear in this explanation
        optionKeywords.forEach(keyword => {
          if (explanationLower.includes(keyword)) score += 1;
        });

        // Bonus points if the explanation contains the first 15 chars of the option
        const first15 = option.substring(0, Math.min(15, option.length));
        if (explanationLower.includes(first15)) {
          score += 10;
        }

        console.log(`  Explanation ${expIdx}: total score=${score}`);

        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatchIdx = expIdx;
        }
      }

      // If no match was found (shouldn't happen, but safety check), use first unused
      if (bestMatchIdx === -1) {
        for (let expIdx = 0; expIdx < 4; expIdx++) {
          if (!used[expIdx]) {
            bestMatchIdx = expIdx;
            break;
          }
        }
      }

      console.log(`  → Best match: explanation ${bestMatchIdx} with score ${bestMatchScore}`);

      // Assign the best matching explanation to this option
      reordered[optionIdx] = explanations[bestMatchIdx];
      used[bestMatchIdx] = true;
    }

    console.log('[ExplanationSection] Reordered explanations:', reordered.map((e, i) => `${i}: ${e.substring(0, 50)}...`));

    return reordered;
  };

  // Get properly ordered explanations
  const orderedExplanations = question.incorrectExplanations
    ? reorderExplanations(question.incorrectExplanations)
    : [];

  // Helper function to strip letter prefix (A. B. C. D.) from option text
  // Letters are kept internally for AI generation but hidden in UI
  const stripLetterPrefix = (option: string): string => {
    return option.replace(/^[A-D]\.\s*/, '');
  };

  // Helper function to clean explanation text
  // Removes letter references and prefixes
  const cleanExplanation = (text: string): string => {
    if (!text) return text;

    return text
      // Replace letter references: "A is correct" → "This is correct"
      .replace(/^[A-D]\s+is\s+(correct|incorrect|wrong|right)/i, 'This is $1')
      // Replace mid-sentence letter references: "because A provides" → "because this provides"
      .replace(/\b([A-D])\s+(is|provides|represents|involves|addresses|ensures|requires|includes|excludes|limits|fails|lacks|doesn't|does not)\b/gi, 'this $2')
      // Remove "Correct:" or "Incorrect:" at the start
      .replace(/^(Correct|Incorrect):\s*/i, '')
      // Remove "This option is correct/incorrect" patterns
      .replace(/^This option is (correct|incorrect)\.?\s*/i, '')
      .trim();
  };

  // Helper to find how a topic is mentioned in the correct answer and explain its role
  const findTopicMentionInAnswer = (topic: string): string => {
    const correctAnswerIndices = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];

    // Get correct answer text(s)
    const correctAnswers = correctAnswerIndices.map(idx =>
      stripLetterPrefix(question.options[idx] || '')
    );

    // Extract key terms from topic (remove parenthetical context)
    const topicKeyTerms = topic.split('(')[0].trim();
    const topicContext = topic.includes('(') ? topic.match(/\((.*?)\)/)?.[1] || '' : '';
    const keywords = topicKeyTerms.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Get question text for context
    const questionText = question.question;

    // Try to find WHERE in the question this requirement appears
    const questionLower = questionText.toLowerCase();
    let questionContext = '';

    // Look for requirement phrases in the question
    const requirementPatterns = [
      /ensure(?:s?)?\s+that\s+([^.]+)/gi,
      /require(?:s?)?\s+([^.]+)/gi,
      /must\s+([^.]+)/gi,
      /need(?:s?)?\s+to\s+([^.]+)/gi,
      /objective(?:s?)?\s+(?:is|are|include)?\s*:?\s*([^.]+)/gi,
    ];

    for (const pattern of requirementPatterns) {
      const matches = [...questionText.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && keywords.some(k => match[1].toLowerCase().includes(k))) {
          questionContext = match[1].trim();
          break;
        }
      }
      if (questionContext) break;
    }

    // Check if topic keywords appear in correct answer
    for (const answer of correctAnswers) {
      const answerLower = answer.toLowerCase();
      const matches = keywords.filter(keyword => answerLower.includes(keyword));

      if (matches.length > 0) {
        // Find the specific part of the answer mentioning this topic
        const sentences = answer.split(/[,;]|(?:\sand\s)/);
        let relevantPart = '';

        for (const part of sentences) {
          const partLower = part.toLowerCase();
          if (keywords.some(k => partLower.includes(k))) {
            relevantPart = part.trim();
            break;
          }
        }

        if (!relevantPart) {
          relevantPart = answer.length > 80 ? answer.substring(0, 80) + '...' : answer;
        }

        // Build specific explanation
        let explanation = `The correct answer requires: "${relevantPart}"\n\n`;

        if (questionContext) {
          explanation += `This directly addresses the question's requirement: "${questionContext}". `;
        }

        explanation += `Without understanding ${topicKeyTerms}${topicContext ? ` (${topicContext})` : ''}, you cannot identify that this is the correct solution to the security problem. `;

        // Add specific reason why this topic matters
        if (topicContext.includes('access control')) {
          explanation += `You need to know how ${topicKeyTerms} works to understand why this approach properly restricts permissions.`;
        } else if (topicContext.includes('protocol') || topicContext.includes('communication')) {
          explanation += `You need to understand ${topicKeyTerms} to know why this provides the necessary security for data in transit.`;
        } else if (topicContext.includes('mitigation') || topicContext.includes('control')) {
          explanation += `You need to know ${topicKeyTerms} to recognize this as the appropriate security measure.`;
        } else if (topicContext.includes('analysis') || topicContext.includes('assessment')) {
          explanation += `You need to understand ${topicKeyTerms} to evaluate and prioritize security decisions correctly.`;
        } else {
          explanation += `This is the specific concept tested - the correct answer depends on knowing ${topicKeyTerms}.`;
        }

        return explanation;
      }
    }

    // Check explanation if not found in answer
    const explanationLower = question.explanation.toLowerCase();
    if (keywords.some(k => explanationLower.includes(k))) {
      const expSentences = question.explanation.split(/[.!?]+/);
      for (const sentence of expSentences) {
        const sentLower = sentence.toLowerCase();
        if (keywords.some(k => sentLower.includes(k))) {
          const trimmed = sentence.trim();
          if (trimmed.length > 20) {
            const quote = trimmed.length > 80 ? trimmed.substring(0, 80) + '...' : trimmed;
            return `The explanation confirms: "${quote}"\n\nThis shows ${topicKeyTerms} is the key concept - the correct answer is correct because of this principle. You must understand this concept to distinguish correct from incorrect options.`;
          }
        }
      }
    }

    // Generic fallback with more specificity
    return `The correct answer tests your knowledge of ${topicKeyTerms}${topicContext ? ` (${topicContext})` : ''}. This is a core concept you must understand - not just recognize the term, but know how and when to apply it to solve security problems.`;
  };

  // Helper function to check if explanation is valid (not a placeholder or too short)
  const isValidExplanation = (text: string): boolean => {
    if (!text || text.trim() === '') return false;

    const cleaned = cleanExplanation(text).toLowerCase();

    // Check for common placeholder phrases that indicate poor AI generation
    // Only filter if the ENTIRE explanation is just a placeholder (not if it contains one)
    const invalidPhrases = [
      'not applicable',
      'n/a',
      'see above',
      'as mentioned',
      'refer to',
      'placeholder',
    ];

    // Check if explanation is ONLY a placeholder phrase (exact match or very short)
    if (invalidPhrases.some(phrase => cleaned === phrase)) {
      return false;
    }

    // Check if explanation is too short (less than 10 characters after cleaning)
    if (cleaned.length < 10) {
      return false;
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
          {orderedExplanations && orderedExplanations.length === 4 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Show correct answer explanations first */}
              {correctAnswers.map((index) => {
                const explanation = orderedExplanations[index];
                if (!isValidExplanation(explanation)) return null;

                const wasSelectedByUser = userSelectedAnswers.includes(index);
                const isMultipleResponse = question.questionType === 'multiple';

                return (
                  <div key={`correct-${index}`} className="explanation-item">
                    <div
                      className="explanation-option-title"
                      style={{
                        fontWeight: 700,
                        color: '#10b981',
                        marginBottom: '8px',
                      }}
                    >
                      {stripLetterPrefix(question.options[index])}
                      {isMultipleResponse && !wasSelectedByUser && (
                        <span style={{ color: '#f59e0b', fontWeight: 600, marginLeft: '8px' }}>
                          (not selected)
                        </span>
                      )}
                    </div>
                    <div
                      className="explanation-text"
                      style={{
                        color: '#a8a8a8',
                        lineHeight: '1.6',
                      }}
                    >
                      {cleanExplanation(explanation)}
                    </div>
                  </div>
                );
              })}

              {/* Then show incorrect answer explanations in A-D order */}
              {orderedExplanations.map((explanation, index) => {
                // Skip if this is a correct answer or if explanation is invalid
                const isCorrectAnswer = correctAnswers.includes(index);
                const wasSelectedByUser = userSelectedAnswers.includes(index);
                const isWrongSelection = wasSelectedByUser && !isCorrectAnswer;

                if (isCorrectAnswer || !isValidExplanation(explanation)) {
                  return null;
                }

                return (
                  <div key={`incorrect-${index}`} className="explanation-item">
                    <div
                      className="explanation-option-title"
                      style={{
                        fontWeight: 700,
                        color: isWrongSelection ? '#f43f5e' : '#a8a8a8',
                        marginBottom: '8px',
                      }}
                    >
                      {stripLetterPrefix(question.options[index])}
                    </div>
                    <div
                      className="explanation-text"
                      style={{
                        color: '#a8a8a8',
                        lineHeight: '1.6',
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

      {/* Topic Validation Section - Show Core Intent vs Context */}
      {question.validationLogs && (
        <div
          className="validation-card"
          style={{
            position: 'relative',
            background: '#0f0f0f',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'clamp(16px, 2vw, 24px)',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <h3
            className="validation-title"
            style={{
              fontWeight: 700,
              color: '#a78bfa',
              margin: 0,
              marginBottom: 'clamp(16px, 2.5vw, 24px)',
            }}
          >
            Topic Analysis
          </h3>

          {/* Core Intent Tags */}
          <div style={{ marginBottom: question.validationLogs.pass2Rejected.length > 0 ? 'clamp(20px, 3vw, 32px)' : '0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🎯</span>
              <span
                className="validation-label"
                style={{
                  fontWeight: 600,
                  color: '#10b981',
                }}
              >
                Core Intent
              </span>
              <span
                style={{
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  color: '#666',
                  fontWeight: 500,
                }}
              >
                (what this question tests)
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(12px, 2vw, 16px)',
              }}
            >
              {question.validationLogs.pass2Kept.map((topic, index) => {
                const explanation = findTopicMentionInAnswer(topic);
                const parts = explanation.split('\n\n');

                return (
                  <div
                    key={`core-${index}`}
                    className="core-intent-item"
                    style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      background: '#0f0f0f',
                      border: '2px solid #10b981',
                      borderRadius: 'clamp(8px, 1.5vw, 12px)',
                      boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <div
                      style={{
                        color: '#10b981',
                        fontSize: 'clamp(14px, 2.2vw, 16px)',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                    >
                      {topic}
                    </div>
                    <div
                      style={{
                        color: '#7dd3a8',
                        fontSize: 'clamp(13px, 2vw, 14px)',
                        lineHeight: '1.6',
                      }}
                    >
                      {parts.map((part, i) => (
                        <div key={i} style={{ marginBottom: i < parts.length - 1 ? '8px' : '0' }}>
                          {i === 0 ? '✓ ' : ''}{part}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Tags (Rejected) */}
          {question.validationLogs.pass2Rejected.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontSize: '20px' }}>📋</span>
                <span
                  className="validation-label"
                  style={{
                    fontWeight: 600,
                    color: '#f59e0b',
                  }}
                >
                  Context
                </span>
                <span
                  style={{
                    fontSize: 'clamp(12px, 2vw, 14px)',
                    color: '#666',
                    fontWeight: 500,
                  }}
                >
                  (mentioned but not tested)
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'clamp(12px, 2vw, 16px)',
                }}
              >
                {question.validationLogs.pass2Rejected.map((rejected, index) => (
                  <div
                    key={`context-${index}`}
                    className="context-item"
                    style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      background: '#0f0f0f',
                      border: '2px solid #f59e0b',
                      borderRadius: 'clamp(8px, 1.5vw, 12px)',
                      boxShadow: 'inset 2px 2px 4px #050505, inset -2px -2px 4px #191919',
                    }}
                  >
                    <div
                      style={{
                        color: '#f59e0b',
                        fontSize: 'clamp(14px, 2.2vw, 16px)',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                    >
                      {rejected.topic}
                    </div>
                    <div
                      style={{
                        color: '#888',
                        fontSize: 'clamp(13px, 2vw, 14px)',
                        lineHeight: '1.6',
                        marginBottom: '8px',
                      }}
                    >
                      <strong style={{ color: '#f59e0b' }}>Why this is context, not core intent:</strong>
                    </div>
                    <div
                      style={{
                        color: '#d4a574',
                        fontSize: 'clamp(13px, 2vw, 14px)',
                        lineHeight: '1.6',
                        marginBottom: '12px',
                      }}
                    >
                      {rejected.reason}
                    </div>
                    <div
                      style={{
                        paddingTop: '12px',
                        borderTop: '1px solid #333',
                        color: '#999',
                        fontSize: 'clamp(12px, 1.8vw, 13px)',
                        lineHeight: '1.5',
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#aaa' }}>What this means:</strong>
                      </div>
                      <div>
                        This topic appears in the question to set the scene or provide background, but you don&apos;t actually need to understand it to answer correctly. The question could use a different scenario (replace this with something similar) and still test the same core concepts. Focus your study on the <span style={{ color: '#10b981', fontWeight: 600 }}>Core Intent</span> topics above - those are what you must know.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

        .validation-card {
          padding: clamp(20px, 4vw, 32px);
        }

        .validation-title {
          font-size: clamp(20px, 3.5vw, 28px);
        }

        .validation-label {
          font-size: clamp(14px, 2.5vw, 16px);
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

        .explanation-option-title {
          font-size: clamp(14px, 2.5vw, 18px);
        }

        .explanation-text {
          font-size: clamp(14px, 2.5vw, 16px);
        }

        /* Tablet (768px+) */
        @media (min-width: 768px) {
          .explanation-card {
            padding: clamp(32px, 4vw, 48px);
          }

          .validation-card {
            padding: clamp(32px, 4vw, 48px);
          }

          .validation-title {
            font-size: clamp(22px, 3vw, 28px);
          }

          .validation-label {
            font-size: clamp(15px, 2vw, 17px);
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

          .explanation-option-title {
            font-size: clamp(16px, 2vw, 18px);
          }

          .explanation-text {
            font-size: clamp(16px, 2vw, 18px);
          }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .explanation-card {
            padding: clamp(40px, 3.5vw, 56px);
          }

          .validation-card {
            padding: clamp(40px, 3.5vw, 56px);
          }

          .validation-title {
            font-size: clamp(24px, 2.5vw, 28px);
          }

          .validation-label {
            font-size: clamp(16px, 1.8vw, 18px);
          }

          .explanation-title {
            font-size: clamp(26px, 2.5vw, 32px);
          }

          .explanation-option-title {
            font-size: clamp(17px, 1.8vw, 20px);
          }

          .explanation-text {
            font-size: clamp(17px, 1.8vw, 20px);
          }
        }

        /* Large Desktop (1280px+) */
        @media (min-width: 1280px) {
          .explanation-card {
            padding: clamp(48px, 3vw, 64px);
          }

          .validation-card {
            padding: clamp(48px, 3vw, 64px);
          }
        }

        /* XL Desktop (1440px+) */
        @media (min-width: 1440px) {
          .explanation-card {
            padding: 64px;
          }

          .validation-card {
            padding: 64px;
          }

          .explanation-header {
            margin-bottom: 40px;
          }

          .explanation-title {
            font-size: 32px;
          }

          .validation-title {
            font-size: 28px;
          }

          .validation-label {
            font-size: 18px;
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

          .explanation-option-title {
            font-size: 18px;
          }

          .explanation-text {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
