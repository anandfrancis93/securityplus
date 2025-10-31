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
      <div className="apple-loading-screen">
        <div className="apple-spinner"></div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="apple-login-page">
      {/* Navigation Bar */}
      <nav className="apple-navbar">
        <div className="apple-navbar-content">
          <div className="apple-logo-section">
            <div className="apple-logo-icon">S+</div>
            <span className="apple-logo-text">SecurityPlus AI</span>
          </div>
          <button onClick={handleGoogleSignIn} disabled={loading} className="apple-nav-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="apple-hero">
        <div className="apple-container">
          {/* Badge */}
          <div className="apple-badge">
            <svg className="apple-badge-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span>SY0-701 Certification</span>
          </div>

          {/* Large Title - iOS Style */}
          <h1 className="apple-title-large">
            Master Security+.
            <br />
            Learn with AI.
          </h1>

          {/* Subtitle */}
          <p className="apple-subtitle">
            Intelligent adaptive learning with real-time analytics and spaced repetition to help you pass the exam.
          </p>

          {/* CTA Buttons */}
          <div className="apple-button-group">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="apple-button-primary apple-button-large"
            >
              <svg className="apple-button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Signing In...' : 'Get Started for Free'}</span>
            </button>
            <button className="apple-button-secondary apple-button-large">
              Learn More
            </button>
          </div>

          {/* Features List */}
          <div className="apple-feature-list">
            <div className="apple-feature-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <span>Free forever</span>
            </div>
            <div className="apple-feature-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="apple-feature-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <span>400+ topics</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="apple-alert apple-alert-error">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <div>
                <div className="apple-alert-title">Authentication Failed</div>
                <div className="apple-alert-message">{error}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="apple-stats">
        <div className="apple-container">
          <div className="apple-stats-grid">
            <div className="apple-stat-card">
              <div className="apple-stat-number">400+</div>
              <div className="apple-stat-label">Security+ Topics</div>
            </div>
            <div className="apple-stat-card">
              <div className="apple-stat-number">AI</div>
              <div className="apple-stat-label">Question Generation</div>
            </div>
            <div className="apple-stat-card">
              <div className="apple-stat-number">IRT</div>
              <div className="apple-stat-label">Ability Tracking</div>
            </div>
            <div className="apple-stat-card">
              <div className="apple-stat-number">FSRS</div>
              <div className="apple-stat-label">Spaced Repetition</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="apple-features">
        <div className="apple-container">
          <div className="apple-section-header">
            <h2 className="apple-title-section">Everything you need to pass.</h2>
            <p className="apple-section-subtitle">
              Comprehensive learning tools built on proven algorithms.
            </p>
          </div>

          <div className="apple-feature-grid">
            {/* Feature 1 */}
            <div className="apple-card">
              <div className="apple-card-icon apple-card-icon-blue">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 3v7h7l-10 11v-7H3l10-11z"/>
                </svg>
              </div>
              <h3 className="apple-card-title">AI Question Generation</h3>
              <p className="apple-card-text">
                Unlimited unique questions covering all 400+ Security+ topics with balanced difficulty distribution.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="apple-card">
              <div className="apple-card-icon apple-card-icon-purple">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z"/>
                </svg>
              </div>
              <h3 className="apple-card-title">IRT Analytics</h3>
              <p className="apple-card-text">
                Precise ability estimates with confidence intervals and score predictions based on Item Response Theory.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="apple-card">
              <div className="apple-card-icon apple-card-icon-green">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                </svg>
              </div>
              <h3 className="apple-card-title">Spaced Repetition</h3>
              <p className="apple-card-text">
                FSRS-powered adaptive scheduling optimizes review intervals for maximum long-term retention.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="apple-card">
              <div className="apple-card-icon apple-card-icon-orange">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              <h3 className="apple-card-title">Exam-Aligned Format</h3>
              <p className="apple-card-text">
                Questions mirror actual exam structure with 30% easy, 40% medium, 30% hard distribution.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="apple-card">
              <div className="apple-card-icon apple-card-icon-teal">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <h3 className="apple-card-title">Full Domain Coverage</h3>
              <p className="apple-card-text">
                Complete coverage of all 5 Security+ domains: Concepts, Threats, Architecture, Operations, Governance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="apple-card">
              <div className="apple-card-icon apple-card-icon-pink">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>
                </svg>
              </div>
              <h3 className="apple-card-title">Detailed Explanations</h3>
              <p className="apple-card-text">
                Comprehensive explanations for every answer option help you understand concepts deeply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="apple-steps">
        <div className="apple-container">
          <div className="apple-section-header">
            <h2 className="apple-title-section">Three steps to get started.</h2>
            <p className="apple-section-subtitle">
              Begin your certification journey in under a minute.
            </p>
          </div>

          <div className="apple-steps-list">
            <div className="apple-step">
              <div className="apple-step-number">1</div>
              <div className="apple-step-content">
                <h3 className="apple-step-title">Sign in with Google</h3>
                <p className="apple-step-text">
                  One-click authentication. No forms, no credit card required.
                </p>
              </div>
            </div>

            <div className="apple-step">
              <div className="apple-step-number">2</div>
              <div className="apple-step-content">
                <h3 className="apple-step-title">Take your first quiz</h3>
                <p className="apple-step-text">
                  Start with 10 AI-generated questions tailored to your level.
                </p>
              </div>
            </div>

            <div className="apple-step">
              <div className="apple-step-number">3</div>
              <div className="apple-step-content">
                <h3 className="apple-step-title">Track your progress</h3>
                <p className="apple-step-text">
                  Monitor your ability score with detailed analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="apple-cta">
        <div className="apple-container">
          <div className="apple-cta-card">
            <h2 className="apple-cta-title">Ready to ace Security+?</h2>
            <p className="apple-cta-subtitle">
              Join learners worldwide using AI-powered adaptive learning.
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="apple-button-primary apple-button-large"
            >
              <svg className="apple-button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Signing In...' : 'Get Started Free'}</span>
            </button>
            <p className="apple-cta-note">Free forever • No credit card • Start in 30 seconds</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="apple-footer">
        <div className="apple-container">
          <div className="apple-footer-content">
            <div className="apple-footer-section">
              <div className="apple-footer-heading">SecurityPlus AI</div>
              <p className="apple-footer-text">
                AI-powered learning for CompTIA Security+ SY0-701
              </p>
            </div>
            <div className="apple-footer-section">
              <div className="apple-footer-label">Legal</div>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookies</a>
            </div>
            <div className="apple-footer-section">
              <div className="apple-footer-label">Support</div>
              <a href="#">Documentation</a>
              <a href="#">Contact</a>
              <a href="#">Status</a>
            </div>
          </div>
          <div className="apple-footer-legal">
            <p>© 2024 SecurityPlus AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Apple Design System */
        .apple-login-page {
          min-height: 100vh;
          background: #000000;
          color: #f5f5f7;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Loading Screen */
        .apple-loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
        }

        .apple-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #0071e3;
          border-radius: 50%;
          animation: apple-spin 0.8s linear infinite;
        }

        @keyframes apple-spin {
          to { transform: rotate(360deg); }
        }

        /* Navigation Bar */
        .apple-navbar {
          position: sticky;
          top: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
        }

        .apple-navbar-content {
          max-width: 980px;
          margin: 0 auto;
          padding: 0 22px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .apple-logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .apple-logo-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          color: #fff;
        }

        .apple-logo-text {
          font-size: 17px;
          font-weight: 600;
          color: #f5f5f7;
          letter-spacing: -0.022em;
        }

        .apple-nav-button {
          background: transparent;
          border: none;
          color: #2997ff;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 980px;
          transition: background 0.2s;
        }

        .apple-nav-button:hover {
          background: rgba(41, 151, 255, 0.1);
        }

        .apple-nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Container */
        .apple-container {
          max-width: 980px;
          margin: 0 auto;
          padding: 0 22px;
        }

        /* Hero Section */
        .apple-hero {
          padding: 88px 0 110px;
          text-align: center;
        }

        .apple-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 980px;
          font-size: 12px;
          font-weight: 500;
          color: #86868b;
          margin-bottom: 24px;
          letter-spacing: -0.01em;
        }

        .apple-badge-icon {
          width: 14px;
          height: 14px;
          fill: #2997ff;
        }

        /* Apple Typography */
        .apple-title-large {
          font-size: clamp(48px, 6vw, 80px);
          font-weight: 600;
          line-height: 1.05;
          letter-spacing: -0.015em;
          color: #f5f5f7;
          margin: 0 0 28px;
        }

        .apple-subtitle {
          font-size: 21px;
          line-height: 1.381;
          font-weight: 400;
          color: #a1a1a6;
          letter-spacing: 0.011em;
          max-width: 640px;
          margin: 0 auto 48px;
        }

        /* Buttons */
        .apple-button-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .apple-button-primary,
        .apple-button-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 980px;
          font-size: 17px;
          font-weight: 400;
          letter-spacing: -0.022em;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          min-width: 280px;
        }

        .apple-button-large {
          padding: 14px 28px;
          font-size: 17px;
        }

        .apple-button-primary {
          background: #0071e3;
          color: #fff;
        }

        .apple-button-primary:hover:not(:disabled) {
          background: #0077ed;
        }

        .apple-button-primary:active:not(:disabled) {
          background: #006edb;
        }

        .apple-button-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .apple-button-secondary {
          background: transparent;
          color: #2997ff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .apple-button-secondary:hover {
          background: rgba(41, 151, 255, 0.08);
        }

        .apple-button-icon {
          width: 16px;
          height: 16px;
        }

        /* Feature List */
        .apple-feature-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
          padding-top: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .apple-feature-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #a1a1a6;
        }

        .apple-feature-item svg {
          width: 16px;
          height: 16px;
          fill: #30d158;
        }

        /* Alert */
        .apple-alert {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          margin-top: 32px;
          border-radius: 18px;
          text-align: left;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .apple-alert-error {
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.2);
        }

        .apple-alert svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          fill: #ff3b30;
        }

        .apple-alert-title {
          font-size: 15px;
          font-weight: 600;
          color: #ff3b30;
          margin-bottom: 4px;
        }

        .apple-alert-message {
          font-size: 14px;
          color: #f5f5f7;
          opacity: 0.8;
        }

        /* Stats Section */
        .apple-stats {
          background: rgba(255, 255, 255, 0.02);
          padding: 66px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .apple-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 40px;
        }

        .apple-stat-card {
          text-align: center;
        }

        .apple-stat-number {
          font-size: 56px;
          font-weight: 600;
          line-height: 1.07;
          letter-spacing: -0.005em;
          color: #f5f5f7;
          margin-bottom: 8px;
        }

        .apple-stat-label {
          font-size: 14px;
          line-height: 1.43;
          font-weight: 400;
          color: #a1a1a6;
          letter-spacing: -0.016em;
        }

        /* Features Section */
        .apple-features {
          padding: 110px 0;
        }

        .apple-section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .apple-title-section {
          font-size: 48px;
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -0.003em;
          color: #f5f5f7;
          margin: 0 0 16px;
        }

        .apple-section-subtitle {
          font-size: 21px;
          line-height: 1.381;
          font-weight: 400;
          color: #a1a1a6;
          letter-spacing: 0.011em;
        }

        .apple-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .apple-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 40px 30px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .apple-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .apple-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .apple-card-icon svg {
          width: 28px;
          height: 28px;
          fill: white;
        }

        .apple-card-icon-blue { background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%); }
        .apple-card-icon-purple { background: linear-gradient(135deg, #bf5af2 0%, #a550e6 100%); }
        .apple-card-icon-green { background: linear-gradient(135deg, #30d158 0%, #28a745 100%); }
        .apple-card-icon-orange { background: linear-gradient(135deg, #ff9f0a 0%, #ff8c00 100%); }
        .apple-card-icon-teal { background: linear-gradient(135deg, #5ac8fa 0%, #4ab8ea 100%); }
        .apple-card-icon-pink { background: linear-gradient(135deg, #ff375f 0%, #ff2d55 100%); }

        .apple-card-title {
          font-size: 24px;
          font-weight: 600;
          line-height: 1.17;
          letter-spacing: 0.009em;
          color: #f5f5f7;
          margin: 0 0 12px;
        }

        .apple-card-text {
          font-size: 17px;
          line-height: 1.47;
          font-weight: 400;
          color: #a1a1a6;
          letter-spacing: -0.022em;
        }

        /* Steps Section */
        .apple-steps {
          padding: 110px 0;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .apple-steps-list {
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 700px;
          margin: 0 auto;
        }

        .apple-step {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .apple-step-number {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(0, 113, 227, 0.1);
          border: 2px solid rgba(0, 113, 227, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          color: #0071e3;
          flex-shrink: 0;
        }

        .apple-step-content {
          flex: 1;
          padding-top: 4px;
        }

        .apple-step-title {
          font-size: 21px;
          font-weight: 600;
          line-height: 1.19;
          letter-spacing: 0.011em;
          color: #f5f5f7;
          margin: 0 0 8px;
        }

        .apple-step-text {
          font-size: 17px;
          line-height: 1.47;
          font-weight: 400;
          color: #a1a1a6;
          letter-spacing: -0.022em;
        }

        /* CTA Section */
        .apple-cta {
          padding: 110px 0;
        }

        .apple-cta-card {
          max-width: 692px;
          margin: 0 auto;
          padding: 88px 60px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 30px;
          text-align: center;
        }

        .apple-cta-title {
          font-size: 40px;
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: 0em;
          color: #f5f5f7;
          margin: 0 0 16px;
        }

        .apple-cta-subtitle {
          font-size: 21px;
          line-height: 1.381;
          font-weight: 400;
          color: #a1a1a6;
          letter-spacing: 0.011em;
          margin-bottom: 40px;
        }

        .apple-cta-note {
          font-size: 14px;
          color: #86868b;
          margin-top: 16px;
        }

        /* Footer */
        .apple-footer {
          background: rgba(255, 255, 255, 0.02);
          padding: 66px 0 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .apple-footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          margin-bottom: 40px;
        }

        .apple-footer-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .apple-footer-heading {
          font-size: 17px;
          font-weight: 600;
          color: #f5f5f7;
          margin-bottom: 4px;
        }

        .apple-footer-label {
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .apple-footer-text {
          font-size: 14px;
          line-height: 1.43;
          color: #a1a1a6;
        }

        .apple-footer-section a {
          font-size: 14px;
          color: #a1a1a6;
          text-decoration: none;
          transition: color 0.2s;
        }

        .apple-footer-section a:hover {
          color: #f5f5f7;
        }

        .apple-footer-legal {
          padding-top: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .apple-footer-legal p {
          font-size: 12px;
          color: #86868b;
        }

        /* Responsive */
        @media (max-width: 734px) {
          .apple-hero {
            padding: 60px 0 80px;
          }

          .apple-title-large {
            font-size: 40px;
          }

          .apple-subtitle {
            font-size: 19px;
          }

          .apple-button-group {
            width: 100%;
          }

          .apple-button-primary,
          .apple-button-secondary {
            width: 100%;
          }

          .apple-step {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
