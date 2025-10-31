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
      <div className="geo-loading">
        <div className="geo-loading-box">
          <div className="geo-spinner"></div>
          <p>INITIALIZING</p>
        </div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="geo-container">
      {/* Geometric Background Shapes */}
      <div className="geo-bg">
        <div className="geo-shape geo-triangle-1"></div>
        <div className="geo-shape geo-square-1"></div>
        <div className="geo-shape geo-triangle-2"></div>
        <div className="geo-shape geo-circle-1"></div>
        <div className="geo-shape geo-pentagon-1"></div>
      </div>

      {/* Grid Lines */}
      <div className="geo-grid"></div>

      {/* Main Content */}
      <div className="geo-content">
        {/* Header */}
        <header className="geo-header">
          <div className="geo-logo">
            <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="25,5 45,20 40,45 10,45 5,20" stroke="#00ff88" strokeWidth="2" fill="none"/>
              <line x1="25" y1="5" x2="25" y2="45" stroke="#00ff88" strokeWidth="2"/>
              <line x1="5" y1="20" x2="45" y2="20" stroke="#00ff88" strokeWidth="2"/>
            </svg>
            <span>SECURITY+AI</span>
          </div>
        </header>

        {/* Main Login Section */}
        <main className="geo-main">
          <div className="geo-badge">
            <span className="geo-badge-line"></span>
            <span>COMPTIA SY0-701</span>
            <span className="geo-badge-line"></span>
          </div>

          <h1 className="geo-title">
            <span className="geo-title-line">MASTER</span>
            <span className="geo-title-line geo-title-accent">SECURITY+</span>
          </h1>

          <p className="geo-subtitle">
            Precision learning system powered by<br />
            IRT analytics • FSRS algorithm • AI generation
          </p>

          {/* Login Box */}
          <div className="geo-box">
            <div className="geo-box-corner geo-box-tl"></div>
            <div className="geo-box-corner geo-box-tr"></div>
            <div className="geo-box-corner geo-box-bl"></div>
            <div className="geo-box-corner geo-box-br"></div>

            <div className="geo-box-content">
              <h2 className="geo-box-title">ACCESS SYSTEM</h2>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="geo-btn"
                aria-label={loading ? 'Signing in' : 'Sign in with Google'}
              >
                <svg className="geo-google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{loading ? 'AUTHENTICATING...' : 'CONTINUE WITH GOOGLE'}</span>
                <div className="geo-btn-border"></div>
              </button>

              <div className="geo-divider">
                <span></span>
                <span>SYSTEM FEATURES</span>
                <span></span>
              </div>

              <ul className="geo-features">
                <li>
                  <span className="geo-check">✓</span>
                  <span>FREE FOREVER</span>
                </li>
                <li>
                  <span className="geo-check">✓</span>
                  <span>NO CREDIT CARD</span>
                </li>
                <li>
                  <span className="geo-check">✓</span>
                  <span>400+ TOPICS</span>
                </li>
              </ul>

              {error && (
                <div className="geo-error">
                  <span className="geo-error-icon">!</span>
                  <div>
                    <div className="geo-error-title">AUTHENTICATION FAILED</div>
                    <div className="geo-error-msg">{error}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="geo-stats">
            <div className="geo-stat">
              <div className="geo-stat-value">400+</div>
              <div className="geo-stat-label">TOPICS</div>
            </div>
            <div className="geo-stat-divider"></div>
            <div className="geo-stat">
              <div className="geo-stat-value">AI</div>
              <div className="geo-stat-label">POWERED</div>
            </div>
            <div className="geo-stat-divider"></div>
            <div className="geo-stat">
              <div className="geo-stat-value">IRT</div>
              <div className="geo-stat-label">ANALYTICS</div>
            </div>
            <div className="geo-stat-divider"></div>
            <div className="geo-stat">
              <div className="geo-stat-value">FSRS</div>
              <div className="geo-stat-label">ALGORITHM</div>
            </div>
          </div>
        </main>

        {/* Features Grid */}
        <section className="geo-features-section">
          <h2 className="geo-section-title">
            <span className="geo-section-number">01</span>
            SYSTEM CAPABILITIES
          </h2>

          <div className="geo-grid-features">
            <div className="geo-feature-card">
              <div className="geo-feature-num">01</div>
              <h3>AI QUESTION ENGINE</h3>
              <p>Unlimited unique questions across 400+ Security+ topics with intelligent difficulty calibration</p>
              <div className="geo-feature-accent"></div>
            </div>

            <div className="geo-feature-card">
              <div className="geo-feature-num">02</div>
              <h3>IRT ANALYTICS</h3>
              <p>Precision ability tracking using Item Response Theory with real-time confidence intervals</p>
              <div className="geo-feature-accent"></div>
            </div>

            <div className="geo-feature-card">
              <div className="geo-feature-num">03</div>
              <h3>FSRS SCHEDULER</h3>
              <p>Advanced spaced repetition algorithm optimizing review intervals for maximum retention</p>
              <div className="geo-feature-accent"></div>
            </div>

            <div className="geo-feature-card">
              <div className="geo-feature-num">04</div>
              <h3>EXAM ALIGNMENT</h3>
              <p>Questions mirror actual exam structure with validated 30-40-30 difficulty distribution</p>
              <div className="geo-feature-accent"></div>
            </div>

            <div className="geo-feature-card">
              <div className="geo-feature-num">05</div>
              <h3>DOMAIN COVERAGE</h3>
              <p>Complete mastery across all 5 Security+ domains with comprehensive topic mapping</p>
              <div className="geo-feature-accent"></div>
            </div>

            <div className="geo-feature-card">
              <div className="geo-feature-num">06</div>
              <h3>DEEP ANALYSIS</h3>
              <p>Detailed explanations for every answer option ensuring thorough understanding</p>
              <div className="geo-feature-accent"></div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="geo-footer">
          <div className="geo-footer-content">
            <div className="geo-footer-brand">
              <div className="geo-footer-logo">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="20,2 38,16 33,38 7,38 2,16" stroke="#00ff88" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <p>AI-POWERED CERTIFICATION PLATFORM</p>
              <p>COMPTIA SECURITY+ SY0-701</p>
            </div>

            <div className="geo-footer-links">
              <div>
                <h4>LEGAL</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
              </div>

              <div>
                <h4>SUPPORT</h4>
                <a href="#">Documentation</a>
                <a href="#">Contact</a>
                <a href="#">Status</a>
              </div>
            </div>
          </div>

          <div className="geo-footer-bottom">
            <span>© 2024 SECURITYPLUS AI</span>
            <span className="geo-footer-divider">|</span>
            <span>ALL RIGHTS RESERVED</span>
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
           ABSTRACT GEOMETRIC DESIGN SYSTEM
           ===================================== */

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .geo-container {
          min-height: 100vh;
          background: #0a0a0a;
          color: #ffffff;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          position: relative;
          overflow-x: hidden;
        }

        /* === Loading === */
        .geo-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
        }

        .geo-loading-box {
          text-align: center;
        }

        .geo-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid #1a1a1a;
          border-top: 3px solid #00ff88;
          border-right: 3px solid #00ff88;
          margin: 0 auto 1rem;
          animation: geo-spin 1s linear infinite;
        }

        .geo-loading p {
          color: #00ff88;
          font-size: 0.875rem;
          letter-spacing: 3px;
          font-weight: 700;
        }

        @keyframes geo-spin {
          to { transform: rotate(360deg); }
        }

        /* === Background Shapes === */
        .geo-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .geo-shape {
          position: absolute;
          opacity: 0.03;
          border: 2px solid #00ff88;
        }

        .geo-triangle-1 {
          width: 0;
          height: 0;
          border-left: 150px solid transparent;
          border-right: 150px solid transparent;
          border-bottom: 260px solid #00ff88;
          opacity: 0.02;
          top: 10%;
          right: 10%;
          transform: rotate(30deg);
          animation: geo-float-1 20s ease-in-out infinite;
        }

        .geo-square-1 {
          width: 200px;
          height: 200px;
          bottom: 15%;
          left: 5%;
          transform: rotate(45deg);
          animation: geo-float-2 25s ease-in-out infinite;
        }

        .geo-triangle-2 {
          width: 0;
          height: 0;
          border-left: 100px solid transparent;
          border-right: 100px solid transparent;
          border-top: 173px solid #00ff88;
          opacity: 0.02;
          top: 50%;
          left: 15%;
          animation: geo-float-3 22s ease-in-out infinite;
        }

        .geo-circle-1 {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          top: 20%;
          left: 50%;
          animation: geo-float-4 18s ease-in-out infinite;
        }

        .geo-pentagon-1 {
          width: 150px;
          height: 150px;
          clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
          background: #00ff88;
          opacity: 0.02;
          bottom: 25%;
          right: 20%;
          animation: geo-float-5 23s ease-in-out infinite;
        }

        @keyframes geo-float-1 {
          0%, 100% { transform: translate(0, 0) rotate(30deg); }
          50% { transform: translate(30px, -40px) rotate(60deg); }
        }

        @keyframes geo-float-2 {
          0%, 100% { transform: translate(0, 0) rotate(45deg); }
          50% { transform: translate(-40px, 30px) rotate(90deg); }
        }

        @keyframes geo-float-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, 40px); }
        }

        @keyframes geo-float-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -30px) scale(1.1); }
        }

        @keyframes geo-float-5 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -30px) rotate(180deg); }
        }

        /* === Grid === */
        .geo-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(#1a1a1a 1px, transparent 1px),
            linear-gradient(90deg, #1a1a1a 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.5;
        }

        /* === Content === */
        .geo-content {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* === Header === */
        .geo-header {
          margin-bottom: 4rem;
        }

        .geo-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .geo-logo svg {
          width: 50px;
          height: 50px;
        }

        .geo-logo span {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 3px;
          color: #00ff88;
        }

        /* === Main === */
        .geo-main {
          max-width: 800px;
          margin: 0 auto;
        }

        .geo-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
          font-size: 0.75rem;
          letter-spacing: 3px;
          font-weight: 700;
          color: #666;
        }

        .geo-badge-line {
          width: 40px;
          height: 2px;
          background: #00ff88;
        }

        .geo-title {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .geo-title-line {
          display: block;
          font-size: clamp(3rem, 8vw, 5rem);
          font-weight: 900;
          letter-spacing: -2px;
          line-height: 1;
        }

        .geo-title-accent {
          color: #00ff88;
          position: relative;
        }

        .geo-title-accent::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: #00ff88;
          opacity: 0.2;
        }

        .geo-subtitle {
          text-align: center;
          color: #999;
          font-size: 0.95rem;
          line-height: 1.8;
          margin-bottom: 3rem;
          letter-spacing: 0.5px;
        }

        /* === Box === */
        .geo-box {
          position: relative;
          background: #111;
          border: 2px solid #1a1a1a;
          padding: 3rem;
          margin-bottom: 3rem;
          transition: border-color 0.3s;
        }

        .geo-box:hover {
          border-color: #00ff88;
        }

        .geo-box-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid #00ff88;
        }

        .geo-box-tl {
          top: -2px;
          left: -2px;
          border-right: none;
          border-bottom: none;
        }

        .geo-box-tr {
          top: -2px;
          right: -2px;
          border-left: none;
          border-bottom: none;
        }

        .geo-box-bl {
          bottom: -2px;
          left: -2px;
          border-right: none;
          border-top: none;
        }

        .geo-box-br {
          bottom: -2px;
          right: -2px;
          border-left: none;
          border-top: none;
        }

        .geo-box-title {
          font-size: 0.875rem;
          letter-spacing: 3px;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #00ff88;
        }

        /* === Button === */
        .geo-btn {
          position: relative;
          width: 100%;
          padding: 1.25rem;
          background: #000;
          border: 2px solid #00ff88;
          color: #00ff88;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          transition: all 0.3s;
          overflow: hidden;
        }

        .geo-btn:hover:not(:disabled) {
          background: #00ff88;
          color: #000;
        }

        .geo-btn:hover:not(:disabled) .geo-google-icon path {
          fill: #000;
        }

        .geo-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .geo-google-icon {
          width: 20px;
          height: 20px;
        }

        .geo-btn-border {
          position: absolute;
          inset: -2px;
          border: 2px solid #00ff88;
          pointer-events: none;
          opacity: 0;
          animation: geo-border-pulse 2s ease-in-out infinite;
        }

        @keyframes geo-border-pulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        /* === Divider === */
        .geo-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 2rem 0;
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: #666;
          font-weight: 700;
        }

        .geo-divider span:first-child,
        .geo-divider span:last-child {
          flex: 1;
          height: 1px;
          background: #1a1a1a;
        }

        /* === Features List === */
        .geo-features {
          list-style: none;
          display: grid;
          gap: 0.75rem;
        }

        .geo-features li {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          letter-spacing: 1px;
          color: #999;
        }

        .geo-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #00ff88;
          color: #000;
          font-weight: 900;
          font-size: 0.875rem;
        }

        /* === Error === */
        .geo-error {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #1a0000;
          border: 2px solid #ff0044;
          margin-top: 1.5rem;
        }

        .geo-error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #ff0044;
          color: #000;
          font-weight: 900;
          flex-shrink: 0;
        }

        .geo-error-title {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #ff0044;
          margin-bottom: 0.25rem;
        }

        .geo-error-msg {
          font-size: 0.813rem;
          color: #999;
        }

        /* === Stats === */
        .geo-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 2rem;
          background: #111;
          border: 2px solid #1a1a1a;
          border-left: 4px solid #00ff88;
        }

        .geo-stat {
          text-align: center;
        }

        .geo-stat-value {
          font-size: 2rem;
          font-weight: 900;
          color: #00ff88;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .geo-stat-label {
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: #666;
          font-weight: 700;
        }

        .geo-stat-divider {
          width: 2px;
          height: 40px;
          background: #1a1a1a;
        }

        /* === Features Section === */
        .geo-features-section {
          margin: 6rem 0;
        }

        .geo-section-title {
          font-size: 0.875rem;
          letter-spacing: 3px;
          font-weight: 700;
          margin-bottom: 3rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .geo-section-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #00ff88;
          color: #000;
          font-size: 1rem;
        }

        .geo-grid-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .geo-feature-card {
          position: relative;
          background: #111;
          border: 2px solid #1a1a1a;
          padding: 2rem;
          transition: all 0.3s;
        }

        .geo-feature-card:hover {
          border-color: #00ff88;
          transform: translateX(10px);
        }

        .geo-feature-num {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 3rem;
          font-weight: 900;
          color: #1a1a1a;
          line-height: 1;
        }

        .geo-feature-card h3 {
          font-size: 1.125rem;
          letter-spacing: 2px;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        .geo-feature-card p {
          font-size: 0.938rem;
          line-height: 1.7;
          color: #999;
        }

        .geo-feature-accent {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 4px;
          background: #00ff88;
        }

        /* === Footer === */
        .geo-footer {
          margin-top: 6rem;
          padding-top: 3rem;
          border-top: 2px solid #1a1a1a;
        }

        .geo-footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .geo-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .geo-footer-logo svg {
          width: 40px;
          height: 40px;
        }

        .geo-footer-brand p {
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: #666;
          font-weight: 700;
        }

        .geo-footer-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .geo-footer-links h4 {
          font-size: 0.75rem;
          letter-spacing: 2px;
          margin-bottom: 1rem;
          color: #00ff88;
          font-weight: 700;
        }

        .geo-footer-links a {
          display: block;
          font-size: 0.875rem;
          color: #666;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: color 0.2s;
        }

        .geo-footer-links a:hover {
          color: #00ff88;
        }

        .geo-footer-bottom {
          padding: 1.5rem 0;
          border-top: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: #666;
          font-weight: 700;
        }

        .geo-footer-divider {
          color: #1a1a1a;
        }

        /* === Responsive === */
        @media (max-width: 768px) {
          .geo-content {
            padding: 1rem;
          }

          .geo-box {
            padding: 2rem 1.5rem;
          }

          .geo-stats {
            flex-wrap: wrap;
            gap: 1rem;
          }

          .geo-stat-divider {
            display: none;
          }

          .geo-grid-features {
            grid-template-columns: 1fr;
          }

          .geo-footer-content {
            grid-template-columns: 1fr;
          }

          .geo-footer-bottom {
            flex-direction: column;
            gap: 0.5rem;
          }

          .geo-footer-divider {
            display: none;
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
          outline: 2px solid #00ff88;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}
