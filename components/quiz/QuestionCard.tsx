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
    <div className={`relative p-12 md:p-16 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-zinc-950 border-2 border-zinc-800 rounded-md'}`}>
      {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}

      <h2 className="text-2xl md:text-3xl font-bold mb-12 leading-tight text-white relative">
        {question.question}
      </h2>

      {/* Multiple-response instruction */}
      {question.questionType === 'multiple' && !showExplanation && (
        <div className={`mb-10 text-xl md:text-2xl text-zinc-300 p-8 relative ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl' : 'bg-zinc-900 border-2 border-zinc-700 rounded-md'}`}>
          {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />}
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
            ? // Review mode - not interactive
              `relative w-full text-left p-6 md:p-8 border-2 ${
                liquidGlass
                  ? showCorrect
                    ? 'bg-white/10 backdrop-blur-xl border-green-500/50 rounded-3xl'
                    : showIncorrect
                    ? 'bg-white/10 backdrop-blur-xl border-red-500/50 rounded-3xl'
                    : isSelected
                    ? 'bg-white/10 backdrop-blur-xl border-white/30 rounded-3xl'
                    : 'bg-white/5 backdrop-blur-xl border-white/20 rounded-3xl'
                  : showCorrect
                  ? 'border-green-500 bg-zinc-900 rounded-md'
                  : showIncorrect
                  ? 'border-red-500 bg-zinc-900 rounded-md'
                  : isSelected
                  ? 'border-zinc-600 bg-zinc-900 rounded-md'
                  : 'border-zinc-700 bg-zinc-950 rounded-md'
              }`
            : // Active quiz mode - interactive
              `group relative w-full text-left p-8 md:p-10 transition-all duration-700 cursor-pointer ${
                isSelected
                  ? liquidGlass
                    ? 'bg-white/10 backdrop-blur-xl border border-violet-400/50 rounded-3xl shadow-lg shadow-violet-500/20'
                    : 'border-2 border-zinc-600 bg-zinc-900 rounded-md'
                  : liquidGlass
                    ? 'bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-3xl hover:shadow-xl hover:shadow-white/10 hover:scale-[1.01]'
                    : 'border-2 border-zinc-700 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900 rounded-md'
              }`;

          const ButtonElement = showExplanation ? 'div' : 'button';

          return (
            <ButtonElement
              key={index}
              onClick={() => handleClick(index)}
              className={buttonClasses}
            >
              {liquidGlass && showExplanation && showCorrect && <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent rounded-3xl" />}
              {liquidGlass && showExplanation && showIncorrect && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent rounded-3xl" />}
              {liquidGlass && !showExplanation && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />}

              <div className="relative">
                <div className="inline-flex items-center gap-4 mr-4 align-top">
                  {/* Checkbox or Radio indicator */}
                  {question.questionType === 'multiple' ? (
                    <div className={`${showExplanation ? 'w-6 h-6' : 'w-8 h-8'} ${showExplanation ? 'rounded' : 'rounded-xl'} border-2 flex items-center justify-center transition-all duration-700 shrink-0 ${
                      showExplanation
                        ? // Review mode - neutral colors
                          isSelected
                            ? liquidGlass
                              ? 'bg-white/10 border-white/40'
                              : 'bg-zinc-700 border-zinc-500'
                            : liquidGlass
                              ? 'border-white/30'
                              : 'border-zinc-600'
                        : // Active mode - violet colors
                          isSelected
                            ? liquidGlass
                              ? 'bg-violet-500/30 border-violet-400'
                              : 'bg-zinc-700 border-zinc-600'
                            : liquidGlass
                              ? 'border-white/30'
                              : 'border-zinc-600'
                    }`}>
                      {isSelected && <span className={`text-white ${showExplanation ? 'text-sm' : 'text-lg'} font-bold`}>✓</span>}
                    </div>
                  ) : (
                    <div className={`${showExplanation ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border-2 flex items-center justify-center transition-all duration-700 shrink-0 ${
                      showExplanation
                        ? // Review mode - neutral colors
                          isSelected
                            ? liquidGlass
                              ? 'border-white/40'
                              : 'border-zinc-500'
                            : liquidGlass
                              ? 'border-white/30'
                              : 'border-zinc-600'
                        : // Active mode - violet colors
                          isSelected
                            ? liquidGlass
                              ? 'border-violet-400'
                              : 'border-zinc-600'
                            : liquidGlass
                              ? 'border-white/30'
                              : 'border-zinc-600'
                    }`}>
                      {isSelected && <div className={`${showExplanation ? 'w-4 h-4' : 'w-5 h-5'} rounded-full ${
                        showExplanation
                          ? liquidGlass ? 'bg-white/40' : 'bg-zinc-500'
                          : liquidGlass ? 'bg-violet-400' : 'bg-zinc-700'
                      }`}></div>}
                    </div>
                  )}
                  <span className={`font-bold ${showExplanation ? 'text-xl' : 'text-2xl'} text-zinc-400`}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                </div>
                <span className={`text-white ${showExplanation ? 'text-xl md:text-2xl' : 'text-xl md:text-2xl'} leading-relaxed inline align-top`}>
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
