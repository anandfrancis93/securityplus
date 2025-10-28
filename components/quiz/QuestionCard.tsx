'use client';

import { Question } from '@/lib/types';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  showExplanation?: boolean;
  selectedAnswer?: number | null;
  selectedAnswers?: number[];
  liquidGlass?: boolean;
  onAnswerSelect?: (index: number) => void;
}

export default function QuestionCard({
  question,
  questionNumber,
  showExplanation = false,
  selectedAnswer = null,
  selectedAnswers = [],
  liquidGlass = true,
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
    <div className={`relative p-16 md:p-20 ${liquidGlass ? 'bg-white/10 backdrop-blur-3xl border-2 border-white/20 rounded-[48px] shadow-2xl' : 'bg-zinc-950 border-2 border-zinc-800 rounded-md'}`}>
      {liquidGlass && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-[48px]" />
        </>
      )}

      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-16 leading-tight text-white relative">
        {question.question}
      </h2>

      {/* Multiple-response instruction */}
      {question.questionType === 'multiple' && !showExplanation && (
        <div className={`mb-12 text-base md:text-lg text-zinc-200 p-10 relative ${liquidGlass ? 'bg-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-3xl shadow-lg' : 'bg-zinc-900 border-2 border-zinc-700 rounded-md'}`}>
          {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />}
          <strong className="font-bold relative">Select all that apply</strong> <span className="relative">- This question has multiple correct answers</span>
        </div>
      )}

      {/* Answer Options */}
      <div className={`space-y-${showExplanation ? '4' : '6'} relative`}>
        {question.options.map((option, index) => {
          const isSelected = isAnswerSelected(index);
          const isCorrectAnswer = correctAnswers.includes(index);
          const showCorrect = showExplanation && isCorrectAnswer;
          const showIncorrect = showExplanation && isSelected && !isCorrectAnswer;

          const buttonClasses = showExplanation
            ? // Review mode - not interactive, more prominent green/red styling
              `relative w-full text-left p-8 md:p-10 border-2 ${
                liquidGlass
                  ? showCorrect
                    ? 'bg-green-500/10 backdrop-blur-2xl border-green-500/60 rounded-[40px] shadow-2xl shadow-green-500/30'
                    : showIncorrect
                    ? 'bg-red-500/10 backdrop-blur-2xl border-red-500/60 rounded-[40px] shadow-2xl shadow-red-500/30'
                    : isSelected
                    ? 'bg-white/10 backdrop-blur-2xl border-white/40 rounded-3xl shadow-lg'
                    : 'bg-white/5 backdrop-blur-2xl border-white/25 rounded-3xl'
                  : showCorrect
                  ? 'border-green-500 bg-zinc-950 rounded-md'
                  : showIncorrect
                  ? 'border-red-500 bg-zinc-950 rounded-md'
                  : isSelected
                  ? 'border-zinc-600 bg-zinc-900 rounded-md'
                  : 'border-zinc-700 bg-zinc-950 rounded-md'
              }`
            : // Active quiz mode - interactive
              `group relative w-full text-left p-10 md:p-12 transition-all duration-700 cursor-pointer ${
                isSelected
                  ? liquidGlass
                    ? 'bg-white/15 backdrop-blur-2xl border-2 border-white/50 rounded-3xl shadow-2xl shadow-white/20'
                    : 'border-2 border-zinc-600 bg-zinc-900 rounded-md'
                  : liquidGlass
                    ? 'bg-white/8 backdrop-blur-2xl border-2 border-white/20 hover:border-white/40 hover:bg-white/12 rounded-3xl hover:shadow-2xl hover:shadow-white/20 hover:scale-[1.02]'
                    : 'border-2 border-zinc-700 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900 rounded-md'
              }`;

          const ButtonElement = showExplanation ? 'div' : 'button';

          return (
            <ButtonElement
              key={index}
              onClick={() => handleClick(index)}
              className={buttonClasses}
            >
              {liquidGlass && showExplanation && showCorrect && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-green-500/10 to-transparent rounded-[40px]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
                </>
              )}
              {liquidGlass && showExplanation && showIncorrect && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-red-500/10 to-transparent rounded-[40px]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
                </>
              )}
              {liquidGlass && !showExplanation && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent rounded-3xl" />
                </>
              )}

              <div className="relative">
                <div className="inline-flex items-center gap-5 mr-5 align-top">
                  {/* Checkbox or Radio indicator */}
                  {question.questionType === 'multiple' ? (
                    <div className={`${showExplanation ? 'w-7 h-7' : 'w-9 h-9'} ${showExplanation ? 'rounded-lg' : 'rounded-xl'} border-2 flex items-center justify-center transition-all duration-700 shrink-0 ${
                      showExplanation
                        ? // Review mode - neutral colors
                          isSelected
                            ? liquidGlass
                              ? 'bg-white/15 border-white/50 shadow-lg'
                              : 'bg-zinc-700 border-zinc-500'
                            : liquidGlass
                              ? 'border-white/40'
                              : 'border-zinc-600'
                        : // Active mode - white colors
                          isSelected
                            ? liquidGlass
                              ? 'bg-white/20 border-white/60 shadow-lg shadow-white/20'
                              : 'bg-zinc-700 border-zinc-600'
                            : liquidGlass
                              ? 'border-white/40'
                              : 'border-zinc-600'
                    }`}>
                      {isSelected && <span className={`text-white ${showExplanation ? 'text-base' : 'text-xl'} font-bold`}>✓</span>}
                    </div>
                  ) : (
                    <div className={`${showExplanation ? 'w-7 h-7' : 'w-9 h-9'} rounded-full border-2 flex items-center justify-center transition-all duration-700 shrink-0 ${
                      showExplanation
                        ? // Review mode - neutral colors
                          isSelected
                            ? liquidGlass
                              ? 'border-white/50 shadow-lg'
                              : 'border-zinc-500'
                            : liquidGlass
                              ? 'border-white/40'
                              : 'border-zinc-600'
                        : // Active mode - white colors
                          isSelected
                            ? liquidGlass
                              ? 'border-white/60 shadow-lg shadow-white/20'
                              : 'border-zinc-600'
                            : liquidGlass
                              ? 'border-white/40'
                              : 'border-zinc-600'
                    }`}>
                      {isSelected && <div className={`${showExplanation ? 'w-4 h-4' : 'w-5 h-5'} rounded-full ${
                        showExplanation
                          ? liquidGlass ? 'bg-white/50 shadow-inner' : 'bg-zinc-500'
                          : liquidGlass ? 'bg-white/60 shadow-inner' : 'bg-zinc-700'
                      }`}></div>}
                    </div>
                  )}
                  <span className={`font-bold ${showExplanation ? 'text-lg' : 'text-lg md:text-xl'} text-zinc-300`}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                </div>
                <span className={`text-white ${showExplanation ? 'text-base md:text-lg lg:text-xl' : 'text-base md:text-lg'} leading-relaxed inline align-top`}>
                  {option}
                </span>
              </div>
            </ButtonElement>
          );
        })}
      </div>
    </div>
  );
}
