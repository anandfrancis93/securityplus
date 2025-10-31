'use client';

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
  const correctAnswers = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

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

  return (
    <div style={{
      position: 'relative',
      padding: '64px',
      backgroundColor: '#0f0f0f',
      borderRadius: '48px',
      boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '64px',
        lineHeight: '1.3',
        color: '#e5e5e5',
      }}>
        {question.question}
      </h2>

      {/* Multiple-response instruction */}
      {question.questionType === 'multiple' && !showExplanation && (
        <div style={{
          marginBottom: '48px',
          fontSize: '18px',
          color: '#e5e5e5',
          padding: '24px',
          backgroundColor: '#0f0f0f',
          borderRadius: '24px',
          boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919, 0 0 20px rgba(139, 92, 246, 0.3)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}>
          <strong style={{ fontWeight: 'bold' }}>Select all that apply</strong> <span>- This question has multiple correct answers</span>
        </div>
      )}

      {/* Answer Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: showExplanation ? '16px' : '24px',
      }}>
        {question.options.map((option, index) => {
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
              borderRadius: '40px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: showExplanation ? 'default' : 'pointer',
              border: 'none',
            };

            if (showExplanation) {
              // Review mode
              if (showCorrect) {
                return {
                  ...baseStyle,
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919, 0 0 30px rgba(16, 185, 129, 0.4)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                };
              } else if (showIncorrect) {
                return {
                  ...baseStyle,
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919, 0 0 30px rgba(244, 63, 94, 0.4)',
                  border: '1px solid rgba(244, 63, 94, 0.5)',
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
                  boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 20px rgba(139, 92, 246, 0.2)',
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
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '20px', marginRight: '20px' }}>
                  {/* Checkbox or Radio indicator */}
                  {question.questionType === 'multiple' ? (
                    <div style={{
                      width: showExplanation ? '28px' : '36px',
                      height: showExplanation ? '28px' : '36px',
                      borderRadius: showExplanation ? '8px' : '12px',
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
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: showExplanation ? '18px' : '20px',
                    color: '#a8a8a8',
                  }}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                </div>
                <span style={{
                  color: '#e5e5e5',
                  fontSize: showExplanation ? '18px' : '16px',
                  lineHeight: '1.6',
                  flex: 1,
                }}>
                  {option}
                </span>
              </div>
            </ButtonElement>
          );
        })}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div > div {
            padding: 48px !important;
          }
          h2 {
            font-size: 20px !important;
          }
          button, div[role="button"] {
            padding: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
