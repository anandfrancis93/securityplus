'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { QuizSession } from '@/lib/types';
import { formatQuizSummary } from '@/lib/quizFormatting';
import QuestionCard from '@/components/quiz/QuestionCard';
import ExplanationSection from '@/components/quiz/ExplanationSection';
import QuestionMetadata from '@/components/quiz/QuestionMetadata';
import Header from '@/components/Header';

export default function QuizReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userProgress, loading: authLoading } = useApp();
  const [quiz, setQuiz] = useState<QuizSession | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Find the quiz from user progress
  useEffect(() => {
    if (userProgress && params.quizId) {
      const foundQuiz = userProgress.quizHistory.find(
        (q) => q.id === params.quizId
      );
      setQuiz(foundQuiz || null);
    }
  }, [userProgress, params.quizId]);

  if (authLoading || !quiz) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f0f0f',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'relative'
        }}>
          {/* Loading card */}
          <div style={{
            background: '#0f0f0f',
            borderRadius: '24px',
            padding: '80px',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
          }}>
            <div style={{
              position: 'relative',
              textAlign: 'center'
            }}>
              {/* Animated spinner */}
              <div style={{
                position: 'relative',
                margin: '0 auto',
                width: '160px',
                height: '160px',
                marginBottom: '32px'
              }}>
                {/* Outer ring with inset shadow */}
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  border: '4px solid #0f0f0f',
                  borderRadius: '50%',
                  boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                }}></div>
                {/* Spinning gradient ring */}
                <div style={{
                  position: 'absolute',
                  inset: '0'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '4px solid transparent',
                    borderTopColor: '#06b6d4',
                    borderRightColor: 'rgba(6, 182, 212, 0.5)',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
                {/* Center icon */}
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '80px', height: '80px', color: '#06b6d4' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                letterSpacing: '-0.025em',
                color: '#e5e5e5'
              }}>
                Loading quiz review...
              </p>
              <p style={{
                fontSize: '18px',
                marginTop: '16px',
                color: '#a8a8a8'
              }}>
                Please wait
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Format quiz summary data using shared utility
  const { formattedDate, formattedTime, timeDisplay, accuracy, accuracyColor, totalQuestions, isIncomplete } = formatQuizSummary(quiz);

  return (
    <div style={{
      minHeight: '100vh',
      color: '#e5e5e5',
      position: 'relative',
      overflow: 'hidden',
      background: '#0f0f0f'
    }}>
      {/* Header - Full width */}
      <div style={{
        position: 'relative',
        paddingTop: '32px',
        paddingBottom: '16px'
      }}>
        <Header />
      </div>

      <div className="content-wrapper">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            Quiz Review
          </h1>

          {/* Quiz Summary Card */}
          <div className="summary-card">
            <div className="summary-grid">
              {/* Date */}
              <div className="summary-item">
                <div className="summary-label">Date</div>
                <div className="summary-value">{formattedDate}</div>
              </div>

              {/* Time Started */}
              <div className="summary-item">
                <div className="summary-label">Time Started</div>
                <div className="summary-value">{formattedTime}</div>
              </div>

              {/* Total Time */}
              <div className="summary-item">
                <div className="summary-label">Total Time</div>
                <div className="summary-value">{timeDisplay}</div>
              </div>

              {/* Accuracy */}
              <div className="summary-item">
                <div className="summary-label">Accuracy</div>
                <div className="summary-value" style={{ color: accuracyColor }}>
                  {accuracy}%
                </div>
              </div>

              {/* Total Questions */}
              <div className="summary-item">
                <div className="summary-label">Total Questions</div>
                <div className="summary-value">{totalQuestions}</div>
              </div>

              {/* Status */}
              <div className="summary-item">
                <div className="summary-label">Status</div>
                <div className="summary-value" style={{ color: isIncomplete ? '#f59e0b' : '#10b981' }}>
                  {isIncomplete ? 'Incomplete' : 'Completed'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Questions List */}
        <div className="questions-container">
          {quiz.questions.map((attempt, index) => {
            const { question } = attempt;
            const userAnswers = Array.isArray(attempt.userAnswer)
              ? attempt.userAnswer
              : (attempt.userAnswer !== null ? [attempt.userAnswer] : []);

            const correctAnswers = Array.isArray(question.correctAnswer)
              ? question.correctAnswer
              : [question.correctAnswer];

            // Check if partially correct (for multiple-response questions)
            const isPartiallyCorrect = question.questionType === 'multiple' &&
              !attempt.isCorrect &&
              userAnswers.some(ans => correctAnswers.includes(ans)) &&
              userAnswers.length > 0;

            return (
              <div key={attempt.questionId} className="question-section">
                {/* Question Number Header */}
                <div className="question-header">
                  <div className="question-number-badge">
                    {index + 1}
                  </div>
                  <h3 className="question-header-text">Question {index + 1}</h3>
                </div>

                {/* Question Card with Answer Options */}
                <QuestionCard
                  question={question}
                  questionNumber={index + 1}
                  showExplanation={true}
                  selectedAnswer={question.questionType === 'single' ? (userAnswers[0] ?? null) : null}
                  selectedAnswers={question.questionType === 'multiple' ? userAnswers : []}
                />

                {/* Explanation Section */}
                <ExplanationSection
                  question={question}
                  isCorrect={attempt.isCorrect}
                  isPartiallyCorrect={isPartiallyCorrect}
                  selectedAnswer={question.questionType === 'single' ? (userAnswers[0] ?? null) : null}
                  selectedAnswers={question.questionType === 'multiple' ? userAnswers : []}
                />

                {/* Question Metadata */}
                <QuestionMetadata
                  question={question}
                  pointsEarned={attempt.pointsEarned}
                  maxPoints={attempt.maxPoints}
                  confidence={attempt.confidence}
                  reflection={attempt.reflection}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        /* Mobile-first responsive styles */
        .content-wrapper {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 48px);
        }

        .hero-section {
          margin-bottom: clamp(32px, 5vw, 48px);
        }

        .hero-title {
          font-size: clamp(40px, 8vw, 80px);
          font-weight: bold;
          letter-spacing: -0.025em;
          color: '#e5e5e5';
          margin-bottom: clamp(24px, 4vw, 32px);
        }

        .summary-card {
          position: relative;
          background: #0f0f0f;
          border-radius: clamp(16px, 2vw, 24px);
          padding: clamp(24px, 4vw, 40px);
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(16px, 3vw, 24px);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.5vw, 12px);
        }

        .summary-label {
          font-size: clamp(12px, 1.5vw, 14px);
          font-weight: 600;
          color: #a8a8a8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-value {
          font-size: clamp(20px, 3vw, 28px);
          font-weight: bold;
          color: #e5e5e5;
        }

        .questions-container {
          display: flex;
          flex-direction: column;
          gap: clamp(48px, 8vw, 80px);
          padding-bottom: clamp(32px, 5vw, 48px);
        }

        .question-section {
          display: flex;
          flex-direction: column;
          gap: clamp(32px, 5vw, 48px);
        }

        .question-header {
          display: flex;
          align-items: center;
          gap: clamp(12px, 2.5vw, 20px);
        }

        .question-number-badge {
          flex-shrink: 0;
          width: clamp(48px, 8vw, 64px);
          height: clamp(48px, 8vw, 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f0f0f;
          border-radius: 16px;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          font-weight: bold;
          font-size: clamp(20px, 3.5vw, 28px);
          color: #e5e5e5;
        }

        .question-header-text {
          font-size: clamp(24px, 4.5vw, 40px);
          font-weight: bold;
          color: #e5e5e5;
        }

        /* Tablet (768px+) */
        @media (min-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* 4K (1920px+) */
        @media (min-width: 1920px) {
          .content-wrapper {
            max-width: 1600px;
          }
        }
      `}</style>
    </div>
  );
}
