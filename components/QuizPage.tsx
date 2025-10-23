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
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    initQuiz();
  }, []);

  const initQuiz = async () => {
    if (!currentQuiz) {
      startNewQuiz();
    }

    // Generate questions
    await generateQuestions();
  };

  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: 10,
          excludeTopics: userProgress?.answeredQuestions || [],
        }),
      });

      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    answerQuestion(currentQuestion, selectedAnswer);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleEndQuiz();
    }
  };

  const handleEndQuiz = async () => {
    try {
      console.log('Ending quiz...');
      await endQuiz();
      console.log('Quiz ended successfully, navigating to home...');
      router.push('/');
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Failed to save quiz results. Please try again.');
    }
  };

  if (loading || generating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">
            {generating ? 'Generating synthesis questions...' : 'Loading quiz...'}
          </p>
          <p className="mt-2 text-gray-500 text-sm">This may take a few moments</p>
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
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Question {currentQuestionIndex + 1} of {questions.length}</h1>
            {showExplanation && (
              <div className="text-sm text-gray-400 mt-1">
                Topics: {currentQuestion.topics.join(', ')}
              </div>
            )}
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
          <h2 className="text-xl font-medium mb-6 leading-relaxed">{currentQuestion.question}</h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === currentQuestion.correctAnswer;
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
              disabled={selectedAnswer === null}
              className={`w-full mt-6 py-3 rounded-lg font-bold text-lg transition-all ${
                selectedAnswer === null
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
                <p className="font-medium text-gray-300 mb-2">Correct Answer:</p>
                <p className="text-white">
                  {String.fromCharCode(65 + currentQuestion.correctAnswer)}. {currentQuestion.options[currentQuestion.correctAnswer]}
                </p>
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
                  if (index === currentQuestion.correctAnswer) return null;
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

            {/* Next Button */}
            <button
              onClick={handleNextQuestion}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg transition-all"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
