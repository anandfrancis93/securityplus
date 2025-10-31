'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import Header from './Header';

export default function QuizOptions() {
  const { user, loading } = useApp();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <div className="quiz-options-container">
      {/* Header */}
      <div className="quiz-options-header">
        <div className="quiz-options-header-inner">
          <Header />
        </div>
      </div>

      <div className="quiz-options-content">
        {/* Hero Section */}
        <section className="quiz-options-hero">
          <div className="quiz-options-hero-inner">
            {/* Badge */}
            <div className="quiz-options-badge">
              <svg className="quiz-options-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Quiz Mode</span>
            </div>

            {/* Headline */}
            <h1 className="quiz-options-title">
              <span className="quiz-options-title-primary">
                Test your
              </span>
              <br />
              <span className="quiz-options-title-accent">
                knowledge
              </span>
            </h1>

            {/* Subheadline */}
            <p className="quiz-options-subtitle">
              Choose how you want to challenge yourself.
            </p>
          </div>
        </section>

        {/* Quiz Options */}
        <section className="quiz-options-main">
          <div className="quiz-options-grid">
            {/* Start New Quiz */}
            <button
              id="start-new-quiz"
              onClick={() => router.push('/cybersecurity/quiz/start')}
              onMouseEnter={() => setHoveredCard('start-new-quiz')}
              onMouseLeave={() => setHoveredCard(null)}
              className="quiz-options-card"
            >
              <div className="quiz-options-card-content">
                {/* Icon */}
                <div className="quiz-options-card-icon quiz-options-card-icon-violet">
                  <svg className="quiz-options-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="quiz-options-card-text">
                  <h2 className="quiz-options-card-title">Start New Quiz</h2>
                  <p className="quiz-options-card-desc">
                    Take a fresh quiz with 10 AI-generated questions. Perfect for building knowledge and tracking your progress.
                  </p>
                  <div className="quiz-options-card-cta quiz-options-card-cta-violet">
                    <span>Configure Quiz</span>
                    <svg className={`quiz-options-arrow ${hoveredCard === 'start-new-quiz' ? 'quiz-options-arrow-active' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Quiz History */}
            <button
              id="quiz-history"
              onClick={() => router.push('/cybersecurity/quiz/history')}
              onMouseEnter={() => setHoveredCard('quiz-history')}
              onMouseLeave={() => setHoveredCard(null)}
              className="quiz-options-card"
            >
              <div className="quiz-options-card-content">
                {/* Icon */}
                <div className="quiz-options-card-icon quiz-options-card-icon-cyan">
                  <svg className="quiz-options-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="quiz-options-card-text">
                  <h2 className="quiz-options-card-title">Quiz History</h2>
                  <p className="quiz-options-card-desc">
                    Review your past quizzes, revisit questions, and analyze your performance over time.
                  </p>
                  <div className="quiz-options-card-cta quiz-options-card-cta-cyan">
                    <span>View History</span>
                    <svg className={`quiz-options-arrow ${hoveredCard === 'quiz-history' ? 'quiz-options-arrow-active' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Performance Section */}
        <section className="quiz-options-performance">
          <div className="quiz-options-performance-inner">
            <button
              id="performance"
              onClick={() => router.push('/cybersecurity/performance')}
              onMouseEnter={() => setHoveredCard('performance')}
              onMouseLeave={() => setHoveredCard(null)}
              className="quiz-options-performance-card"
            >
              <div className="quiz-options-card-content">
                {/* Icon */}
                <div className="quiz-options-card-icon quiz-options-card-icon-emerald">
                  <svg className="quiz-options-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="quiz-options-card-text">
                  <h2 className="quiz-options-card-title">Performance Analytics</h2>
                  <p className="quiz-options-card-desc">
                    View detailed analytics, ability estimates, confidence intervals, and performance graphs across topics and domains.
                  </p>
                  <div className="quiz-options-card-cta quiz-options-card-cta-emerald">
                    <span>View Analytics</span>
                    <svg className={`quiz-options-arrow ${hoveredCard === 'performance' ? 'quiz-options-arrow-active' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* =====================================
           DARK NEUMORPHISM / SOFT UI DESIGN
           ===================================== */

        .quiz-options-container {
          min-height: 100vh;
          background: #0f0f0f;
          color: #e5e5e5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }

        /* === Header === */
        .quiz-options-header {
          border-bottom: 1px solid #1a1a1a;
        }

        .quiz-options-header-inner {
          padding: 1rem 1.5rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .quiz-options-header-inner {
            padding: 1rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .quiz-options-header-inner {
            padding: 1rem 3rem;
          }
        }

        /* === Content === */
        .quiz-options-content {
          padding: 3rem 1.5rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .quiz-options-content {
            padding: 3rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .quiz-options-content {
            padding: 3rem 3rem;
          }
        }

        /* === Hero === */
        .quiz-options-hero {
          text-align: center;
          margin-bottom: 4rem;
        }

        @media (min-width: 768px) {
          .quiz-options-hero {
            margin-bottom: 5rem;
          }
        }

        .quiz-options-hero-inner {
          max-width: 56rem;
          margin: 0 auto;
        }

        .quiz-options-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #0f0f0f;
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 2rem;
          color: #a8a8a8;
        }

        .quiz-options-badge-icon {
          width: 1rem;
          height: 1rem;
          color: #8b5cf6;
        }

        .quiz-options-title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        @media (min-width: 640px) {
          .quiz-options-title {
            font-size: 3.75rem;
          }
        }

        @media (min-width: 768px) {
          .quiz-options-title {
            font-size: 4.5rem;
          }
        }

        @media (min-width: 1024px) {
          .quiz-options-title {
            font-size: 6rem;
          }
        }

        .quiz-options-title-primary {
          color: #e5e5e5;
        }

        .quiz-options-title-accent {
          color: #8b5cf6;
        }

        .quiz-options-subtitle {
          font-size: 1.25rem;
          color: #a8a8a8;
          line-height: 1.75;
          max-width: 32rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .quiz-options-subtitle {
            font-size: 1.5rem;
          }
        }

        /* === Main Section === */
        .quiz-options-main {
          margin-bottom: 4rem;
        }

        .quiz-options-grid {
          display: grid;
          gap: 1.5rem;
          max-width: 64rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .quiz-options-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* === Cards === */
        .quiz-options-card {
          position: relative;
          padding: 2.5rem;
          background: #0f0f0f;
          box-shadow:
            12px 12px 24px #050505,
            -12px -12px 24px #191919;
          border-radius: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          border: none;
          cursor: pointer;
          color: inherit;
        }

        .quiz-options-card:hover {
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          transform: translateY(-2px);
        }

        @media (min-width: 768px) {
          .quiz-options-card {
            padding: 3rem;
          }
        }

        .quiz-options-card-content {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .quiz-options-card-icon {
          flex-shrink: 0;
          width: 4rem;
          height: 4rem;
          border-radius: 0.75rem;
          background: #0f0f0f;
          box-shadow:
            8px 8px 16px #050505,
            -8px -8px 16px #191919;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quiz-options-card-icon-violet {
          color: #8b5cf6;
        }

        .quiz-options-card-icon-cyan {
          color: #06b6d4;
        }

        .quiz-options-card-icon-emerald {
          color: #10b981;
        }

        .quiz-options-icon-svg {
          width: 2rem;
          height: 2rem;
        }

        .quiz-options-card-text {
          flex: 1;
          min-width: 0;
        }

        .quiz-options-card-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #e5e5e5;
        }

        @media (min-width: 768px) {
          .quiz-options-card-title {
            font-size: 2.25rem;
          }
        }

        .quiz-options-card-desc {
          font-size: 1.125rem;
          color: #a8a8a8;
          line-height: 1.75;
          margin-bottom: 1rem;
        }

        .quiz-options-card-cta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .quiz-options-card-cta-violet {
          color: #8b5cf6;
        }

        .quiz-options-card-cta-cyan {
          color: #06b6d4;
        }

        .quiz-options-card-cta-emerald {
          color: #10b981;
        }

        .quiz-options-arrow {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quiz-options-arrow-active {
          transform: translateX(0.25rem);
        }

        /* === Performance Section === */
        .quiz-options-performance-inner {
          max-width: 64rem;
          margin: 0 auto;
        }

        .quiz-options-performance-card {
          width: 100%;
          position: relative;
          padding: 2.5rem;
          background: #0f0f0f;
          box-shadow:
            12px 12px 24px #050505,
            -12px -12px 24px #191919;
          border-radius: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          border: none;
          cursor: pointer;
          color: inherit;
        }

        .quiz-options-performance-card:hover {
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          transform: translateY(-2px);
        }

        @media (min-width: 768px) {
          .quiz-options-performance-card {
            padding: 3rem;
          }
        }
      `}</style>
    </div>
  );
}
