'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import Header from './Header';

export default function Cybersecurity() {
  const { user, loading, userId } = useApp();
  const router = useRouter();
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadDueCount = async () => {
      if (!userId) return;

      try {
        const [allCards, reviews] = await Promise.all([
          getUserFlashcards(userId),
          getUserReviews(userId),
        ]);

        const due = getDueFlashcards(
          reviews,
          allCards.map((c) => c.id)
        );

        setDueFlashcardsCount(due.length);
      } catch (error) {
        console.error('Error loading due flashcards count:', error);
      }
    };

    loadDueCount();
  }, [userId]);

  return (
    <div className="cyber-container">
      {/* Header */}
      <div className="cyber-header">
        <div className="cyber-header-inner">
          <Header />
        </div>
      </div>

      <div className="cyber-content">
        {/* Hero Section */}
        <section className="cyber-hero">
          <div className="cyber-hero-inner">
            {/* Badge */}
            <div className="cyber-badge">
              <svg className="cyber-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              </svg>
              <span>Security+ SY0-701</span>
            </div>

            {/* Headline */}
            <h1 className="cyber-title">
              <span className="cyber-title-primary">
                Master
              </span>
              <br />
              <span className="cyber-title-accent">
                Cybersecurity
              </span>
            </h1>

            {/* Subheadline */}
            <p className="cyber-subtitle">
              Choose your learning path and start building expertise.
            </p>
          </div>
        </section>

        {/* Primary Study Methods */}
        <section className="cyber-primary">
          <div className="cyber-primary-grid">
            {/* Quiz Card */}
            <button
              id="quiz"
              onClick={() => router.push('/cybersecurity/quiz')}
              onMouseEnter={() => setHoveredCard('quiz')}
              onMouseLeave={() => setHoveredCard(null)}
              className="cyber-card cyber-card-quiz"
            >
              <div className="cyber-card-content">
                {/* Icon */}
                <div className="cyber-card-icon cyber-card-icon-violet">
                  <svg className="cyber-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="cyber-card-text">
                  <h2 className="cyber-card-title">Quiz</h2>
                  <p className="cyber-card-desc">
                    Test your knowledge with AI-generated questions and get instant feedback.
                  </p>
                  <div className="cyber-card-cta cyber-card-cta-violet">
                    <span>Start Quiz</span>
                    <svg className={`cyber-arrow ${hoveredCard === 'quiz' ? 'cyber-arrow-active' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Flashcards Card */}
            <button
              id="flashcards"
              onClick={() => router.push('/cybersecurity/flashcards')}
              onMouseEnter={() => setHoveredCard('flashcards')}
              onMouseLeave={() => setHoveredCard(null)}
              className="cyber-card cyber-card-flashcards"
            >
              {/* Due badge */}
              {dueFlashcardsCount > 0 && (
                <div className="cyber-due-badge">
                  <div className="cyber-due-badge-inner">
                    <span className="cyber-due-badge-dot" />
                    {dueFlashcardsCount} due
                  </div>
                </div>
              )}

              <div className="cyber-card-content">
                {/* Icon */}
                <div className="cyber-card-icon cyber-card-icon-cyan">
                  <svg className="cyber-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                {/* Content */}
                <div className="cyber-card-text">
                  <h2 className="cyber-card-title">Flashcards</h2>
                  <p className="cyber-card-desc">
                    Learn with spaced repetition and interleaving for long-term retention.
                  </p>
                  <div className="cyber-card-cta cyber-card-cta-cyan">
                    <span>Study Now</span>
                    <svg className={`cyber-arrow ${hoveredCard === 'flashcards' ? 'cyber-arrow-active' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="cyber-coming-soon">
          <div className="cyber-coming-soon-inner">
            {/* Section Header */}
            <div className="cyber-coming-soon-header">
              <h3 className="cyber-coming-soon-title">
                More features coming soon
              </h3>
              <p className="cyber-coming-soon-subtitle">
                Expanding your learning toolkit
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="cyber-coming-soon-grid">
              {/* Performance-Based Questions */}
              <div className="cyber-soon-card">
                <div className="cyber-soon-card-content">
                  <div className="cyber-soon-icon cyber-soon-icon-emerald">
                    <svg className="cyber-soon-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="cyber-soon-card-text">
                    <h4 className="cyber-soon-card-title">Performance-Based Questions</h4>
                    <p className="cyber-soon-card-desc">
                      Hands-on scenario simulations
                    </p>
                    <div className="cyber-soon-badge">
                      <span className="cyber-soon-badge-dot cyber-soon-badge-dot-emerald" />
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulate Exam */}
              <div className="cyber-soon-card">
                <div className="cyber-soon-card-content">
                  <div className="cyber-soon-icon cyber-soon-icon-orange">
                    <svg className="cyber-soon-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="cyber-soon-card-text">
                    <h4 className="cyber-soon-card-title">Simulate Exam</h4>
                    <p className="cyber-soon-card-desc">
                      Full-length 90-minute practice exam
                    </p>
                    <div className="cyber-soon-badge">
                      <span className="cyber-soon-badge-dot cyber-soon-badge-dot-orange" />
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* =====================================
           DARK NEUMORPHISM / SOFT UI DESIGN
           ===================================== */

        .cyber-container {
          min-height: 100vh;
          background: #0f0f0f;
          color: #e5e5e5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }

        /* === Header === */
        .cyber-header {
          border-bottom: 1px solid #1a1a1a;
        }

        .cyber-header-inner {
          padding: 1rem 1.5rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .cyber-header-inner {
            padding: 1rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .cyber-header-inner {
            padding: 1rem 3rem;
          }
        }

        /* === Content === */
        .cyber-content {
          padding: 3rem 1.5rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .cyber-content {
            padding: 3rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .cyber-content {
            padding: 3rem 3rem;
          }
        }

        /* === Hero === */
        .cyber-hero {
          text-align: center;
          margin-bottom: 4rem;
        }

        @media (min-width: 768px) {
          .cyber-hero {
            margin-bottom: 5rem;
          }
        }

        .cyber-hero-inner {
          max-width: 56rem;
          margin: 0 auto;
        }

        .cyber-badge {
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

        .cyber-badge-icon {
          width: 1rem;
          height: 1rem;
          color: #8b5cf6;
        }

        .cyber-title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        @media (min-width: 640px) {
          .cyber-title {
            font-size: 3.75rem;
          }
        }

        @media (min-width: 768px) {
          .cyber-title {
            font-size: 4.5rem;
          }
        }

        @media (min-width: 1024px) {
          .cyber-title {
            font-size: 6rem;
          }
        }

        .cyber-title-primary {
          color: #e5e5e5;
        }

        .cyber-title-accent {
          color: #8b5cf6;
        }

        .cyber-subtitle {
          font-size: 1.25rem;
          color: #a8a8a8;
          line-height: 1.75;
          max-width: 32rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .cyber-subtitle {
            font-size: 1.5rem;
          }
        }

        /* === Primary Cards === */
        .cyber-primary {
          margin-bottom: 4rem;
        }

        .cyber-primary-grid {
          display: grid;
          gap: 1.5rem;
          max-width: 64rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .cyber-primary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .cyber-card {
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

        .cyber-card:hover {
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          transform: translateY(-2px);
        }

        @media (min-width: 768px) {
          .cyber-card {
            padding: 3rem;
          }
        }

        .cyber-card-content {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .cyber-card-icon {
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

        .cyber-card-icon-violet {
          color: #8b5cf6;
        }

        .cyber-card-icon-cyan {
          color: #06b6d4;
        }

        .cyber-icon-svg {
          width: 2rem;
          height: 2rem;
        }

        .cyber-card-text {
          flex: 1;
          min-width: 0;
        }

        .cyber-card-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #e5e5e5;
        }

        @media (min-width: 768px) {
          .cyber-card-title {
            font-size: 2.25rem;
          }
        }

        .cyber-card-desc {
          font-size: 1.125rem;
          color: #a8a8a8;
          line-height: 1.75;
          margin-bottom: 1rem;
        }

        .cyber-card-cta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .cyber-card-cta-violet {
          color: #8b5cf6;
        }

        .cyber-card-cta-cyan {
          color: #06b6d4;
        }

        .cyber-arrow {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cyber-arrow-active {
          transform: translateX(0.25rem);
        }

        /* === Due Badge === */
        .cyber-due-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
        }

        .cyber-due-badge-inner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: #0f0f0f;
          box-shadow:
            inset 3px 3px 6px #050505,
            inset -3px -3px 6px #191919;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #06b6d4;
        }

        .cyber-due-badge-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          background: #06b6d4;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* === Coming Soon === */
        .cyber-coming-soon-inner {
          max-width: 64rem;
          margin: 0 auto;
        }

        .cyber-coming-soon-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .cyber-coming-soon-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #e5e5e5;
        }

        @media (min-width: 768px) {
          .cyber-coming-soon-title {
            font-size: 2.25rem;
          }
        }

        .cyber-coming-soon-subtitle {
          font-size: 1.125rem;
          color: #a8a8a8;
        }

        .cyber-coming-soon-grid {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .cyber-coming-soon-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .cyber-soon-card {
          padding: 2rem;
          background: #0f0f0f;
          box-shadow:
            inset 6px 6px 12px #050505,
            inset -6px -6px 12px #191919;
          border-radius: 1.5rem;
          opacity: 0.6;
        }

        .cyber-soon-card-content {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .cyber-soon-icon {
          flex-shrink: 0;
          width: 3rem;
          height: 3rem;
          border-radius: 0.5rem;
          background: #0f0f0f;
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cyber-soon-icon-emerald {
          color: #10b981;
        }

        .cyber-soon-icon-orange {
          color: #f97316;
        }

        .cyber-soon-icon-svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .cyber-soon-card-text {
          flex: 1;
          min-width: 0;
        }

        .cyber-soon-card-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #e5e5e5;
        }

        .cyber-soon-card-desc {
          font-size: 1rem;
          color: #666666;
          margin-bottom: 0.75rem;
        }

        .cyber-soon-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.375rem 0.75rem;
          background: #0f0f0f;
          box-shadow:
            inset 3px 3px 6px #050505,
            inset -3px -3px 6px #191919;
          border-radius: 50px;
          color: #a8a8a8;
        }

        .cyber-soon-badge-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .cyber-soon-badge-dot-emerald {
          background: #10b981;
        }

        .cyber-soon-badge-dot-orange {
          background: #f97316;
        }
      `}</style>
    </div>
  );
}
