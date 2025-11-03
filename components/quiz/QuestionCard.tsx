'use client';

import { useEffect } from 'react';
import { Question } from '@/lib/types';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  showExplanation?: boolean;
  selectedAnswer?: number | null;
  selectedAnswers?: number[];
  onAnswerSelect?: (index: number) => void;
}

export default function QuestionCard({
  question,
  questionNumber,
  showExplanation = false,
  selectedAnswer = null,
  selectedAnswers = [],
  onAnswerSelect,
}: QuestionCardProps) {
  // SCHEMA ADAPTER: Normalize data whether using new or old schema
  const useNewSchema = question.optionItems && question.optionItems.length > 0;

  // If using NEW SCHEMA, convert to format expected by rest of component
  let normalizedOptions: string[];
  let normalizedCorrectAnswers: number[];

  if (useNewSchema && question.optionItems) {
    // NEW SCHEMA: Extract from OptionItems (no drift!)
    normalizedOptions = question.optionItems.map((item, idx) => {
      const letter = String.fromCharCode(65 + idx); // A, B, C, D
      return `${letter}. ${item.text}`;
    });
    normalizedCorrectAnswers = question.optionItems
      .map((item, idx) => item.isCorrect ? idx : -1)
      .filter(idx => idx !== -1);
  } else {
    // OLD SCHEMA: Use legacy fields
    normalizedOptions = question.options || [];
    normalizedCorrectAnswers = question.correctAnswer === undefined || question.correctAnswer === null
      ? []
      : Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];
  }

  // For backward compatibility, keep this variable name
  const correctAnswers = normalizedCorrectAnswers;

  // Log validation info when new question loads (development only)
  useEffect(() => {
    if (question.validationLogs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 TWO-PASS TOPIC VALIDATION - Question ${questionNumber || '?'}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`\n📝 Question: ${question.question.substring(0, 100)}...`);

      console.log(`\n✅ PASS 1 - String Matching Results:`);
      console.log(`   Topics found: ${question.validationLogs.pass1Topics.length}`);
      question.validationLogs.pass1Topics.forEach((topic, i) => {
        console.log(`   ${i + 1}. "${topic}"`);
      });

      if (question.validationLogs.pass2Rejected.length > 0) {
        console.log(`\n❌ PASS 2 - Rejected Contextual Tags:`);
        question.validationLogs.pass2Rejected.forEach((rejected, i) => {
          console.log(`   ${i + 1}. "${rejected.topic}"`);
          console.log(`      Reason: ${rejected.reason}`);
        });
      } else {
        console.log(`\n✅ PASS 2 - No tags rejected (all passed editorial tests)`);
      }

      console.log(`\n🎯 FINAL TAGS (Core Intent):`);
      console.log(`   Total: ${question.validationLogs.pass2Kept.length}`);
      question.validationLogs.pass2Kept.forEach((topic, i) => {
        console.log(`   ${i + 1}. "${topic}"`);
      });

      console.log(`\n📈 Summary:`);
      console.log(`   Pass 1: ${question.validationLogs.pass1Topics.length} topics`);
      console.log(`   Pass 2 Rejected: ${question.validationLogs.pass2Rejected.length} topics`);
      console.log(`   Final: ${question.validationLogs.pass2Kept.length} topics`);
      console.log(`${'='.repeat(60)}\n`);
    }
  }, [question.id]); // Only re-run when question changes

  const isAnswerSelected = (index: number) => {
    if (question.questionType === 'multiple') {
      return selectedAnswers.includes(index);
    }
    return selectedAnswer === index;
  };

  const handleClick = (index: number) => {
    if (!showExplanation && onAnswerSelect) {
      onAnswerSelect(index);
    }
  };

  // Strip letter prefix (A. B. C. D.) from option text for display
  // Letters are kept internally for AI generation and validation
  const stripLetterPrefix = (option: string): string => {
    return option.replace(/^[A-D]\.\s*/, '');
  };

  return (
    <div className="question-card-container" style={{
      position: 'relative',
      backgroundColor: '#0f0f0f',
      borderRadius: 'clamp(16px, 2vw, 24px)',
      boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
    }}>
      {/* Answer Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: showExplanation ? '16px' : '24px',
      }}>
        {normalizedOptions.map((option, index) => {
          const isSelected = isAnswerSelected(index);
          const isCorrectAnswer = correctAnswers.includes(index);
          const showCorrect = showExplanation && isCorrectAnswer;
          const showIncorrect = showExplanation && isSelected && !isCorrectAnswer;

          const getButtonStyle = () => {
            const baseStyle = {
              position: 'relative' as const,
              width: '100%',
              textAlign: 'left' as const,
              padding: showExplanation ? '32px' : '40px',
              backgroundColor: '#0f0f0f',
              borderRadius: '24px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: showExplanation ? 'default' : 'pointer',
              border: 'none',
            };

            if (showExplanation) {
              // Review mode
              if (showCorrect) {
                return {
                  ...baseStyle,
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                  border: '3px solid #10b981',
                };
              } else if (showIncorrect) {
                return {
                  ...baseStyle,
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                  border: '3px solid #f43f5e',
                };
              } else {
                return {
                  ...baseStyle,
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                };
              }
            } else {
              // Active quiz mode
              if (isSelected) {
                return {
                  ...baseStyle,
                  boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                };
              } else {
                return {
                  ...baseStyle,
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                };
              }
            }
          };

          const getHoverStyle = () => {
            if (showExplanation) return {};
            return {
              transform: 'translateY(-2px)',
              boxShadow: 'inset 2px 2px 4px #050505, inset -2px -2px 4px #191919',
            };
          };

          const ButtonElement = showExplanation ? 'div' : 'button';

          return (
            <ButtonElement
              key={index}
              className="answer-option-button"
              onClick={() => handleClick(index)}
              style={getButtonStyle()}
              onMouseEnter={(e) => {
                if (!showExplanation) {
                  Object.assign(e.currentTarget.style, getHoverStyle());
                }
              }}
              onMouseLeave={(e) => {
                if (!showExplanation) {
                  Object.assign(e.currentTarget.style, getButtonStyle());
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: '16px' }}>
                {/* Checkbox or Radio indicator */}
                {question.questionType === 'multiple' ? (
                  <div style={{
                    width: showExplanation ? '28px' : '36px',
                    height: showExplanation ? '28px' : '36px',
                    borderRadius: '12px',
                    border: '2px solid #666666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    backgroundColor: isSelected ? '#0f0f0f' : 'transparent',
                    boxShadow: isSelected
                      ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                      : '6px 6px 12px #050505, -6px -6px 12px #191919',
                    borderColor: isSelected ? '#a8a8a8' : '#666666',
                  }}>
                    {isSelected && <span style={{
                      color: '#e5e5e5',
                      fontSize: showExplanation ? '16px' : '20px',
                      fontWeight: 'bold',
                    }}>✓</span>}
                  </div>
                ) : (
                  <div style={{
                    width: showExplanation ? '28px' : '36px',
                    height: showExplanation ? '28px' : '36px',
                    borderRadius: '50%',
                    border: '2px solid #666666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    boxShadow: isSelected
                      ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                      : '6px 6px 12px #050505, -6px -6px 12px #191919',
                    borderColor: isSelected ? '#a8a8a8' : '#666666',
                  }}>
                    {isSelected && <div style={{
                      width: showExplanation ? '16px' : '20px',
                      height: showExplanation ? '16px' : '20px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e5e5',
                      boxShadow: 'inset 2px 2px 4px #050505',
                    }}></div>}
                  </div>
                )}
                {/* Display option text with letter prefix stripped - letters are internal only */}
                <span
                  className="option-text"
                  style={{
                    color: '#e5e5e5',
                    lineHeight: '1.6',
                    flex: 1,
                    minWidth: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {stripLetterPrefix(option)}
                </span>
              </div>
            </ButtonElement>
          );
        })}
      </div>

      <style jsx>{`
        /* ============================================
           MOBILE-FIRST RESPONSIVE DESIGN
           Fluid scaling from 320px to 3840px (4K)
           Breakpoints: 768px, 1024px, 1280px, 1440px, 1920px
           ============================================ */

        /* Base styles: Mobile (320px+) */
        .question-card-container {
          padding: clamp(20px, 4vw, 32px);
        }

        .multiple-instruction {
          margin-bottom: clamp(24px, 3.5vw, 48px);
          padding: clamp(16px, 3vw, 24px);
          fontSize: clamp(14px, 2.5vw, 18px);
        }

        .answer-option-button {
          padding: clamp(20px, 3.5vw, 32px) !important;
        }

        .option-text {
          font-size: clamp(14px, 2.5vw, 16px);
        }

        /* Tablet (768px+) */
        @media (min-width: 768px) {
          .question-card-container {
            padding: clamp(32px, 4vw, 48px);
          }

          .multiple-instruction {
            fontSize: clamp(16px, 2vw, 18px);
          }

          .answer-option-button {
            padding: clamp(24px, 3vw, 36px) !important;
          }

          .option-text {
            font-size: clamp(16px, 2vw, 18px);
          }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .question-card-container {
            padding: clamp(40px, 3.5vw, 64px);
          }

          .answer-option-button {
            padding: clamp(28px, 2.5vw, 40px) !important;
          }

          .option-text {
            font-size: clamp(17px, 1.8vw, 20px);
          }
        }

        /* Large Desktop (1280px+) */
        @media (min-width: 1280px) {
          .question-card-container {
            padding: clamp(48px, 3vw, 64px);
          }
        }

        /* XL Desktop (1440px+) */
        @media (min-width: 1440px) {
          .question-card-container {
            padding: 64px;
          }

          .multiple-instruction {
            margin-bottom: 48px;
            padding: 24px;
            fontSize: 18px;
          }

          .answer-option-button {
            padding: 40px !important;
          }

          .option-text {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
