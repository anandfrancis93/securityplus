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
                <circle cx="30" cy="30" r="25" fill="#0f0f0f" stroke="none"/>
                <path d="M30 15 L22 23 L22 38 L30 46 L38 38 L38 23 Z"
                      fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round"/>
                <circle cx="30" cy="30" r="5" fill="#8b5cf6"/>
              </svg>
            </div>
            <div className="neu-logo-text">
              <h1>AI <span>Learning</span></h1>
              <p>Platform</p>
            </div>
          </div>
        </header>

        {/* Main Card */}
        <main className="neu-main">
          {/* Status Badge */}
          <div className="neu-badge">
            <div className="neu-badge-dot"></div>
            <span>Now Available: Cybersecurity</span>
          </div>

          {/* Title */}
          <h2 className="neu-title">
            Master Any
            <br />
            Subject You Choose
          </h2>

          <p className="neu-subtitle">
            Intelligent adaptive learning powered by AI, advanced analytics,
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
                <div className="neu-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span>Free Forever</span>
              </div>
              <div className="neu-feature">
                <div className="neu-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span>No Credit Card</span>
              </div>
              <div className="neu-feature">
                <div className="neu-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span>Unlimited Questions</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="neu-error">
                <div className="neu-error-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
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
                <div className="neu-stat-value">∞</div>
                <div className="neu-stat-label">Questions</div>
              </div>
            </div>
            <div className="neu-stat">
              <div className="neu-stat-card">
                <div className="neu-stat-value">AI</div>
                <div className="neu-stat-label">Generated</div>
              </div>
            </div>
            <div className="neu-stat">
              <div className="neu-stat-card">
                <div className="neu-stat-value">IRT</div>
                <div className="neu-stat-label">Scoring</div>
              </div>
            </div>
            <div className="neu-stat">
              <div className="neu-stat-card">
                <div className="neu-stat-value">FSRS</div>
                <div className="neu-stat-label">Spaced Rep</div>
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
              <p className="neu-feature-card-desc">Unlimited adaptive questions generated across all subject topics with intelligent difficulty calibration</p>
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
              <h3 className="neu-feature-card-title">Subject Aligned</h3>
              <p className="neu-feature-card-desc">Questions aligned with official learning objectives and validated difficulty distribution</p>
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
              <p className="neu-feature-card-desc">Complete mastery across all subject domains with comprehensive topic mapping and tracking</p>
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
              <h4>AI Learning Platform</h4>
              <p>Adaptive learning platform with AI-generated content and advanced analytics. Currently featuring Cybersecurity (CompTIA Security+ SY0-701).</p>
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
            <p>© 2024 AI Learning Platform • All rights reserved</p>
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
            "name": "AI Learning Platform",
            "applicationCategory": "EducationalApplication",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })
        }}
      />

      <style jsx>{`
        /* =====================================
           DARK NEUMORPHISM / SOFT UI DESIGN
           ===================================== */

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .neu-container {
          min-height: 100vh;
          background: #0f0f0f;
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
          background: #0f0f0f;
        }

        .neu-loading-card {
          padding: 3rem;
          border-radius: 30px;
          background: #0f0f0f;
          box-shadow:
            12px 12px 24px #050505,
            -12px -12px 24px #191919;
          text-align: center;
        }

        .neu-spinner {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #0f0f0f;
          margin: 0 auto 1.5rem;
          position: relative;
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
        }

        .neu-spinner::before {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 4px solid transparent;
          border-top-color: #8b5cf6;
          animation: neu-spin 1s linear infinite;
        }

        @keyframes neu-spin {
          to { transform: rotate(360deg); }
        }

        .neu-loading-text {
          color: #a8a8a8;
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
          background: #0f0f0f;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            8px 8px 16px #050505,
            -8px -8px 16px #191919;
        }

        .neu-logo-icon svg {
          width: 40px;
          height: 40px;
        }

        .neu-logo-text h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #e5e5e5;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .neu-logo-text h1 span {
          color: #8b5cf6;
        }

        .neu-logo-text p {
          font-size: 0.875rem;
          color: #a8a8a8;
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
          background: #0f0f0f;
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          color: #a8a8a8;
          font-weight: 600;
        }

        .neu-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
        }

        .neu-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          color: #e5e5e5;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .neu-subtitle {
          text-align: center;
          color: #a8a8a8;
          font-size: 1.063rem;
          line-height: 1.7;
          margin-bottom: 3rem;
        }

        /* === Card === */
        .neu-card {
          padding: 2.5rem;
          border-radius: 30px;
          background: #0f0f0f;
          box-shadow:
            12px 12px 24px #050505,
            -12px -12px 24px #191919;
          margin-bottom: 3rem;
        }

        .neu-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e5e5e5;
          margin-bottom: 2rem;
          text-align: center;
        }

        /* === Button === */
        .neu-btn {
          width: 100%;
          padding: 0;
          border: none;
          border-radius: 20px;
          background: #0f0f0f;
          box-shadow:
            8px 8px 16px #050505,
            -8px -8px 16px #191919;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .neu-btn:hover:not(:disabled) {
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
        }

        .neu-btn:active:not(:disabled) {
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
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
          color: #c0c0c0;
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
          background: #0f0f0f;
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
          font-size: 0.938rem;
          color: #a8a8a8;
          font-weight: 500;
        }

        .neu-feature-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0f0f0f;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            4px 4px 8px #050505,
            -4px -4px 8px #191919;
          color: #8b5cf6;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .neu-feature-icon svg {
          width: 16px;
          height: 16px;
        }

        /* === Error === */
        .neu-error {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 15px;
          background: #0f0f0f;
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
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

        .neu-error-icon svg {
          width: 18px;
          height: 18px;
        }

        .neu-error-title {
          font-size: 0.938rem;
          font-weight: 600;
          color: #e5e5e5;
          margin-bottom: 0.25rem;
        }

        .neu-error-message {
          font-size: 0.875rem;
          color: #a8a8a8;
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
          background: #0f0f0f;
          box-shadow:
            8px 8px 16px #050505,
            -8px -8px 16px #191919;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .neu-stat-card:hover {
          box-shadow:
            4px 4px 8px #050505,
            -4px -4px 8px #191919;
        }

        .neu-stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #8b5cf6;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .neu-stat-label {
          font-size: 0.875rem;
          color: #a8a8a8;
          font-weight: 600;
        }

        /* === Features Section === */
        .neu-features-section {
          margin: 5rem 0;
        }

        .neu-section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #e5e5e5;
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
          background: #0f0f0f;
          box-shadow:
            10px 10px 20px #050505,
            -10px -10px 20px #191919;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .neu-feature-card:hover {
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          transform: translateY(-5px);
        }

        .neu-feature-card-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #0f0f0f;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          color: #8b5cf6;
        }

        .neu-feature-card-icon svg {
          width: 28px;
          height: 28px;
        }

        .neu-feature-card-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #e5e5e5;
          margin-bottom: 1rem;
        }

        .neu-feature-card-desc {
          font-size: 0.938rem;
          color: #a8a8a8;
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
          color: #e5e5e5;
          margin-bottom: 0.75rem;
        }

        .neu-footer-brand p {
          font-size: 0.938rem;
          color: #a8a8a8;
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
          color: #e5e5e5;
          margin-bottom: 1rem;
        }

        .neu-footer-links a {
          display: block;
          font-size: 0.875rem;
          color: #a8a8a8;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .neu-footer-links a:hover {
          color: #8b5cf6;
        }

        .neu-footer-bottom {
          padding: 1.5rem 0;
          text-align: center;
        }

        .neu-footer-bottom p {
          font-size: 0.875rem;
          color: #666666;
        }

        /* ============================================
           MOBILE-FIRST RESPONSIVE DESIGN
           Fluid scaling from 320px to 3840px (4K)
           Breakpoints: 768px, 1024px, 1280px, 1440px, 1920px
           ============================================ */

        /* Base styles: Mobile (320px+) */
        .neu-content {
          padding: clamp(1rem, 3vw, 2rem);
        }

        .neu-card {
          padding: clamp(1.5rem, 3.5vw, 2.5rem);
        }

        .neu-stats {
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(1rem, 2vw, 1.5rem);
        }

        .neu-features-grid {
          grid-template-columns: 1fr;
          gap: clamp(1.5rem, 3vw, 2rem);
        }

        .neu-footer-content {
          grid-template-columns: 1fr;
          gap: clamp(2rem, 3vw, 3rem);
        }

        /* Tablet (768px+) */
        @media (min-width: 768px) {
          .neu-content {
            padding: clamp(1.5rem, 3vw, 2.5rem);
          }

          .neu-card {
            padding: clamp(2rem, 3vw, 3rem);
          }

          .neu-stats {
            grid-template-columns: repeat(4, 1fr);
          }

          .neu-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .neu-footer-content {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .neu-features-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .neu-footer-content {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Large Desktop (1280px+) */
        @media (min-width: 1280px) {
          .neu-content {
            padding: 2rem;
          }

          .neu-card {
            padding: 2.5rem;
          }
        }

        /* XL Desktop (1440px+) */
        @media (min-width: 1440px) {
          .neu-card {
            padding: 3rem;
          }
        }

        /* 4K (1920px+) - Cap maximum sizes */
        @media (min-width: 1920px) {
          .neu-content {
            max-width: 1800px;
            margin-left: auto;
            margin-right: auto;
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
          outline: 3px solid #8b5cf6;
          outline-offset: 3px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
