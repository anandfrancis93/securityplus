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
  const [glitchActive, setGlitchActive] = useState(false);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);

    return () => clearInterval(glitchInterval);
  }, []);

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
      <div className="cyber-loading">
        <div className="cyber-loading-content">
          <div className="cyber-hex-loader">
            <div></div><div></div><div></div><div></div><div></div><div></div>
          </div>
          <div className="cyber-loading-text">
            <span>[</span> INITIALIZING NEURAL INTERFACE <span>]</span>
          </div>
          <div className="cyber-progress-bar">
            <div className="cyber-progress-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className={`cyber-container ${glitchActive ? 'glitch-active' : ''}`}>
      {/* Animated Scanlines */}
      <div className="cyber-scanlines"></div>

      {/* Grid Background */}
      <div className="cyber-grid">
        <div className="cyber-grid-lines"></div>
      </div>

      {/* Neon Circles */}
      <div className="cyber-circles">
        <div className="cyber-circle cyber-circle-1"></div>
        <div className="cyber-circle cyber-circle-2"></div>
        <div className="cyber-circle cyber-circle-3"></div>
      </div>

      {/* Holographic Overlay */}
      <div className="cyber-holo-overlay"></div>

      {/* Main Content */}
      <div className="cyber-content">
        {/* Header */}
        <header className="cyber-header">
          <div className="cyber-logo">
            <div className="cyber-logo-hex">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
                         fill="none" stroke="url(#neonGrad)" strokeWidth="2"/>
                <circle cx="50" cy="50" r="15" fill="none" stroke="url(#neonGrad)" strokeWidth="2"/>
                <line x1="35" y1="50" x2="65" y2="50" stroke="url(#neonGrad)" strokeWidth="2"/>
                <line x1="50" y1="35" x2="50" y2="65" stroke="url(#neonGrad)" strokeWidth="2"/>
                <defs>
                  <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00ffff" />
                    <stop offset="100%" stopColor="#ff00ff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="cyber-logo-text">
              <span className="cyber-logo-main">SECURITY+</span>
              <span className="cyber-logo-sub">NEURAL NETWORK</span>
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="cyber-main">
          {/* Status Badge */}
          <div className="cyber-status">
            <span className="cyber-status-dot"></span>
            <span>SYSTEM ONLINE</span>
            <span className="cyber-status-code">{'// SY0-701'}</span>
          </div>

          {/* Title */}
          <h1 className="cyber-title">
            <span className="cyber-title-glitch" data-text="NEURAL">NEURAL</span>
            <span className="cyber-title-glitch" data-text="CERTIFICATION">CERTIFICATION</span>
            <span className="cyber-title-glitch" data-text="PROTOCOL">PROTOCOL</span>
          </h1>

          {/* Subtitle */}
          <p className="cyber-subtitle">
            <span className="cyber-bracket">&lt;</span>
            Advanced AI-powered learning matrix with quantum-level analytics
            <span className="cyber-bracket">&gt;</span>
          </p>

          {/* Terminal Box */}
          <div className="cyber-terminal">
            <div className="cyber-terminal-header">
              <div className="cyber-terminal-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="cyber-terminal-title">AUTHENTICATION_PORTAL</span>
            </div>

            <div className="cyber-terminal-body">
              <div className="cyber-prompt">
                <span className="cyber-prompt-symbol">$</span>
                <span className="cyber-prompt-text">root@securityplus:~#</span>
                <span className="cyber-cursor"></span>
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="cyber-btn"
                aria-label={loading ? 'Authenticating' : 'Sign in with Google'}
              >
                <span className="cyber-btn-corner cyber-btn-tl"></span>
                <span className="cyber-btn-corner cyber-btn-tr"></span>
                <span className="cyber-btn-corner cyber-btn-bl"></span>
                <span className="cyber-btn-corner cyber-btn-br"></span>

                <svg className="cyber-google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>

                <span className="cyber-btn-text">
                  {loading ? (
                    <><span className="cyber-loading-dots">AUTHENTICATING</span>...</>
                  ) : (
                    <>INITIATE GOOGLE AUTH</>
                  )}
                </span>

                <div className="cyber-btn-glow"></div>
              </button>

              {/* System Info */}
              <div className="cyber-sys-info">
                <div className="cyber-info-line">
                  <span className="cyber-info-key">[ACCESS]</span>
                  <span className="cyber-info-value">UNLIMITED</span>
                </div>
                <div className="cyber-info-line">
                  <span className="cyber-info-key">[TOPICS]</span>
                  <span className="cyber-info-value">400+</span>
                </div>
                <div className="cyber-info-line">
                  <span className="cyber-info-key">[COST]</span>
                  <span className="cyber-info-value">$0.00</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="cyber-error">
                  <div className="cyber-error-header">
                    <span>[!]</span> AUTHENTICATION_ERROR
                  </div>
                  <div className="cyber-error-body">{error}</div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="cyber-stats">
            <div className="cyber-stat">
              <div className="cyber-stat-hex"></div>
              <div className="cyber-stat-value">400<span>+</span></div>
              <div className="cyber-stat-label">TOPICS</div>
            </div>
            <div className="cyber-stat-divider"></div>
            <div className="cyber-stat">
              <div className="cyber-stat-hex"></div>
              <div className="cyber-stat-value">A<span>I</span></div>
              <div className="cyber-stat-label">ENGINE</div>
            </div>
            <div className="cyber-stat-divider"></div>
            <div className="cyber-stat">
              <div className="cyber-stat-hex"></div>
              <div className="cyber-stat-value">IR<span>T</span></div>
              <div className="cyber-stat-label">ANALYTICS</div>
            </div>
            <div className="cyber-stat-divider"></div>
            <div className="cyber-stat">
              <div className="cyber-stat-hex"></div>
              <div className="cyber-stat-value">FSR<span>S</span></div>
              <div className="cyber-stat-label">ALGORITHM</div>
            </div>
          </div>
        </main>

        {/* Features */}
        <section className="cyber-features">
          <h2 className="cyber-section-title">
            <span className="cyber-section-line"></span>
            <span>SYSTEM MODULES</span>
            <span className="cyber-section-line"></span>
          </h2>

          <div className="cyber-features-grid">
            {[
              { title: 'AI QUESTION MATRIX', desc: 'Unlimited adaptive questions generated by neural networks across 400+ Security+ domains' },
              { title: 'IRT ANALYTICS CORE', desc: 'Item Response Theory engine providing precision ability tracking with real-time confidence intervals' },
              { title: 'FSRS SCHEDULER', desc: 'Free Spaced Repetition System optimizing review intervals for maximum memory retention' },
              { title: 'EXAM SIMULATION', desc: 'Questions mirroring actual CompTIA exam structure with validated difficulty calibration' },
              { title: 'DOMAIN COVERAGE', desc: 'Complete mastery system spanning all 5 Security+ domains with comprehensive mapping' },
              { title: 'DEEP ANALYSIS', desc: 'Comprehensive explanations ensuring complete conceptual understanding of all topics' }
            ].map((feature, i) => (
              <div key={i} className="cyber-feature-card">
                <div className="cyber-feature-number">0{i + 1}</div>
                <div className="cyber-feature-icon">
                  <div className="cyber-icon-hex"></div>
                </div>
                <h3 className="cyber-feature-title">{feature.title}</h3>
                <p className="cyber-feature-desc">{feature.desc}</p>
                <div className="cyber-feature-line"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="cyber-footer">
          <div className="cyber-footer-line"></div>
          <div className="cyber-footer-content">
            <div className="cyber-footer-left">
              <div className="cyber-footer-logo">
                <div className="cyber-footer-hex">
                  <svg viewBox="0 0 50 50">
                    <polygon points="25,5 45,15 45,35 25,45 5,35 5,15"
                             fill="none" stroke="#00ffff" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <div className="cyber-footer-brand">SECURITY+ AI</div>
                  <div className="cyber-footer-sub">Neural Certification Network</div>
                </div>
              </div>
            </div>

            <div className="cyber-footer-links">
              <div>
                <h4>SYSTEM</h4>
                <a href="#">Privacy Protocol</a>
                <a href="#">Terms Matrix</a>
                <a href="#">Data Policy</a>
              </div>
              <div>
                <h4>SUPPORT</h4>
                <a href="#">Documentation</a>
                <a href="#">Contact Node</a>
                <a href="#">Status Check</a>
              </div>
            </div>
          </div>

          <div className="cyber-footer-bottom">
            <span>© 2024 SECURITYPLUS AI</span>
            <span className="cyber-footer-sep">{'//'}</span>
            <span>ALL RIGHTS RESERVED</span>
            <span className="cyber-footer-sep">{'//'}</span>
            <span className="cyber-version">v2.1.0</span>
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
           CYBERPUNK DESIGN SYSTEM
           ===================================== */

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .cyber-container {
          min-height: 100vh;
          background: #000000;
          background-image:
            radial-gradient(ellipse at top, #0a0a1a 0%, #000000 50%),
            radial-gradient(ellipse at bottom, #1a0a1a 0%, #000000 50%);
          color: #00ffff;
          font-family: 'Courier New', 'Courier', monospace;
          position: relative;
          overflow-x: hidden;
        }

        /* === Scanlines === */
        .cyber-scanlines {
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 255, 0.03) 0px,
            transparent 1px,
            transparent 2px,
            rgba(0, 255, 255, 0.03) 3px
          );
          pointer-events: none;
          z-index: 100;
          animation: cyber-scan 8s linear infinite;
        }

        @keyframes cyber-scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }

        /* === Grid === */
        .cyber-grid {
          position: fixed;
          inset: 0;
          perspective: 1000px;
          pointer-events: none;
          z-index: 0;
        }

        .cyber-grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: rotateX(60deg) translateZ(-200px);
          animation: cyber-grid-move 20s linear infinite;
        }

        @keyframes cyber-grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }

        /* === Neon Circles === */
        .cyber-circles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .cyber-circle {
          position: absolute;
          border-radius: 50%;
          border: 2px solid;
          filter: blur(1px);
          opacity: 0.2;
        }

        .cyber-circle-1 {
          width: 400px;
          height: 400px;
          top: -100px;
          right: -100px;
          border-color: #00ffff;
          animation: cyber-pulse 4s ease-in-out infinite;
        }

        .cyber-circle-2 {
          width: 300px;
          height: 300px;
          bottom: -80px;
          left: -80px;
          border-color: #ff00ff;
          animation: cyber-pulse 5s ease-in-out infinite 1s;
        }

        .cyber-circle-3 {
          width: 250px;
          height: 250px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-color: #ffff00;
          animation: cyber-pulse 6s ease-in-out infinite 2s;
        }

        @keyframes cyber-pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }

        /* === Holographic Overlay === */
        .cyber-holo-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent 0%,
            rgba(0, 255, 255, 0.03) 25%,
            rgba(255, 0, 255, 0.03) 50%,
            rgba(255, 255, 0, 0.03) 75%,
            transparent 100%
          );
          background-size: 200% 200%;
          animation: cyber-holo 10s ease infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes cyber-holo {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* === Loading === */
        .cyber-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
        }

        .cyber-loading-content {
          text-align: center;
        }

        .cyber-hex-loader {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 2rem;
        }

        .cyber-hex-loader div {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #00ffff;
          box-shadow: 0 0 10px #00ffff;
          animation: cyber-hex-spin 2s linear infinite;
        }

        .cyber-hex-loader div:nth-child(1) { top: 0; left: 40px; animation-delay: 0s; }
        .cyber-hex-loader div:nth-child(2) { top: 20px; left: 60px; animation-delay: 0.2s; }
        .cyber-hex-loader div:nth-child(3) { top: 60px; left: 60px; animation-delay: 0.4s; }
        .cyber-hex-loader div:nth-child(4) { top: 80px; left: 40px; animation-delay: 0.6s; }
        .cyber-hex-loader div:nth-child(5) { top: 60px; left: 20px; animation-delay: 0.8s; }
        .cyber-hex-loader div:nth-child(6) { top: 20px; left: 20px; animation-delay: 1s; }

        @keyframes cyber-hex-spin {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        .cyber-loading-text {
          color: #00ffff;
          font-size: 0.875rem;
          letter-spacing: 2px;
          text-shadow: 0 0 10px #00ffff;
          margin-bottom: 1.5rem;
        }

        .cyber-loading-text span {
          color: #ff00ff;
        }

        .cyber-progress-bar {
          width: 200px;
          height: 4px;
          background: #1a1a1a;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .cyber-progress-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, #00ffff, #ff00ff, #ffff00);
          animation: cyber-progress 2s ease-in-out infinite;
        }

        @keyframes cyber-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* === Content === */
        .cyber-content {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* === Header === */
        .cyber-header {
          margin-bottom: 4rem;
        }

        .cyber-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cyber-logo-hex {
          width: 60px;
          height: 60px;
          filter: drop-shadow(0 0 15px #00ffff);
          animation: cyber-rotate 20s linear infinite;
        }

        @keyframes cyber-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cyber-logo-text {
          display: flex;
          flex-direction: column;
        }

        .cyber-logo-main {
          font-size: 1.5rem;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 10px #00ffff;
          letter-spacing: 2px;
        }

        .cyber-logo-sub {
          font-size: 0.75rem;
          color: #ff00ff;
          text-shadow: 0 0 8px #ff00ff;
          letter-spacing: 3px;
        }

        /* === Main === */
        .cyber-main {
          max-width: 700px;
          margin: 0 auto;
        }

        .cyber-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 2rem;
          font-size: 0.75rem;
          color: #00ff88;
          text-shadow: 0 0 8px #00ff88;
        }

        .cyber-status-dot {
          width: 8px;
          height: 8px;
          background: #00ff88;
          border-radius: 50%;
          box-shadow: 0 0 10px #00ff88;
          animation: cyber-blink 2s ease-in-out infinite;
        }

        @keyframes cyber-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .cyber-status-code {
          color: #666;
        }

        .cyber-title {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .cyber-title-glitch {
          display: block;
          font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: bold;
          color: #00ffff;
          text-shadow:
            0 0 10px #00ffff,
            0 0 20px #00ffff,
            0 0 30px #00ffff;
          position: relative;
          line-height: 1.1;
        }

        .glitch-active .cyber-title-glitch::before,
        .glitch-active .cyber-title-glitch::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-active .cyber-title-glitch::before {
          left: 2px;
          text-shadow: -2px 0 #ff00ff;
          clip: rect(24px, 550px, 90px, 0);
          animation: cyber-glitch-anim 0.3s infinite linear alternate-reverse;
        }

        .glitch-active .cyber-title-glitch::after {
          left: -2px;
          text-shadow: -2px 0 #00ff00;
          clip: rect(85px, 550px, 140px, 0);
          animation: cyber-glitch-anim 0.3s infinite linear alternate-reverse;
        }

        @keyframes cyber-glitch-anim {
          0% { clip: rect(42px, 9999px, 44px, 0); }
          20% { clip: rect(12px, 9999px, 59px, 0); }
          40% { clip: rect(48px, 9999px, 29px, 0); }
          60% { clip: rect(21px, 9999px, 35px, 0); }
          80% { clip: rect(56px, 9999px, 65px, 0); }
          100% { clip: rect(28px, 9999px, 38px, 0); }
        }

        .cyber-subtitle {
          text-align: center;
          color: #999;
          font-size: 0.938rem;
          margin-bottom: 3rem;
          letter-spacing: 0.5px;
        }

        .cyber-bracket {
          color: #ff00ff;
          text-shadow: 0 0 8px #ff00ff;
        }

        /* === Terminal === */
        .cyber-terminal {
          background: rgba(0, 20, 20, 0.8);
          border: 2px solid #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          margin-bottom: 3rem;
        }

        .cyber-terminal-header {
          background: rgba(0, 255, 255, 0.1);
          border-bottom: 1px solid #00ffff;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cyber-terminal-dots {
          display: flex;
          gap: 0.5rem;
        }

        .cyber-terminal-dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .cyber-terminal-dots span:nth-child(1) { background: #ff0055; box-shadow: 0 0 8px #ff0055; }
        .cyber-terminal-dots span:nth-child(2) { background: #ffff00; box-shadow: 0 0 8px #ffff00; }
        .cyber-terminal-dots span:nth-child(3) { background: #00ff88; box-shadow: 0 0 8px #00ff88; }

        .cyber-terminal-title {
          font-size: 0.75rem;
          color: #00ffff;
          letter-spacing: 2px;
        }

        .cyber-terminal-body {
          padding: 2rem;
        }

        .cyber-prompt {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          color: #00ff88;
        }

        .cyber-prompt-symbol {
          color: #ff00ff;
          text-shadow: 0 0 8px #ff00ff;
        }

        .cyber-cursor {
          display: inline-block;
          width: 8px;
          height: 16px;
          background: #00ffff;
          animation: cyber-cursor-blink 1s step-end infinite;
        }

        @keyframes cyber-cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* === Button === */
        .cyber-btn {
          position: relative;
          width: 100%;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
          border: 2px solid #00ffff;
          color: #00ffff;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: bold;
          letter-spacing: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          transition: all 0.3s;
          overflow: hidden;
        }

        .cyber-btn:hover:not(:disabled) {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .cyber-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cyber-btn-corner {
          position: absolute;
          width: 15px;
          height: 15px;
          border: 2px solid #ff00ff;
        }

        .cyber-btn-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; }
        .cyber-btn-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; }
        .cyber-btn-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; }
        .cyber-btn-br { bottom: -2px; right: -2px; border-left: none; border-top: none; }

        .cyber-google-icon {
          width: 20px;
          height: 20px;
        }

        .cyber-btn-text {
          position: relative;
          z-index: 1;
        }

        .cyber-btn-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          transform: translateX(-100%);
          animation: cyber-btn-glow 3s ease-in-out infinite;
        }

        @keyframes cyber-btn-glow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .cyber-loading-dots {
          animation: cyber-dots 1.5s steps(4) infinite;
        }

        @keyframes cyber-dots {
          0% { content: 'AUTHENTICATING'; }
          25% { content: 'AUTHENTICATING.'; }
          50% { content: 'AUTHENTICATING..'; }
          75% { content: 'AUTHENTICATING...'; }
        }

        /* === System Info === */
        .cyber-sys-info {
          margin-top: 2rem;
          display: grid;
          gap: 0.75rem;
        }

        .cyber-info-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          padding: 0.5rem;
          background: rgba(0, 255, 255, 0.05);
          border-left: 2px solid #00ffff;
        }

        .cyber-info-key {
          color: #ff00ff;
          text-shadow: 0 0 8px #ff00ff;
        }

        .cyber-info-value {
          color: #00ff88;
          text-shadow: 0 0 8px #00ff88;
        }

        /* === Error === */
        .cyber-error {
          margin-top: 1.5rem;
          background: rgba(255, 0, 68, 0.1);
          border: 2px solid #ff0044;
          padding: 1rem;
        }

        .cyber-error-header {
          color: #ff0044;
          text-shadow: 0 0 10px #ff0044;
          font-size: 0.875rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
        }

        .cyber-error-body {
          color: #999;
          font-size: 0.813rem;
        }

        /* === Stats === */
        .cyber-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 2rem;
          background: rgba(0, 20, 20, 0.5);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-left: 4px solid #00ffff;
          margin-bottom: 4rem;
        }

        .cyber-stat {
          position: relative;
          text-align: center;
        }

        .cyber-stat-hex {
          width: 40px;
          height: 40px;
          margin: 0 auto 0.5rem;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          background: linear-gradient(135deg, #00ffff, #ff00ff);
          opacity: 0.3;
        }

        .cyber-stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 10px #00ffff;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .cyber-stat-value span {
          color: #ff00ff;
          text-shadow: 0 0 10px #ff00ff;
        }

        .cyber-stat-label {
          font-size: 0.75rem;
          color: #666;
          letter-spacing: 2px;
        }

        .cyber-stat-divider {
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, transparent, #00ffff, transparent);
        }

        /* === Features === */
        .cyber-features {
          margin: 6rem 0;
        }

        .cyber-section-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
          font-size: 1rem;
          color: #00ffff;
          text-shadow: 0 0 10px #00ffff;
          letter-spacing: 3px;
        }

        .cyber-section-line {
          flex: 1;
          height: 2px;
          background: linear-gradient(to right, transparent, #00ffff, transparent);
        }

        .cyber-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .cyber-feature-card {
          position: relative;
          background: rgba(0, 20, 20, 0.6);
          border: 1px solid rgba(0, 255, 255, 0.3);
          padding: 2rem;
          transition: all 0.3s;
        }

        .cyber-feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #00ffff, #ff00ff);
          transform: scaleX(0);
          transition: transform 0.3s;
        }

        .cyber-feature-card:hover {
          border-color: #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          transform: translateY(-5px);
        }

        .cyber-feature-card:hover::before {
          transform: scaleX(1);
        }

        .cyber-feature-number {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 3rem;
          font-weight: bold;
          color: rgba(0, 255, 255, 0.1);
        }

        .cyber-feature-icon {
          width: 60px;
          height: 60px;
          margin-bottom: 1.5rem;
        }

        .cyber-icon-hex {
          width: 100%;
          height: 100%;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2));
          border: 2px solid #00ffff;
          animation: cyber-icon-pulse 3s ease-in-out infinite;
        }

        @keyframes cyber-icon-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); }
          50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.6); }
        }

        .cyber-feature-title {
          font-size: 1.125rem;
          color: #00ffff;
          text-shadow: 0 0 8px #00ffff;
          margin-bottom: 1rem;
          letter-spacing: 1px;
        }

        .cyber-feature-desc {
          font-size: 0.875rem;
          color: #999;
          line-height: 1.7;
        }

        .cyber-feature-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 80px;
          height: 2px;
          background: linear-gradient(90deg, #ff00ff, transparent);
        }

        /* === Footer === */
        .cyber-footer {
          margin-top: 6rem;
          padding-top: 3rem;
        }

        .cyber-footer-line {
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ffff, transparent);
          margin-bottom: 3rem;
        }

        .cyber-footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .cyber-footer-left {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cyber-footer-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cyber-footer-hex {
          width: 50px;
          height: 50px;
          filter: drop-shadow(0 0 10px #00ffff);
        }

        .cyber-footer-brand {
          font-size: 1rem;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 8px #00ffff;
          letter-spacing: 2px;
        }

        .cyber-footer-sub {
          font-size: 0.75rem;
          color: #ff00ff;
          text-shadow: 0 0 6px #ff00ff;
          letter-spacing: 2px;
        }

        .cyber-footer-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .cyber-footer-links h4 {
          font-size: 0.75rem;
          color: #00ffff;
          text-shadow: 0 0 8px #00ffff;
          margin-bottom: 1rem;
          letter-spacing: 2px;
        }

        .cyber-footer-links a {
          display: block;
          font-size: 0.875rem;
          color: #666;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }

        .cyber-footer-links a:hover {
          color: #00ffff;
          text-shadow: 0 0 8px #00ffff;
          padding-left: 10px;
        }

        .cyber-footer-bottom {
          padding: 1.5rem 0;
          border-top: 1px solid rgba(0, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-size: 0.75rem;
          color: #666;
          letter-spacing: 1px;
        }

        .cyber-footer-sep {
          color: #00ffff;
        }

        .cyber-version {
          color: #ff00ff;
          text-shadow: 0 0 6px #ff00ff;
        }

        /* === Responsive === */
        @media (max-width: 768px) {
          .cyber-content {
            padding: 1rem;
          }

          .cyber-terminal-body {
            padding: 1.5rem 1rem;
          }

          .cyber-stats {
            flex-wrap: wrap;
            gap: 1.5rem;
          }

          .cyber-stat-divider {
            display: none;
          }

          .cyber-features-grid {
            grid-template-columns: 1fr;
          }

          .cyber-footer-content {
            grid-template-columns: 1fr;
          }

          .cyber-footer-bottom {
            flex-wrap: wrap;
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
          outline: 2px solid #00ffff;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}
