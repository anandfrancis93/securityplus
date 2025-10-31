'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase';
import { useApp } from './AppProvider';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="md3-loading-screen">
        <div className="md3-loading-spinner"></div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="md3-login-page">
      {/* Top App Bar */}
      <header className="md3-top-app-bar">
        <div className="md3-top-app-bar-container">
          <div className="md3-top-app-bar-section">
            <div className="md3-logo">
              <div className="md3-logo-icon">S+</div>
              <div className="md3-logo-text">
                <span className="md3-logo-title">SecurityPlus AI</span>
                <span className="md3-logo-subtitle">SY0-701 Prep</span>
              </div>
            </div>
          </div>
          <div className="md3-top-app-bar-section">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="md3-button-text"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="md3-hero">
        <div className="md3-container">
          {/* Assist Chip */}
          <div className="md3-chip-assist">
            <svg className="md3-chip-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span>CompTIA Security+ Certification</span>
          </div>

          {/* Display - Large */}
          <h1 className="md3-display-large">
            Master Security+ with adaptive AI learning
          </h1>

          {/* Body - Large */}
          <p className="md3-body-large md3-hero-subtitle">
            Intelligent question generation, real-time analytics, and spaced repetition algorithms
            designed to help you pass the SY0-701 exam with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="md3-button-group">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="md3-button-filled md3-button-large"
            >
              <svg className="md3-button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Authenticating...' : 'Start learning free'}</span>
            </button>
            <button className="md3-button-outlined md3-button-large">
              <span>Learn more</span>
              <svg className="md3-button-icon-trailing" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </button>
          </div>

          {/* Supporting Text */}
          <div className="md3-supporting-text">
            <div className="md3-supporting-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <span>Free forever</span>
            </div>
            <div className="md3-supporting-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <span>No credit card</span>
            </div>
            <div className="md3-supporting-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <span>400+ topics covered</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="md3-error-banner">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <div>
                <div className="md3-error-title">Authentication error</div>
                <div className="md3-error-message">{error}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="md3-stats">
        <div className="md3-container">
          <div className="md3-stats-grid">
            <div className="md3-stat-card">
              <div className="md3-display-medium">400+</div>
              <div className="md3-label-large">Security+ topics</div>
            </div>
            <div className="md3-stat-card">
              <div className="md3-display-medium">AI</div>
              <div className="md3-label-large">Question generation</div>
            </div>
            <div className="md3-stat-card">
              <div className="md3-display-medium">IRT</div>
              <div className="md3-label-large">Ability tracking</div>
            </div>
            <div className="md3-stat-card">
              <div className="md3-display-medium">FSRS</div>
              <div className="md3-label-large">Spaced repetition</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="md3-features">
        <div className="md3-container">
          <h2 className="md3-headline-large">Platform capabilities</h2>
          <p className="md3-body-large md3-section-subtitle">
            Comprehensive learning tools built on proven algorithms
          </p>

          <div className="md3-feature-grid">
            {/* Feature 1 */}
            <div className="md3-card md3-card-filled">
              <div className="md3-card-icon md3-card-icon-purple">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 3v7h7l-10 11v-7H3l10-11z"/>
                </svg>
              </div>
              <h3 className="md3-title-large">AI question generation</h3>
              <p className="md3-body-medium">
                Unlimited unique questions covering all 400+ Security+ topics with deterministic
                difficulty distribution matching real exam patterns.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="md3-card md3-card-filled">
              <div className="md3-card-icon md3-card-icon-blue">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z"/>
                </svg>
              </div>
              <h3 className="md3-title-large">IRT analytics</h3>
              <p className="md3-body-medium">
                Advanced Item Response Theory provides precise ability estimates with confidence
                intervals and score predictions based on your performance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="md3-card md3-card-filled">
              <div className="md3-card-icon md3-card-icon-teal">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                </svg>
              </div>
              <h3 className="md3-title-large">Spaced repetition</h3>
              <p className="md3-body-medium">
                FSRS-powered flashcard system with adaptive scheduling optimizes review
                intervals for maximum long-term retention and recall.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="md3-card md3-card-filled">
              <div className="md3-card-icon md3-card-icon-pink">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              <h3 className="md3-title-large">Exam-aligned format</h3>
              <p className="md3-body-medium">
                Questions mirror actual exam structure with 30% easy, 40% medium, 30% hard
                distribution and both single and multiple-select formats.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="md3-card md3-card-filled">
              <div className="md3-card-icon md3-card-icon-orange">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <h3 className="md3-title-large">Full domain coverage</h3>
              <p className="md3-body-medium">
                Complete coverage of all 5 Security+ domains: General Security Concepts,
                Threats, Architecture, Operations, and Governance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="md3-card md3-card-filled">
              <div className="md3-card-icon md3-card-icon-green">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>
                </svg>
              </div>
              <h3 className="md3-title-large">Detailed explanations</h3>
              <p className="md3-body-medium">
                Comprehensive explanations for every answer option help you understand
                concepts deeply rather than just memorizing facts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="md3-steps">
        <div className="md3-container">
          <h2 className="md3-headline-large">Getting started</h2>
          <p className="md3-body-large md3-section-subtitle">
            Begin your Security+ certification journey in three steps
          </p>

          <div className="md3-steps-list">
            <div className="md3-step-card">
              <div className="md3-step-number">01</div>
              <div className="md3-step-content">
                <h3 className="md3-title-large">Authenticate with Google</h3>
                <p className="md3-body-medium">
                  Single sign-on authentication. No forms, no credit card, no configuration required.
                </p>
              </div>
            </div>

            <div className="md3-step-card">
              <div className="md3-step-number">02</div>
              <div className="md3-step-content">
                <h3 className="md3-title-large">Start adaptive quiz</h3>
                <p className="md3-body-medium">
                  Begin with 10 AI-generated questions calibrated to establish your baseline ability level.
                </p>
              </div>
            </div>

            <div className="md3-step-card">
              <div className="md3-step-number">03</div>
              <div className="md3-step-content">
                <h3 className="md3-title-large">Monitor analytics</h3>
                <p className="md3-body-medium">
                  Track ability progression with IRT-based analytics and confidence intervals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="md3-cta">
        <div className="md3-container">
          <div className="md3-cta-card">
            <h2 className="md3-headline-medium">Ready to begin your certification journey?</h2>
            <p className="md3-body-large">
              Join learners using AI-powered adaptive learning to pass Security+ certification.
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="md3-button-filled md3-button-large"
            >
              <svg className="md3-button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Authenticating...' : 'Get started free'}</span>
            </button>
            <p className="md3-body-small md3-cta-subtitle">
              No credit card required • Free forever • Start in 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="md3-footer">
        <div className="md3-container">
          <div className="md3-footer-content">
            <div className="md3-footer-section">
              <div className="md3-title-medium">SecurityPlus AI</div>
              <p className="md3-body-small">
                AI-powered learning platform for CompTIA Security+ SY0-701 certification
              </p>
            </div>
            <div className="md3-footer-section">
              <div className="md3-label-large md3-footer-heading">Legal</div>
              <a href="#" className="md3-body-small">Privacy policy</a>
              <a href="#" className="md3-body-small">Terms of service</a>
              <a href="#" className="md3-body-small">Cookie policy</a>
            </div>
            <div className="md3-footer-section">
              <div className="md3-label-large md3-footer-heading">Support</div>
              <a href="#" className="md3-body-small">Documentation</a>
              <a href="#" className="md3-body-small">Contact us</a>
              <a href="#" className="md3-body-small">Status</a>
            </div>
          </div>
          <div className="md3-divider"></div>
          <div className="md3-footer-legal">
            <p className="md3-body-small">© 2024 SecurityPlus AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Material Design 3 Theme */
        .md3-login-page {
          min-height: 100vh;
          background: var(--md-sys-color-background, #1c1b1f);
          color: var(--md-sys-color-on-background, #e6e1e5);
          font-family: 'Roboto', system-ui, -apple-system, sans-serif;
        }

        /* Loading Screen */
        .md3-loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--md-sys-color-background, #1c1b1f);
        }

        .md3-loading-spinner {
          width: 64px;
          height: 64px;
          border: 4px solid rgba(208, 188, 255, 0.2);
          border-top-color: #d0bcff;
          border-radius: 50%;
          animation: md3-spin 1s linear infinite;
        }

        @keyframes md3-spin {
          to { transform: rotate(360deg); }
        }

        /* Top App Bar */
        .md3-top-app-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--md-sys-color-surface, #1c1b1f);
          border-bottom: 1px solid var(--md-sys-color-outline-variant, #49454f);
          backdrop-filter: blur(16px);
        }

        .md3-top-app-bar-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .md3-top-app-bar-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .md3-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .md3-logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6750a4 0%, #625b71 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: #fff;
        }

        .md3-logo-text {
          display: flex;
          flex-direction: column;
        }

        .md3-logo-title {
          font-size: 16px;
          font-weight: 500;
          line-height: 1.2;
          color: var(--md-sys-color-on-surface, #e6e1e5);
        }

        .md3-logo-subtitle {
          font-size: 12px;
          color: var(--md-sys-color-on-surface-variant, #cac4d0);
        }

        /* Material Typography Scale */
        .md3-display-large {
          font-size: clamp(3.5rem, 7vw, 7rem);
          font-weight: 400;
          line-height: 1.12;
          letter-spacing: -0.25px;
        }

        .md3-display-medium {
          font-size: 2.8125rem;
          font-weight: 400;
          line-height: 1.15;
        }

        .md3-headline-large {
          font-size: 2rem;
          font-weight: 400;
          line-height: 1.25;
        }

        .md3-headline-medium {
          font-size: 1.75rem;
          font-weight: 400;
          line-height: 1.29;
        }

        .md3-title-large {
          font-size: 1.375rem;
          font-weight: 400;
          line-height: 1.27;
        }

        .md3-title-medium {
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.5;
          letter-spacing: 0.15px;
        }

        .md3-body-large {
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: 0.5px;
          color: var(--md-sys-color-on-surface-variant, #cac4d0);
        }

        .md3-body-medium {
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.43;
          letter-spacing: 0.25px;
          color: var(--md-sys-color-on-surface-variant, #cac4d0);
        }

        .md3-body-small {
          font-size: 0.75rem;
          font-weight: 400;
          line-height: 1.33;
          letter-spacing: 0.4px;
          color: var(--md-sys-color-on-surface-variant, #cac4d0);
        }

        .md3-label-large {
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.43;
          letter-spacing: 0.1px;
          text-transform: uppercase;
        }

        /* Container */
        .md3-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Hero Section */
        .md3-hero {
          padding: 80px 0 120px;
          text-align: center;
        }

        .md3-hero .md3-container {
          max-width: 900px;
        }

        .md3-chip-assist {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: var(--md-sys-color-surface-container-high, #2b2930);
          border: 1px solid var(--md-sys-color-outline, #938f99);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 32px;
        }

        .md3-chip-icon {
          width: 18px;
          height: 18px;
          fill: var(--md-sys-color-primary, #d0bcff);
        }

        .md3-hero-subtitle {
          max-width: 720px;
          margin: 24px auto 48px;
        }

        /* Buttons */
        .md3-button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .md3-button-filled,
        .md3-button-outlined,
        .md3-button-text {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.1px;
          cursor: pointer;
          border: none;
          transition: all 200ms cubic-bezier(0.2, 0, 0, 1);
          position: relative;
          overflow: hidden;
        }

        .md3-button-large {
          padding: 16px 32px;
          font-size: 1rem;
          border-radius: 28px;
        }

        .md3-button-filled {
          background: var(--md-sys-color-primary, #d0bcff);
          color: var(--md-sys-color-on-primary, #381e72);
          box-shadow: 0 1px 3px 1px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.3);
        }

        .md3-button-filled:hover:not(:disabled) {
          box-shadow: 0 2px 6px 2px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.3);
          background: #e8def8;
        }

        .md3-button-filled:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .md3-button-outlined {
          background: transparent;
          color: var(--md-sys-color-primary, #d0bcff);
          border: 1px solid var(--md-sys-color-outline, #938f99);
        }

        .md3-button-outlined:hover {
          background: rgba(208, 188, 255, 0.08);
        }

        .md3-button-text {
          background: transparent;
          color: var(--md-sys-color-primary, #d0bcff);
          padding: 10px 12px;
        }

        .md3-button-text:hover {
          background: rgba(208, 188, 255, 0.08);
        }

        .md3-button-icon {
          width: 18px;
          height: 18px;
        }

        .md3-button-icon-trailing {
          width: 18px;
          height: 18px;
        }

        /* Supporting Text */
        .md3-supporting-text {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--md-sys-color-outline-variant, #49454f);
        }

        .md3-supporting-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant, #cac4d0);
        }

        .md3-supporting-item svg {
          width: 18px;
          height: 18px;
          fill: var(--md-sys-color-tertiary, #efb8c8);
        }

        /* Error Banner */
        .md3-error-banner {
          display: flex;
          gap: 16px;
          padding: 16px;
          margin-top: 24px;
          background: var(--md-sys-color-error-container, #93000a);
          color: var(--md-sys-color-on-error-container, #ffdad6);
          border-radius: 12px;
          text-align: left;
        }

        .md3-error-banner svg {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .md3-error-title {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .md3-error-message {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        /* Stats Section */
        .md3-stats {
          background: var(--md-sys-color-surface-container-low, #1d1b20);
          padding: 64px 0;
          border-top: 1px solid var(--md-sys-color-outline-variant, #49454f);
        }

        .md3-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 32px;
        }

        .md3-stat-card {
          text-align: center;
          padding: 24px;
        }

        .md3-stat-card .md3-display-medium {
          margin-bottom: 8px;
          color: var(--md-sys-color-primary, #d0bcff);
        }

        /* Features Section */
        .md3-features {
          padding: 96px 0;
        }

        .md3-section-subtitle {
          max-width: 720px;
          margin: 16px auto 64px;
          text-align: center;
        }

        .md3-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .md3-card {
          background: var(--md-sys-color-surface-container, #211f26);
          border-radius: 12px;
          padding: 24px;
          transition: all 200ms cubic-bezier(0.2, 0, 0, 1);
        }

        .md3-card-filled {
          background: var(--md-sys-color-surface-container-highest, #36343b);
        }

        .md3-card:hover {
          box-shadow: 0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.3);
        }

        .md3-card-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .md3-card-icon svg {
          width: 32px;
          height: 32px;
          fill: white;
        }

        .md3-card-icon-purple { background: #6750a4; }
        .md3-card-icon-blue { background: #0061a4; }
        .md3-card-icon-teal { background: #006a6a; }
        .md3-card-icon-pink { background: #7d5260; }
        .md3-card-icon-orange { background: #9a4521; }
        .md3-card-icon-green { background: #006e1c; }

        .md3-card h3 {
          margin-bottom: 12px;
          color: var(--md-sys-color-on-surface, #e6e1e5);
        }

        /* Steps Section */
        .md3-steps {
          padding: 96px 0;
          background: var(--md-sys-color-surface-container-low, #1d1b20);
        }

        .md3-steps-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 800px;
          margin: 64px auto 0;
        }

        .md3-step-card {
          display: flex;
          gap: 24px;
          padding: 32px;
          background: var(--md-sys-color-surface-container, #211f26);
          border-radius: 16px;
          border-left: 4px solid var(--md-sys-color-primary, #d0bcff);
        }

        .md3-step-number {
          font-size: 3rem;
          font-weight: 300;
          color: var(--md-sys-color-primary, #d0bcff);
          min-width: 80px;
        }

        .md3-step-content h3 {
          margin-bottom: 8px;
          color: var(--md-sys-color-on-surface, #e6e1e5);
        }

        /* CTA Section */
        .md3-cta {
          padding: 96px 0;
        }

        .md3-cta-card {
          max-width: 720px;
          margin: 0 auto;
          padding: 64px 48px;
          background: var(--md-sys-color-surface-container-high, #2b2930);
          border-radius: 28px;
          text-align: center;
        }

        .md3-cta-card h2 {
          margin-bottom: 16px;
        }

        .md3-cta-card p {
          margin-bottom: 32px;
        }

        .md3-cta-subtitle {
          margin-top: 16px;
          color: var(--md-sys-color-outline, #938f99);
        }

        /* Footer */
        .md3-footer {
          background: var(--md-sys-color-surface-container-low, #1d1b20);
          padding: 64px 0 32px;
          border-top: 1px solid var(--md-sys-color-outline-variant, #49454f);
        }

        .md3-footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 48px;
          margin-bottom: 32px;
        }

        .md3-footer-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .md3-footer-heading {
          color: var(--md-sys-color-on-surface, #e6e1e5);
          margin-bottom: 8px;
        }

        .md3-footer-section a {
          color: var(--md-sys-color-primary, #d0bcff);
          text-decoration: none;
          transition: color 200ms;
        }

        .md3-footer-section a:hover {
          color: #e8def8;
        }

        .md3-divider {
          height: 1px;
          background: var(--md-sys-color-outline-variant, #49454f);
          margin: 32px 0;
        }

        .md3-footer-legal {
          text-align: center;
          color: var(--md-sys-color-outline, #938f99);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .md3-hero {
            padding: 48px 0 80px;
          }

          .md3-button-group {
            flex-direction: column;
            width: 100%;
          }

          .md3-button-group button {
            width: 100%;
          }

          .md3-step-card {
            flex-direction: column;
          }

          .md3-step-number {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}
