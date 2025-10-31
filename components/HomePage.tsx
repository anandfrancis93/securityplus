'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';
import Header from './Header';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useApp();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-inner">
          <Header />
        </div>
      </div>

      <div className="home-content">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="home-hero-inner">
            {/* Welcome Badge */}
            <div className="home-badge">
              <div className="home-badge-dot" />
              <span>Welcome back, {user?.displayName?.split(' ')[0] || 'Learner'}</span>
            </div>

            {/* Headline */}
            <h1 className="home-title">
              <span className="home-title-primary">
                Learn without
              </span>
              <br />
              <span className="home-title-accent">
                limits.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="home-subtitle">
              Your adaptive learning companion powered by AI.
            </p>
          </div>
        </section>

        {/* Featured Subject - Cybersecurity */}
        <section className="home-featured">
          <div className="home-featured-inner">
            <button
              id="cybersecurity"
              onClick={() => router.push('/cybersecurity')}
              onMouseEnter={() => setHoveredCard('cybersecurity')}
              onMouseLeave={() => setHoveredCard(null)}
              className="home-featured-card"
            >
              <div className="home-featured-content">
                {/* Icon */}
                <div className="home-featured-icon">
                  <svg className="home-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                    <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
                  </svg>
                </div>

                {/* Content */}
                <div className="home-featured-text">
                  <h2 className="home-featured-title">Cybersecurity</h2>
                  <p className="home-featured-desc">
                    Master security concepts and best practices with AI-powered quizzes, adaptive flashcards, and comprehensive learning tools.
                  </p>
                  <div className="home-featured-cta">
                    <span>Start Learning</span>
                    <svg className={`home-arrow ${hoveredCard === 'cybersecurity' ? 'home-arrow-active' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Coming Soon Subjects */}
        <section className="home-subjects">
          <div className="home-subjects-inner">
            {/* Section Header */}
            <div className="home-subjects-header">
              <h3 className="home-subjects-title">
                More subjects coming soon
              </h3>
              <p className="home-subjects-subtitle">
                Expanding your learning possibilities
              </p>
            </div>

            {/* Subject Cards Grid */}
            <div className="home-subjects-grid">
              {/* Networking */}
              <div className="home-subject-card">
                <div className="home-subject-icon home-subject-icon-cyan">
                  <svg className="home-subject-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                    <path strokeLinecap="round" d="M2 12h20" />
                    <ellipse cx="12" cy="12" rx="4" ry="10" strokeLinecap="round" />
                  </svg>
                </div>
                <h4 className="home-subject-title">Networking</h4>
                <p className="home-subject-desc">
                  Network protocols
                </p>
                <div className="home-subject-badge">
                  <span className="home-subject-badge-dot home-subject-badge-dot-cyan" />
                  Coming Soon
                </div>
              </div>

              {/* Maths */}
              <div className="home-subject-card">
                <div className="home-subject-icon home-subject-icon-emerald">
                  <svg className="home-subject-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h3M8.5 7.5v3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3" />
                  </svg>
                </div>
                <h4 className="home-subject-title">Maths</h4>
                <p className="home-subject-desc">
                  Problem solving
                </p>
                <div className="home-subject-badge">
                  <span className="home-subject-badge-dot home-subject-badge-dot-emerald" />
                  Coming Soon
                </div>
              </div>

              {/* Physics */}
              <div className="home-subject-card">
                <div className="home-subject-icon home-subject-icon-rose">
                  <svg className="home-subject-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.9}>
                    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                    <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" />
                    <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(-60 12 12)" />
                  </svg>
                </div>
                <h4 className="home-subject-title">Physics</h4>
                <p className="home-subject-desc">
                  Physical laws
                </p>
                <div className="home-subject-badge">
                  <span className="home-subject-badge-dot home-subject-badge-dot-rose" />
                  Coming Soon
                </div>
              </div>

              {/* English */}
              <div className="home-subject-card">
                <div className="home-subject-icon home-subject-icon-amber">
                  <svg className="home-subject-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                </div>
                <h4 className="home-subject-title">English</h4>
                <p className="home-subject-desc">
                  Language arts
                </p>
                <div className="home-subject-badge">
                  <span className="home-subject-badge-dot home-subject-badge-dot-amber" />
                  Coming Soon
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

        .home-container {
          min-height: 100vh;
          background: #0f0f0f;
          color: #e5e5e5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }

        /* === Header === */
        .home-header {
          border-bottom: 1px solid #1a1a1a;
        }

        .home-header-inner {
          padding: 1rem 1.5rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .home-header-inner {
            padding: 1rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .home-header-inner {
            padding: 1rem 3rem;
          }
        }

        /* === Content === */
        .home-content {
          padding: 3rem 1.5rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .home-content {
            padding: 3rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .home-content {
            padding: 3rem 3rem;
          }
        }

        /* === Hero === */
        .home-hero {
          text-align: center;
          margin-bottom: 4rem;
        }

        @media (min-width: 768px) {
          .home-hero {
            margin-bottom: 5rem;
          }
        }

        .home-hero-inner {
          max-width: 56rem;
          margin: 0 auto;
        }

        .home-badge {
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

        .home-badge-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: #22c55e;
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

        .home-title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        @media (min-width: 640px) {
          .home-title {
            font-size: 3.75rem;
          }
        }

        @media (min-width: 768px) {
          .home-title {
            font-size: 4.5rem;
          }
        }

        @media (min-width: 1024px) {
          .home-title {
            font-size: 6rem;
          }
        }

        .home-title-primary {
          color: #e5e5e5;
        }

        .home-title-accent {
          color: #8b5cf6;
        }

        .home-subtitle {
          font-size: 1.25rem;
          color: #a8a8a8;
          line-height: 1.75;
          max-width: 32rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .home-subtitle {
            font-size: 1.5rem;
          }
        }

        /* === Featured === */
        .home-featured {
          margin-bottom: 4rem;
        }

        .home-featured-inner {
          max-width: 64rem;
          margin: 0 auto;
        }

        .home-featured-card {
          width: 100%;
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

        .home-featured-card:hover {
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          transform: translateY(-4px);
        }

        @media (min-width: 768px) {
          .home-featured-card {
            padding: 3rem;
          }
        }

        .home-featured-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .home-featured-content {
            flex-direction: row;
          }
        }

        .home-featured-icon {
          flex-shrink: 0;
          width: 5rem;
          height: 5rem;
          border-radius: 0.75rem;
          background: #0f0f0f;
          box-shadow:
            8px 8px 16px #050505,
            -8px -8px 16px #191919;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
        }

        @media (min-width: 768px) {
          .home-featured-icon {
            width: 6rem;
            height: 6rem;
          }
        }

        .home-icon-svg {
          width: 3rem;
          height: 3rem;
        }

        @media (min-width: 768px) {
          .home-icon-svg {
            width: 3.5rem;
            height: 3.5rem;
          }
        }

        .home-featured-text {
          flex: 1;
          text-align: center;
        }

        @media (min-width: 768px) {
          .home-featured-text {
            text-align: left;
          }
        }

        .home-featured-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #e5e5e5;
        }

        @media (min-width: 768px) {
          .home-featured-title {
            font-size: 3rem;
          }
        }

        .home-featured-desc {
          font-size: 1.125rem;
          color: #a8a8a8;
          line-height: 1.75;
          margin-bottom: 1rem;
        }

        .home-featured-cta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #8b5cf6;
          font-weight: 500;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .home-featured-cta {
            justify-content: flex-start;
          }
        }

        .home-arrow {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .home-arrow-active {
          transform: translateX(0.25rem);
        }

        /* === Subjects === */
        .home-subjects-inner {
          max-width: 64rem;
          margin: 0 auto;
        }

        .home-subjects-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .home-subjects-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #e5e5e5;
        }

        @media (min-width: 768px) {
          .home-subjects-title {
            font-size: 2.25rem;
          }
        }

        .home-subjects-subtitle {
          font-size: 1.125rem;
          color: #a8a8a8;
        }

        .home-subjects-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .home-subjects-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }
        }

        .home-subject-card {
          padding: 1.5rem;
          background: #0f0f0f;
          box-shadow:
            inset 6px 6px 12px #050505,
            inset -6px -6px 12px #191919;
          border-radius: 1.5rem;
          opacity: 0.6;
        }

        .home-subject-icon {
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          background: #0f0f0f;
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          margin-bottom: 1rem;
        }

        .home-subject-icon-svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .home-subject-icon-cyan {
          color: #06b6d4;
        }

        .home-subject-icon-emerald {
          color: #10b981;
        }

        .home-subject-icon-rose {
          color: #f43f5e;
        }

        .home-subject-icon-amber {
          color: #f59e0b;
        }

        .home-subject-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #e5e5e5;
        }

        @media (min-width: 768px) {
          .home-subject-title {
            font-size: 1.25rem;
          }
        }

        .home-subject-desc {
          font-size: 0.875rem;
          color: #666666;
          margin-bottom: 1rem;
        }

        .home-subject-badge {
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

        .home-subject-badge-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .home-subject-badge-dot-cyan {
          background: #06b6d4;
        }

        .home-subject-badge-dot-emerald {
          background: #10b981;
        }

        .home-subject-badge-dot-rose {
          background: #f43f5e;
        }

        .home-subject-badge-dot-amber {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
}
