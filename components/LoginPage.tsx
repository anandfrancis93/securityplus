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
      <div className="neu-loading">
        <div className="neu-loading-card">
          <div className="neu-spinner"></div>
          <p className="neu-loading-text">Loading</p>
        </div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="neu-container">
      {/* Main Content */}
      <div className="neu-content">
        {/* Header */}
        <header className="neu-header">
          <div className="neu-logo">
            <div className="neu-logo-icon">
              <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="25" fill="#e0e5ec" stroke="none"/>
                <path d="M30 15 L22 23 L22 38 L30 46 L38 38 L38 23 Z"
                      fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round"/>
                <circle cx="30" cy="30" r="5" fill="#6366f1"/>
              </svg>
            </div>
            <div className="neu-logo-text">
              <h1>Security<span>Plus</span></h1>
              <p>AI Learning</p>
            </div>
          </div>
        </header>

        {/* Main Card */}
        <main className="neu-main">
          {/* Status Badge */}
          <div className="neu-badge">
            <div className="neu-badge-dot"></div>
            <span>CompTIA SY0-701</span>
          </div>

          {/* Title */}
          <h2 className="neu-title">
            Master Your
            <br />
            Certification Journey
          </h2>

          <p className="neu-subtitle">
            Intelligent adaptive learning powered by advanced analytics
            and spaced repetition algorithms
          </p>

          {/* Login Card */}
          <div className="neu-card">
            <h3 className="neu-card-title">Sign In</h3>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="neu-btn"
              aria-label={loading ? 'Signing in' : 'Sign in with Google'}
            >
              <div className="neu-btn-inner">
                <svg className="neu-google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </div>
            </button>

            {/* Features */}
            <div className="neu-features">
              <div className="neu-feature">
                <div className="neu-feature-icon">✓</div>
                <span>Free Forever</span>
              </div>
              <div className="neu-feature">
                <div className="neu-feature-icon">✓</div>
                <span>No Credit Card</span>
              </div>
              <div className="neu-feature">
                <div className="neu-feature-icon">✓</div>
                <span>400+ Topics</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="neu-error">
                <div className="neu-error-icon">!</div>
                <div className="neu-error-content">
                  <div className="neu-error-title">Authentication Failed</div>
                  <div className="neu-error-message">{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="neu-stats">
            <div className="neu-stat">
              <div className="neu-stat-card">
                <div className="neu-stat-value">400+</div>
                <div className="neu-stat-label">Topics</div>
              </div>
            </div>
            <div className="neu-stat">
              <div className="neu-stat-card">
                <div className="neu-stat-value">AI</div>
                <div className="neu-stat-label">Powered</div>
              </div>
            </div>
            <div className="neu-stat">
              <div className="neu-stat-card">
                <div className="neu-stat-value">IRT</div>
                <div className="neu-stat-label">Analytics</div>
              </div>
            </div>
            <div className="neu-stat">
              <div className="neu-stat-card">
                <div className="neu-stat-value">FSRS</div>
                <div className="neu-stat-label">Algorithm</div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Grid */}
        <section className="neu-features-section">
          <h2 className="neu-section-title">Key Features</h2>

          <div className="neu-features-grid">
            {[
              { icon: '🤖', title: 'AI Question Engine', desc: 'Unlimited adaptive questions generated across all Security+ topics with intelligent difficulty calibration' },
              { icon: '📊', title: 'IRT Analytics', desc: 'Item Response Theory providing precision ability tracking with real-time confidence intervals' },
              { icon: '🧠', title: 'FSRS Scheduler', desc: 'Advanced spaced repetition system optimizing review intervals for maximum retention' },
              { icon: '✅', title: 'Exam Aligned', desc: 'Questions mirror actual CompTIA exam structure with validated difficulty distribution' },
              { icon: '🎯', title: 'Full Coverage', desc: 'Complete mastery across all 5 Security+ domains with comprehensive topic mapping' },
              { icon: '📖', title: 'Deep Analysis', desc: 'Comprehensive explanations ensuring thorough understanding of all concepts' }
            ].map((feature, i) => (
              <div key={i} className="neu-feature-card">
                <div className="neu-feature-card-icon">{feature.icon}</div>
                <h3 className="neu-feature-card-title">{feature.title}</h3>
                <p className="neu-feature-card-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="neu-footer">
          <div className="neu-footer-content">
            <div className="neu-footer-brand">
              <h4>SecurityPlus AI</h4>
              <p>AI-powered learning for CompTIA Security+ SY0-701</p>
            </div>

            <div className="neu-footer-links">
              <div>
                <h5>Legal</h5>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
              </div>

              <div>
                <h5>Support</h5>
                <a href="#">Documentation</a>
                <a href="#">Contact Us</a>
                <a href="#">System Status</a>
              </div>
            </div>
          </div>

          <div className="neu-footer-bottom">
            <p>© 2024 SecurityPlus AI • All rights reserved</p>
          </div>
        </footer>
      </div>

      {/* SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "SecurityPlus AI",
            "applicationCategory": "EducationalApplication",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })
        }}
      />

      <style jsx>{`
        /* =====================================
           NEOMORPHISM / SOFT UI DESIGN
           ===================================== */

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .neu-container {
          min-height: 100vh;
          background: #e0e5ec;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* === Loading === */
        .neu-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e0e5ec;
        }

        .neu-loading-card {
          padding: 3rem;
          border-radius: 30px;
          background: #e0e5ec;
          box-shadow:
            12px 12px 24px #a3b1c6,
            -12px -12px 24px #ffffff;
          text-align: center;
        }

        .neu-spinner {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #e0e5ec;
          margin: 0 auto 1.5rem;
          position: relative;
          box-shadow:
            inset 4px 4px 8px #a3b1c6,
            inset -4px -4px 8px #ffffff;
        }

        .neu-spinner::before {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 4px solid transparent;
          border-top-color: #6366f1;
          animation: neu-spin 1s linear infinite;
        }

        @keyframes neu-spin {
          to { transform: rotate(360deg); }
        }

        .neu-loading-text {
          color: #4a5568;
          font-size: 1rem;
          font-weight: 500;
        }

        /* === Content === */
        .neu-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* === Header === */
        .neu-header {
          margin-bottom: 3rem;
        }

        .neu-logo {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .neu-logo-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #e0e5ec;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            8px 8px 16px #a3b1c6,
            -8px -8px 16px #ffffff;
        }

        .neu-logo-icon svg {
          width: 40px;
          height: 40px;
        }

        .neu-logo-text h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2d3748;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .neu-logo-text h1 span {
          color: #6366f1;
        }

        .neu-logo-text p {
          font-size: 0.875rem;
          color: #718096;
          font-weight: 500;
        }

        /* === Main === */
        .neu-main {
          max-width: 600px;
          margin: 0 auto;
        }

        .neu-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          background: #e0e5ec;
          box-shadow:
            6px 6px 12px #a3b1c6,
            -6px -6px 12px #ffffff;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          color: #4a5568;
          font-weight: 600;
        }

        .neu-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6366f1;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }

        .neu-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          color: #2d3748;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .neu-subtitle {
          text-align: center;
          color: #718096;
          font-size: 1.063rem;
          line-height: 1.7;
          margin-bottom: 3rem;
        }

        /* === Card === */
        .neu-card {
          padding: 2.5rem;
          border-radius: 30px;
          background: #e0e5ec;
          box-shadow:
            12px 12px 24px #a3b1c6,
            -12px -12px 24px #ffffff;
          margin-bottom: 3rem;
        }

        .neu-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 2rem;
          text-align: center;
        }

        /* === Button === */
        .neu-btn {
          width: 100%;
          padding: 0;
          border: none;
          border-radius: 20px;
          background: #e0e5ec;
          box-shadow:
            8px 8px 16px #a3b1c6,
            -8px -8px 16px #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .neu-btn:hover:not(:disabled) {
          box-shadow:
            4px 4px 8px #a3b1c6,
            -4px -4px 8px #ffffff;
        }

        .neu-btn:active:not(:disabled) {
          box-shadow:
            inset 4px 4px 8px #a3b1c6,
            inset -4px -4px 8px #ffffff;
        }

        .neu-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .neu-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1.25rem;
          font-size: 1rem;
          font-weight: 600;
          color: #4a5568;
        }

        .neu-google-icon {
          width: 24px;
          height: 24px;
        }

        /* === Features === */
        .neu-features {
          display: grid;
          gap: 1rem;
          margin-top: 2rem;
        }

        .neu-feature {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 15px;
          background: #e0e5ec;
          box-shadow:
            inset 4px 4px 8px #a3b1c6,
            inset -4px -4px 8px #ffffff;
          font-size: 0.938rem;
          color: #4a5568;
          font-weight: 500;
        }

        .neu-feature-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0e5ec;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            4px 4px 8px #a3b1c6,
            -4px -4px 8px #ffffff;
          color: #6366f1;
          font-weight: 700;
          font-size: 0.875rem;
        }

        /* === Error === */
        .neu-error {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 15px;
          background: #e0e5ec;
          box-shadow:
            inset 4px 4px 8px #a3b1c6,
            inset -4px -4px 8px #ffffff;
          margin-top: 1.5rem;
        }

        .neu-error-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow:
            4px 4px 8px rgba(239, 68, 68, 0.3);
        }

        .neu-error-title {
          font-size: 0.938rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }

        .neu-error-message {
          font-size: 0.875rem;
          color: #718096;
        }

        /* === Stats === */
        .neu-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1.5rem;
          margin-bottom: 4rem;
        }

        .neu-stat-card {
          padding: 1.5rem;
          border-radius: 20px;
          background: #e0e5ec;
          box-shadow:
            8px 8px 16px #a3b1c6,
            -8px -8px 16px #ffffff;
          text-align: center;
          transition: all 0.3s ease;
        }

        .neu-stat-card:hover {
          box-shadow:
            4px 4px 8px #a3b1c6,
            -4px -4px 8px #ffffff;
        }

        .neu-stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #6366f1;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .neu-stat-label {
          font-size: 0.875rem;
          color: #718096;
          font-weight: 600;
        }

        /* === Features Section === */
        .neu-features-section {
          margin: 5rem 0;
        }

        .neu-section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #2d3748;
          text-align: center;
          margin-bottom: 3rem;
        }

        .neu-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .neu-feature-card {
          padding: 2rem;
          border-radius: 25px;
          background: #e0e5ec;
          box-shadow:
            10px 10px 20px #a3b1c6,
            -10px -10px 20px #ffffff;
          transition: all 0.3s ease;
        }

        .neu-feature-card:hover {
          box-shadow:
            6px 6px 12px #a3b1c6,
            -6px -6px 12px #ffffff;
          transform: translateY(-5px);
        }

        .neu-feature-card-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #e0e5ec;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin-bottom: 1.5rem;
          box-shadow:
            6px 6px 12px #a3b1c6,
            -6px -6px 12px #ffffff;
        }

        .neu-feature-card-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .neu-feature-card-desc {
          font-size: 0.938rem;
          color: #718096;
          line-height: 1.7;
        }

        /* === Footer === */
        .neu-footer {
          margin-top: 5rem;
          padding-top: 3rem;
        }

        .neu-footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          margin-bottom: 2rem;
        }

        .neu-footer-brand h4 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 0.75rem;
        }

        .neu-footer-brand p {
          font-size: 0.938rem;
          color: #718096;
          line-height: 1.6;
        }

        .neu-footer-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .neu-footer-links h5 {
          font-size: 0.938rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .neu-footer-links a {
          display: block;
          font-size: 0.875rem;
          color: #718096;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: color 0.2s;
        }

        .neu-footer-links a:hover {
          color: #6366f1;
        }

        .neu-footer-bottom {
          padding: 1.5rem 0;
          text-align: center;
        }

        .neu-footer-bottom p {
          font-size: 0.875rem;
          color: #a0aec0;
        }

        /* === Responsive === */
        @media (max-width: 768px) {
          .neu-content {
            padding: 1rem;
          }

          .neu-card {
            padding: 1.5rem;
          }

          .neu-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .neu-features-grid {
            grid-template-columns: 1fr;
          }

          .neu-footer-content {
            grid-template-columns: 1fr;
          }
        }

        /* === Accessibility === */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        *:focus-visible {
          outline: 3px solid #6366f1;
          outline-offset: 3px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
