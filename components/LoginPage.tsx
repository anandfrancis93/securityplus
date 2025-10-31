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
                <circle cx="30" cy="30" r="25" fill="#000000" stroke="none"/>
                <path d="M30 15 L22 23 L22 38 L30 46 L38 38 L38 23 Z"
                      fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round"/>
                <circle cx="30" cy="30" r="5" fill="#2563eb"/>
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
            <div className="neu-feature-card">
              <div className="neu-feature-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="neu-feature-card-title">AI Question Engine</h3>
              <p className="neu-feature-card-desc">Unlimited adaptive questions generated across all Security+ topics with intelligent difficulty calibration</p>
            </div>

            <div className="neu-feature-card">
              <div className="neu-feature-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"/>
                  <path d="M18 17V9"/>
                  <path d="M13 17V5"/>
                  <path d="M8 17v-3"/>
                </svg>
              </div>
              <h3 className="neu-feature-card-title">IRT Analytics</h3>
              <p className="neu-feature-card-desc">Item Response Theory providing precision ability tracking with real-time confidence intervals</p>
            </div>

            <div className="neu-feature-card">
              <div className="neu-feature-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="neu-feature-card-title">FSRS Scheduler</h3>
              <p className="neu-feature-card-desc">Advanced spaced repetition system optimizing review intervals for maximum retention</p>
            </div>

            <div className="neu-feature-card">
              <div className="neu-feature-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="neu-feature-card-title">Exam Aligned</h3>
              <p className="neu-feature-card-desc">Questions mirror actual CompTIA exam structure with validated difficulty distribution</p>
            </div>

            <div className="neu-feature-card">
              <div className="neu-feature-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5L12 2z"/>
                  <path d="M12 22V12"/>
                  <path d="M7 17l5 3 5-3"/>
                </svg>
              </div>
              <h3 className="neu-feature-card-title">Full Coverage</h3>
              <p className="neu-feature-card-desc">Complete mastery across all 5 Security+ domains with comprehensive topic mapping</p>
            </div>

            <div className="neu-feature-card">
              <div className="neu-feature-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
              </div>
              <h3 className="neu-feature-card-title">Deep Analysis</h3>
              <p className="neu-feature-card-desc">Comprehensive explanations ensuring thorough understanding of all concepts</p>
            </div>
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
           BLUE PRIMARY DESIGN - TRUE BLACK
           ===================================== */

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .neu-container {
          min-height: 100vh;
          background: #000000;
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
          background: #000000;
        }

        .neu-loading-card {
          padding: 3rem;
          border-radius: 16px;
          background: #000000;
          border: 1px solid #1a1a1a;
          text-align: center;
        }

        .neu-spinner {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #000000;
          margin: 0 auto 1.5rem;
          position: relative;
          border: 2px solid #1a1a1a;
        }

        .neu-spinner::before {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 4px solid transparent;
          border-top-color: #2563eb;
          animation: neu-spin 1s linear infinite;
        }

        @keyframes neu-spin {
          to { transform: rotate(360deg); }
        }

        .neu-loading-text {
          color: #9ca3af;
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
          border-radius: 12px;
          background: linear-gradient(145deg, #0a0a0a, #000000);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #2563eb;
          transform-style: preserve-3d;
          transition: all 0.3s ease;
          box-shadow:
            0 4px 12px rgba(37, 99, 235, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .neu-logo-icon::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          background: linear-gradient(145deg, #2563eb, #3b82f6);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .neu-logo-icon:hover::before {
          opacity: 0.2;
        }

        .neu-logo-icon:hover {
          transform: translateZ(10px) rotateY(5deg);
          box-shadow:
            0 8px 20px rgba(37, 99, 235, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .neu-logo-icon svg {
          width: 40px;
          height: 40px;
        }

        .neu-logo-text h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .neu-logo-text h1 span {
          color: #2563eb;
        }

        .neu-logo-text p {
          font-size: 0.875rem;
          color: #9ca3af;
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
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.05));
          border: 1px solid #2563eb;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          color: #60a5fa;
          font-weight: 600;
          transform-style: preserve-3d;
          transition: all 0.3s ease;
          box-shadow:
            0 2px 8px rgba(37, 99, 235, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .neu-badge:hover {
          transform: translateY(-2px) translateZ(5px);
          box-shadow:
            0 4px 15px rgba(37, 99, 235, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .neu-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
          animation: pulse-blue 2s ease-in-out infinite;
        }

        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
          }
          50% {
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.9);
          }
        }

        .neu-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .neu-subtitle {
          text-align: center;
          color: #9ca3af;
          font-size: 1.063rem;
          line-height: 1.7;
          margin-bottom: 3rem;
        }

        /* === Card === */
        .neu-card {
          padding: 2.5rem;
          border-radius: 16px;
          background: linear-gradient(145deg, #0d0d0d, #080808);
          border: 1px solid #1a1a1a;
          margin-bottom: 3rem;
          position: relative;
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.5),
            0 1px 2px rgba(37, 99, 235, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          transform-style: preserve-3d;
          transition: all 0.3s ease;
        }

        .neu-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(145deg, rgba(37, 99, 235, 0.3), transparent, rgba(37, 99, 235, 0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .neu-card:hover::before {
          opacity: 1;
        }

        .neu-card:hover {
          transform: translateZ(10px) translateY(-4px);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.7),
            0 4px 8px rgba(37, 99, 235, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .neu-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 2rem;
          text-align: center;
        }

        /* === Button === */
        .neu-btn {
          width: 100%;
          padding: 0;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          position: relative;
          transform-style: preserve-3d;
          box-shadow:
            0 4px 15px rgba(37, 99, 235, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .neu-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .neu-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255,255,255,0.3), transparent 70%);
          opacity: 0;
          transform: scale(0);
          transition: all 0.5s ease;
        }

        .neu-btn:hover:not(:disabled)::before {
          opacity: 1;
        }

        .neu-btn:hover:not(:disabled)::after {
          opacity: 1;
          transform: scale(1);
        }

        .neu-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          transform: translateY(-3px) translateZ(20px) rotateX(5deg);
          box-shadow:
            0 12px 35px rgba(37, 99, 235, 0.6),
            0 6px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .neu-btn:active:not(:disabled) {
          transform: translateY(-1px) translateZ(10px) rotateX(2deg);
          box-shadow:
            0 6px 20px rgba(37, 99, 235, 0.5),
            0 3px 6px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .neu-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
        }

        .neu-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1.25rem;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
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
          border-radius: 12px;
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid #22c55e;
          font-size: 0.938rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .neu-feature-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000000;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        /* === Error === */
        .neu-error {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          margin-top: 1.5rem;
        }

        .neu-error-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ef4444;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
          font-size: 1.25rem;
        }

        .neu-error-title {
          font-size: 0.938rem;
          font-weight: 600;
          color: #fca5a5;
          margin-bottom: 0.25rem;
        }

        .neu-error-message {
          font-size: 0.875rem;
          color: #9ca3af;
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
          border-radius: 12px;
          background: linear-gradient(145deg, #0d0d0d, #080808);
          border: 1px solid #1a1a1a;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          transform-style: preserve-3d;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }

        .neu-stat-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: linear-gradient(145deg, rgba(37, 99, 235, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .neu-stat-card:hover::after {
          opacity: 1;
        }

        .neu-stat-card:hover {
          border-color: #2563eb;
          transform: translateY(-6px) translateZ(15px) rotateX(5deg);
          box-shadow:
            0 12px 30px rgba(37, 99, 235, 0.3),
            0 6px 12px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .neu-stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #2563eb;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .neu-stat-label {
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 600;
        }

        /* === Features Section === */
        .neu-features-section {
          margin: 5rem 0;
        }

        .neu-section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #ffffff;
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
          border-radius: 16px;
          background: linear-gradient(145deg, #0d0d0d, #070707);
          border: 1px solid #1a1a1a;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }

        .neu-feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #2563eb 50%, #3b82f6, #2563eb, transparent);
          transform: scaleX(0);
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.6);
        }

        .neu-feature-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.05), transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .neu-feature-card:hover::before {
          transform: scaleX(1);
        }

        .neu-feature-card:hover::after {
          opacity: 1;
        }

        .neu-feature-card:hover {
          border-color: #2563eb;
          transform: translateY(-12px) translateZ(25px) rotateX(3deg);
          box-shadow:
            0 20px 50px rgba(37, 99, 235, 0.4),
            0 10px 20px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 0 60px rgba(37, 99, 235, 0.1);
        }

        .neu-feature-card-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }

        .neu-feature-card:hover .neu-feature-card-icon {
          background: #2563eb;
          transform: scale(1.1);
        }

        .neu-feature-card-icon svg {
          width: 28px;
          height: 28px;
          color: #2563eb;
          transition: color 0.3s ease;
        }

        .neu-feature-card:hover .neu-feature-card-icon svg {
          color: #ffffff;
        }

        .neu-feature-card-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .neu-feature-card-desc {
          font-size: 0.938rem;
          color: #9ca3af;
          line-height: 1.7;
        }

        /* === Footer === */
        .neu-footer {
          margin-top: 5rem;
          padding-top: 3rem;
          border-top: 1px solid #1a1a1a;
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
          color: #ffffff;
          margin-bottom: 0.75rem;
        }

        .neu-footer-brand p {
          font-size: 0.938rem;
          color: #9ca3af;
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
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .neu-footer-links a {
          display: block;
          font-size: 0.875rem;
          color: #9ca3af;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: color 0.2s;
        }

        .neu-footer-links a:hover {
          color: #2563eb;
        }

        .neu-footer-bottom {
          padding: 1.5rem 0;
          text-align: center;
        }

        .neu-footer-bottom p {
          font-size: 0.875rem;
          color: #6b7280;
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
          outline: 3px solid #2563eb;
          outline-offset: 3px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
