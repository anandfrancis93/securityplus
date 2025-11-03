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
  // SCHEMA ADAPTER: Normalize data whether using new or old schema
  const useNewSchema = question.optionItems && question.optionItems.length > 0;

  // If using NEW SCHEMA, convert to format expected by rest of component
  // This allows the component to work with both schemas without rewriting everything
  let normalizedOptions: string[];
  let normalizedExplanations: string[];
  let normalizedCorrectAnswers: number[];

  if (useNewSchema && question.optionItems) {
    // NEW SCHEMA: Extract from OptionItems (no drift, no reordering needed!)
    normalizedOptions = question.optionItems.map((item, idx) => {
      const letter = String.fromCharCode(65 + idx); // A, B, C, D
      return `${letter}. ${item.text}`;
    });
    normalizedExplanations = question.optionItems.map(item => item.explanation);
    normalizedCorrectAnswers = question.optionItems
      .map((item, idx) => item.isCorrect ? idx : -1)
      .filter(idx => idx !== -1);
  } else {
    // OLD SCHEMA: Use legacy fields
    normalizedOptions = question.options || [];
    normalizedExplanations = question.incorrectExplanations || [];
    normalizedCorrectAnswers = question.correctAnswer === undefined || question.correctAnswer === null
      ? []
      : Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];
  }

  // Determine user's selected answers as an array
  const userSelectedAnswers: number[] = question.questionType === 'multiple'
    ? selectedAnswers
    : selectedAnswer !== null ? [selectedAnswer] : [];

  // For backward compatibility, keep this variable name
  const correctAnswers = normalizedCorrectAnswers;

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
      const option = normalizedOptions[optionIdx]?.toLowerCase() || '';
      const optionKeywords = option.split(/\s+/).filter(word => word.length > 4);
      const isCorrect = isCorrectOption(optionIdx);

      console.log(`[ExplanationSection] Matching option ${optionIdx}: "${normalizedOptions[optionIdx]}" (correct: ${isCorrect}, keywords: ${optionKeywords.join(', ')})`);

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
  // NEW SCHEMA: No reordering needed! Explanations are bundled with options
  // OLD SCHEMA: Reorder explanations to fix any drift issues
  const orderedExplanations = useNewSchema
    ? normalizedExplanations
    : (question.incorrectExplanations ? reorderExplanations(question.incorrectExplanations) : []);

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

  // Generate comprehensive exam-focused study guide for Core Intent
  const generateCoreIntentStudyGuide = (): {
    coreIntent: string;
    recall: string;
    playbook: string;
    traps: string;
    examTip: string;
    niceToKnow: string;
  } => {
    if (!question.validationLogs) {
      return {
        coreIntent: '',
        recall: '',
        playbook: '',
        traps: '',
        examTip: '',
        niceToKnow: '',
      };
    }

    const coreTopics = question.validationLogs.pass2Kept;
    const contextTopics = question.validationLogs.pass2Rejected.map(r => r.topic);

    // Helper to strip letter prefix from options
    const stripPrefix = (opt: string) => opt.replace(/^[A-D]\.\s*/, '');

    // 1. CORE INTENT: What conceptual distinction is being tested?
    let coreIntent = '';
    if (coreTopics.length === 1) {
      const mainTopic = coreTopics[0].split('(')[0].trim();
      if (contextTopics.length > 0) {
        const alternatives = contextTopics.map(t => t.split('(')[0].trim()).join('; ');
        coreIntent = `Distinguish what ${mainTopic} does from what related controls do (${alternatives}).`;
      } else {
        coreIntent = `Understand the specific capabilities and limitations of ${mainTopic}.`;
      }
    } else if (coreTopics.length > 1) {
      const topics = coreTopics.map(t => t.split('(')[0].trim()).join(', ');
      coreIntent = `Understand how ${topics} work together to address the security requirement.`;
    }

    // 2. RECALL IN 10 SECONDS: Technical summary from explanation
    let recall = '';
    const mainTopic = coreTopics.length > 0 ? coreTopics[0].split('(')[0].trim() : '';
    if (question.explanation && mainTopic) {
      // Extract key technical facts from explanation
      const expSentences = question.explanation.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
      const relevantSentences = expSentences.filter(s =>
        s.toLowerCase().includes(mainTopic.toLowerCase()) ||
        s.toLowerCase().includes('because') ||
        s.toLowerCase().includes('provides') ||
        s.toLowerCase().includes('ensures')
      ).slice(0, 3);

      if (relevantSentences.length > 0) {
        recall = relevantSentences.join('. ').substring(0, 300);
        if (question.explanation.length > 300) recall += '...';
      }
    }

    // 3. FAST ELIMINATION PLAYBOOK: Option-by-option strategy
    let playbook = '';

    normalizedOptions.forEach((option, idx) => {
      const stripped = stripPrefix(option);
      const isCorrect = normalizedCorrectAnswers.includes(idx);

      // Get shortened option text (first 60 chars)
      const shortOption = stripped.length > 60 ? stripped.substring(0, 60) + '...' : stripped;

      playbook += `"${shortOption}" → ${isCorrect ? '✅' : '❌'}\n\n`;
    });

    // 4. COMMON TRAPS: Extract from incorrect explanations
    let traps = '';
    const incorrectIndices = normalizedOptions
      .map((_, idx) => idx)
      .filter(idx => !normalizedCorrectAnswers.includes(idx));

    const trapsList: string[] = [];

    incorrectIndices.forEach(idx => {
      const explanation = orderedExplanations[idx];
      if (!explanation) return;

      // Get the option name (stripped of letter prefix)
      const optionName = stripPrefix(normalizedOptions[idx]);

      // Extract the core misconception
      const cleaned = cleanExplanation(explanation);

      // Remove "This is incorrect because" or similar prefixes
      let misconception = cleaned
        .replace(/^This is incorrect because\s*/i, '')
        .replace(/^This is wrong because\s*/i, '')
        .replace(/^Incorrect because\s*/i, '')
        .replace(/^This\s+/i, '');

      // Take first sentence
      const firstSentence = misconception.split(/[.!?]/)[0].trim();

      if (firstSentence.length > 10) {
        // Prefix with option name
        trapsList.push(`${optionName} is incorrect because ${firstSentence}.`);
      }
    });

    traps = trapsList.slice(0, 3).join('\n\n');

    // 5. EXAM TIP: Memory aid from topics
    let examTip = '';
    if (coreTopics.length === 1 && contextTopics.length > 0) {
      const mainTopic = coreTopics[0].split('(')[0].trim();
      const alternatives = contextTopics.map(t => t.split('(')[0].trim());

      // Create simple comparison
      if (alternatives.length === 1) {
        examTip = `"${mainTopic} vs ${alternatives[0]} - know the difference."`;
      } else if (alternatives.length <= 3) {
        examTip = `"${mainTopic}: [one key differentiator]; ${alternatives.join('/')}: [their differentiators]."`;
      }
    } else if (coreTopics.length > 1) {
      const topics = coreTopics.map(t => t.split('(')[0].trim());
      examTip = `"${topics.join(' + ')} work together for this scenario."`;
    }

    // 6. NICE-TO-KNOW: Edge cases from explanation
    let niceToKnow = '';
    if (question.explanation) {
      // Look for technical details, edge cases, or caveats
      const technicalPatterns = [
        /however,([^.]+)/gi,
        /note that([^.]+)/gi,
        /caveat([^.]+)/gi,
        /limitation([^.]+)/gi,
        /edge case([^.]+)/gi,
        /advanced([^.]+)/gi,
      ];

      for (const pattern of technicalPatterns) {
        const matches = [...question.explanation.matchAll(pattern)];
        if (matches.length > 0 && matches[0][1]) {
          niceToKnow = matches[0][1].trim();
          break;
        }
      }

      // If no edge cases found, look for the most technical sentence
      if (!niceToKnow) {
        const sentences = question.explanation.split(/[.!?]+/).map(s => s.trim());
        const technicalSentence = sentences.find(s =>
          s.toLowerCase().includes('specific') ||
          s.toLowerCase().includes('protocol') ||
          s.toLowerCase().includes('algorithm') ||
          s.toLowerCase().includes('mechanism')
        );
        if (technicalSentence) {
          niceToKnow = technicalSentence.substring(0, 200);
        }
      }
    }

    return {
      coreIntent,
      recall,
      playbook,
      traps,
      examTip,
      niceToKnow,
    };
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
                      {stripLetterPrefix(normalizedOptions[index])}
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
                      {stripLetterPrefix(normalizedOptions[index])}
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

      {/* Topic Analysis section removed per user request */}

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
