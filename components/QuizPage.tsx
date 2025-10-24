'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { Question } from '@/lib/types';

export default function QuizPage() {
  const { currentQuiz, userProgress, answerQuestion, endQuiz, startNewQuiz } = useApp();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingNext, setGeneratingNext] = useState(false);
  const [totalQuestions] = useState(10);

  useEffect(() => {
    initQuiz();
  }, []);

  // Automatically generate next question in background when user views current question
  useEffect(() => {
    if (!loading && questions.length > 0 && questions.length < totalQuestions) {
      // Check if we need to generate the next question
      const nextQuestionNumber = questions.length + 1;

      // Only generate if next question doesn't exist yet
      if (questions.length === nextQuestionNumber - 1) {
        console.log(`Auto-generating question ${nextQuestionNumber} in background...`);
        setGeneratingNext(true);
        generateNextQuestion().then(() => {
          setGeneratingNext(false);
        });
      }
    }
  }, [loading, questions.length]);

  const initQuiz = async () => {
    if (!currentQuiz) {
      startNewQuiz();
    }

    // Generate first question only
    await generateNextQuestion();
    // The useEffect will automatically start generating Q2 in the background
  };

  const generateNextQuestion = async () => {
    try {
      const questionNumber = questions.length + 1;

      if (questionNumber > totalQuestions) {
        console.log('All questions generated');
        return;
      }

      console.log(`Generating question ${questionNumber}...`);

      const response = await fetch('/api/generate-single-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excludeTopics: userProgress?.answeredQuestions || [],
          questionNumber,
        }),
      });

      const data = await response.json();

      if (data.question) {
        setQuestions(prev => [...prev, data.question]);
        console.log(`Question ${questionNumber} loaded`);
      }
    } catch (error) {
      console.error('Error generating question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;

    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.questionType === 'multiple') {
      // Toggle selection for multiple-response questions
      setSelectedAnswers(prev =>
        prev.includes(answerIndex)
          ? prev.filter(i => i !== answerIndex)
          : [...prev, answerIndex].sort()
      );
    } else {
      // Single selection for single-choice questions
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.questionType === 'multiple') {
      if (selectedAnswers.length === 0) return;
      answerQuestion(currentQuestion, selectedAnswers);
    } else {
      if (selectedAnswer === null) return;
      answerQuestion(currentQuestion, selectedAnswer);
    }

    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    // Check if we're on the last question
    if (currentQuestionIndex >= totalQuestions - 1) {
      handleEndQuiz();
      return;
    }

    // Check if next question is already generated
    if (currentQuestionIndex < questions.length - 1) {
      // Next question is ready, move to it immediately
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setSelectedAnswers([]);
      setShowExplanation(false);
      // The useEffect will automatically generate the question after next
    } else {
      // Next question is not ready yet, wait for it
      alert('Please wait, the next question is still being generated...');
    }
  };

  const handleEndQuiz = async () => {
    try {
      console.log('Ending quiz...');
      await endQuiz();
      console.log('Quiz ended successfully, navigating to cybersecurity home...');
      router.push('/cybersecurity');
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Failed to save quiz results. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Generating first question...</p>
          <p className="mt-2 text-gray-500 text-sm">This will take about 10 seconds</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-red-400">Failed to generate questions. Please try again.</p>
          <button
            onClick={() => router.push('/cybersecurity')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Cybersecurity
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Check if answer is correct
  const isCorrect = currentQuestion.questionType === 'multiple'
    ? Array.isArray(currentQuestion.correctAnswer) &&
      selectedAnswers.length === currentQuestion.correctAnswer.length &&
      selectedAnswers.every(ans => (currentQuestion.correctAnswer as number[]).includes(ans))
    : selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Question {currentQuestionIndex + 1} of {totalQuestions}</h1>
            {showExplanation && (
              <div className="text-sm text-gray-400 mt-1">
                Topics: {currentQuestion.topics.join(', ')}
              </div>
            )}
            {generatingNext && (
              <div className="text-xs text-blue-400 mt-1 flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                Generating next question...
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {questions.length} question{questions.length !== 1 ? 's' : ''} generated so far
            </div>
          </div>
          <button
            onClick={handleEndQuiz}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            End Quiz
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 shadow-xl mb-6">
          <h2 className="text-xl font-medium mb-4 leading-relaxed">{currentQuestion.question}</h2>

          {/* Multiple-response instruction */}
          {currentQuestion.questionType === 'multiple' && !showExplanation && (
            <div className="mb-4 text-sm text-blue-400 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <strong>Select all that apply</strong> - This question has multiple correct answers
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentQuestion.questionType === 'multiple'
                ? selectedAnswers.includes(index)
                : selectedAnswer === index;

              const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                ? currentQuestion.correctAnswer
                : [currentQuestion.correctAnswer];

              const isCorrectAnswer = correctAnswers.includes(index);
              const showCorrect = showExplanation && isCorrectAnswer;
              const showIncorrect = showExplanation && isSelected && !isCorrectAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-green-500 bg-green-900/20'
                      : showIncorrect
                      ? 'border-red-500 bg-red-900/20'
                      : isSelected
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start">
                    {/* Checkbox or Radio indicator */}
                    <div className="flex items-center mr-3">
                      {currentQuestion.questionType === 'multiple' ? (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                        }`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-blue-500' : 'border-gray-400'
                        }`}>
                          {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                        </div>
                      )}
                    </div>
                    <span className="font-bold mr-3 text-gray-400">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1">{option}</span>
                    {showCorrect && <span className="ml-2 text-green-400">✓</span>}
                    {showIncorrect && <span className="ml-2 text-red-400">✗</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          {!showExplanation && (
            <button
              onClick={handleSubmitAnswer}
              disabled={
                currentQuestion.questionType === 'multiple'
                  ? selectedAnswers.length === 0
                  : selectedAnswer === null
              }
              className={`w-full mt-6 py-3 rounded-lg font-bold text-lg transition-all ${
                (currentQuestion.questionType === 'multiple' ? selectedAnswers.length === 0 : selectedAnswer === null)
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Submit Answer
            </button>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="space-y-4 mb-6">
            <div
              className={`rounded-lg p-6 border-2 ${
                isCorrect
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-red-500 bg-red-900/20'
              }`}
            >
              <h3 className={`text-xl font-bold mb-3 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </h3>
              <div className="mb-4">
                <p className="font-medium text-gray-300 mb-2">
                  {currentQuestion.questionType === 'multiple' ? 'Correct Answers:' : 'Correct Answer:'}
                </p>
                {currentQuestion.questionType === 'multiple' && Array.isArray(currentQuestion.correctAnswer) ? (
                  <div className="space-y-2">
                    {currentQuestion.correctAnswer.map((answerIndex) => (
                      <p key={answerIndex} className="text-white">
                        {String.fromCharCode(65 + answerIndex)}. {currentQuestion.options[answerIndex]}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-white">
                    {String.fromCharCode(65 + (currentQuestion.correctAnswer as number))}. {currentQuestion.options[currentQuestion.correctAnswer as number]}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-300 mb-2">Explanation:</p>
                <p className="text-gray-100 leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            </div>

            {/* Why Other Answers Are Wrong */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="font-bold text-gray-300 mb-3">Why Other Answers Are Incorrect:</h4>
              <div className="space-y-3">
                {currentQuestion.incorrectExplanations.map((explanation, index) => {
                  const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                    ? currentQuestion.correctAnswer
                    : [currentQuestion.correctAnswer];

                  if (correctAnswers.includes(index)) return null;

                  return (
                    <div key={index} className="text-sm">
                      <span className="font-bold text-gray-400">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-gray-300 ml-2">{explanation}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Topics Covered */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-bold text-blue-300 mb-2">📚 Topics Covered in This Question:</h4>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="bg-blue-700/30 text-blue-200 px-3 py-1 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-400 mt-2">
                This synthesis question combined {currentQuestion.topics.length} security concept{currentQuestion.topics.length > 1 ? 's' : ''} to test your understanding.
              </p>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {currentQuestionIndex >= questions.length - 1 && currentQuestionIndex < totalQuestions - 1
                ? 'Generating next question...'
                : currentQuestionIndex < totalQuestions - 1
                ? 'Next Question'
                : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
