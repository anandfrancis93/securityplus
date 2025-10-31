'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase';
import { useApp } from './AppProvider';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      <div className="modern-loading-screen">
        <div className="modern-loading-container">
          <div className="modern-spinner"></div>
          <p className="modern-loading-text">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="modern-login-container" ref={containerRef}>
      {/* Animated Background */}
      <div className="modern-bg-wrapper">
        <div className="modern-gradient-orb modern-orb-1"></div>
        <div className="modern-gradient-orb modern-orb-2"></div>
        <div className="modern-gradient-orb modern-orb-3"></div>
        <div className="modern-grid-overlay"></div>
      </div>

      {/* Floating particles */}
      <div className="modern-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="modern-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="modern-content-wrapper">
        {/* Header Navigation */}
        <nav className="modern-nav" role="navigation" aria-label="Main navigation">
          <div className="modern-nav-brand">
            <div className="modern-logo-glow">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5L7 11V19C7 27.2 12.4 35.1 20 37C27.6 35.1 33 27.2 33 19V11L20 5Z"
                      fill="url(#logoGradient)" stroke="url(#logoStroke)" strokeWidth="1.5"/>
                <path d="M17 20L19 22L23 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="logoGradient" x1="7" y1="5" x2="33" y2="37" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#667eea" />
                    <stop offset="1" stopColor="#764ba2" />
                  </linearGradient>
                  <linearGradient id="logoStroke" x1="7" y1="5" x2="33" y2="37" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="modern-brand-text">SecurityPlus AI</span>
          </div>
        </nav>

        {/* Hero Section - Glassmorphic Card */}
        <div className="modern-hero-section">
          <div className="modern-hero-content">
            {/* Animated Badge */}
            <div className="modern-badge">
              <span className="modern-badge-dot"></span>
              <span className="modern-badge-text">CompTIA Security+ SY0-701</span>
            </div>

            {/* Main Heading with Gradient */}
            <h1 className="modern-hero-title">
              Master Security+
              <br />
              <span className="modern-hero-highlight">with AI-Powered Learning</span>
            </h1>

            {/* Subtitle */}
            <p className="modern-hero-subtitle">
              Adaptive intelligence meets certification prep. Harness IRT analytics,
              FSRS spaced repetition, and unlimited AI-generated questions to ace your exam.
            </p>

            {/* Glassmorphic Login Card */}
            <div
              className="modern-glass-card"
              onMouseEnter={() => setIsHoveringCard(true)}
              onMouseLeave={() => setIsHoveringCard(false)}
              style={{
                transform: isHoveringCard
                  ? `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.1}deg) rotateY(${(mousePosition.x - 50) * 0.1}deg)`
                  : 'none'
              }}
            >
              <div className="modern-card-glow"></div>

              {/* Card Header */}
              <div className="modern-card-header">
                <h2 className="modern-card-title">Begin Your Journey</h2>
                <p className="modern-card-subtitle">Sign in instantly with Google</p>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="modern-google-btn"
                aria-label={loading ? 'Signing in, please wait' : 'Sign in with Google'}
              >
                <div className="modern-btn-content">
                  <svg className="modern-google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="modern-btn-text">
                    {loading ? (
                      <>
                        <span className="modern-spinner-small"></span>
                        Signing in...
                      </>
                    ) : 'Continue with Google'}
                  </span>
                </div>
                <div className="modern-btn-shine"></div>
              </button>

              {/* Features Pills */}
              <div className="modern-features-pills">
                <div className="modern-pill">
                  <svg className="modern-pill-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Free Forever</span>
                </div>
                <div className="modern-pill">
                  <svg className="modern-pill-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>No Credit Card</span>
                </div>
                <div className="modern-pill">
                  <svg className="modern-pill-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>400+ Topics</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="modern-error-banner" role="alert" aria-live="polite">
                  <svg className="modern-error-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <div className="modern-error-title">Authentication Failed</div>
                    <div className="modern-error-message">{error}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Showcase */}
            <div className="modern-stats-grid">
              <div className="modern-stat-item">
                <div className="modern-stat-value">400+</div>
                <div className="modern-stat-label">Exam Topics</div>
              </div>
              <div className="modern-stat-item">
                <div className="modern-stat-value">AI</div>
                <div className="modern-stat-label">Generated Questions</div>
              </div>
              <div className="modern-stat-item">
                <div className="modern-stat-value">IRT</div>
                <div className="modern-stat-label">Analytics Engine</div>
              </div>
              <div className="modern-stat-item">
                <div className="modern-stat-value">FSRS</div>
                <div className="modern-stat-label">Spaced Repetition</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="modern-features-section">
          <div className="modern-section-header">
            <h2 className="modern-section-title">Engineered for Success</h2>
            <p className="modern-section-desc">
              State-of-the-art learning algorithms meet intuitive design
            </p>
          </div>

          <div className="modern-features-grid">
            {/* Feature 1 */}
            <div className="modern-feature-card">
              <div className="modern-feature-icon modern-icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3 className="modern-feature-title">AI Question Engine</h3>
              <p className="modern-feature-desc">
                Unlimited unique questions powered by advanced AI, covering all 400+ Security+ topics with intelligent difficulty balancing
              </p>
            </div>

            {/* Feature 2 */}
            <div className="modern-feature-card">
              <div className="modern-feature-icon modern-icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18 17l-3-3-4 4-5-5-3 3"/>
                </svg>
              </div>
              <h3 className="modern-feature-title">IRT Analytics</h3>
              <p className="modern-feature-desc">
                Precision ability tracking using Item Response Theory with confidence intervals and real-time score predictions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="modern-feature-card">
              <div className="modern-feature-icon modern-icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3 className="modern-feature-title">Adaptive Scheduling</h3>
              <p className="modern-feature-desc">
                FSRS-powered spaced repetition optimizes review intervals for maximum retention and long-term memory consolidation
              </p>
            </div>

            {/* Feature 4 */}
            <div className="modern-feature-card">
              <div className="modern-feature-icon modern-icon-orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
              </div>
              <h3 className="modern-feature-title">Exam-Aligned</h3>
              <p className="modern-feature-desc">
                Questions mirror actual exam structure with scientifically validated 30-40-30 difficulty distribution
              </p>
            </div>

            {/* Feature 5 */}
            <div className="modern-feature-card">
              <div className="modern-feature-icon modern-icon-pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
                </svg>
              </div>
              <h3 className="modern-feature-title">Complete Coverage</h3>
              <p className="modern-feature-desc">
                Full domain mastery across all 5 Security+ domains: Concepts, Threats, Architecture, Operations, and Governance
              </p>
            </div>

            {/* Feature 6 */}
            <div className="modern-feature-card">
              <div className="modern-feature-icon modern-icon-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <h3 className="modern-feature-title">Deep Explanations</h3>
              <p className="modern-feature-desc">
                Comprehensive explanations for every answer option ensuring thorough conceptual understanding
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="modern-footer">
          <div className="modern-footer-content">
            <div className="modern-footer-brand">
              <div className="modern-footer-logo">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 5L7 11V19C7 27.2 12.4 35.1 20 37C27.6 35.1 33 27.2 33 19V11L20 5Z"
                        fill="url(#footerLogoGradient)" opacity="0.8"/>
                  <defs>
                    <linearGradient id="footerLogoGradient" x1="7" y1="5" x2="33" y2="37">
                      <stop stopColor="#667eea" />
                      <stop offset="1" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="modern-footer-desc">
                AI-powered adaptive learning for CompTIA Security+ SY0-701 certification
              </p>
            </div>

            <div className="modern-footer-links">
              <div className="modern-footer-section">
                <h4 className="modern-footer-heading">Legal</h4>
                <a href="#" className="modern-footer-link">Privacy Policy</a>
                <a href="#" className="modern-footer-link">Terms of Service</a>
                <a href="#" className="modern-footer-link">Cookie Policy</a>
              </div>

              <div className="modern-footer-section">
                <h4 className="modern-footer-heading">Support</h4>
                <a href="#" className="modern-footer-link">Documentation</a>
                <a href="#" className="modern-footer-link">Contact Us</a>
                <a href="#" className="modern-footer-link">System Status</a>
              </div>
            </div>
          </div>

          <div className="modern-footer-bottom">
            <p>© 2024 SecurityPlus AI. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://securityplusai.com/#organization",
                "name": "SecurityPlus AI",
                "url": "https://securityplusai.com",
                "description": "AI-powered adaptive learning platform for CompTIA Security+ SY0-701 certification"
              },
              {
                "@type": "WebApplication",
                "name": "SecurityPlus AI",
                "url": "https://securityplusai.com",
                "applicationCategory": "EducationalApplication",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              }
            ]
          })
        }}
      />

      <style jsx>{`
        /* ===========================
           MODERN DESIGN SYSTEM
           =========================== */

        /* === Global Styles === */
        .modern-login-container {
          min-height: 100vh;
          position: relative;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
        }

        /* === Loading Screen === */
        .modern-loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        }

        .modern-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .modern-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(167, 139, 250, 0.2);
          border-top-color: #a78bfa;
          border-radius: 50%;
          animation: modern-spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          filter: drop-shadow(0 0 20px rgba(167, 139, 250, 0.6));
        }

        .modern-loading-text {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        @keyframes modern-spin {
          to { transform: rotate(360deg); }
        }

        /* === Animated Background === */
        .modern-bg-wrapper {
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .modern-gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: modern-float 20s ease-in-out infinite;
        }

        .modern-orb-1 {
          width: 500px;
          height: 500px;
          top: -100px;
          right: -100px;
          background: radial-gradient(circle, #667eea 0%, #764ba2 100%);
          animation-delay: 0s;
        }

        .modern-orb-2 {
          width: 400px;
          height: 400px;
          bottom: -50px;
          left: -50px;
          background: radial-gradient(circle, #f093fb 0%, #f5576c 100%);
          animation-delay: 7s;
        }

        .modern-orb-3 {
          width: 350px;
          height: 350px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, #4facfe 0%, #00f2fe 100%);
          animation-delay: 14s;
        }

        @keyframes modern-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .modern-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(167, 139, 250, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167, 139, 250, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: modern-grid-slide 20s linear infinite;
        }

        @keyframes modern-grid-slide {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        /* === Floating Particles === */
        .modern-particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .modern-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.8), transparent);
          border-radius: 50%;
          animation: modern-particle-float linear infinite;
          top: 100%;
        }

        @keyframes modern-particle-float {
          to {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }

        /* === Content Wrapper === */
        .modern-content-wrapper {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* === Navigation === */
        .modern-nav {
          padding: 1.5rem 2rem;
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modern-nav-brand {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .modern-logo-glow {
          width: 40px;
          height: 40px;
          filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.6));
          animation: modern-logo-pulse 3s ease-in-out infinite;
        }

        @keyframes modern-logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.6)); }
          50% { filter: drop-shadow(0 0 30px rgba(102, 126, 234, 0.9)); }
        }

        .modern-brand-text {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        /* === Hero Section === */
        .modern-hero-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
        }

        .modern-hero-content {
          max-width: 580px;
          width: 100%;
          text-align: center;
        }

        /* === Badge === */
        .modern-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(167, 139, 250, 0.1);
          border: 1px solid rgba(167, 139, 250, 0.3);
          border-radius: 50px;
          margin-bottom: 1.5rem;
          animation: modern-badge-glow 2s ease-in-out infinite;
        }

        @keyframes modern-badge-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(167, 139, 250, 0.3); }
          50% { box-shadow: 0 0 20px rgba(167, 139, 250, 0.5); }
        }

        .modern-badge-dot {
          width: 8px;
          height: 8px;
          background: #a78bfa;
          border-radius: 50%;
          animation: modern-pulse 2s ease-in-out infinite;
        }

        @keyframes modern-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .modern-badge-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #a78bfa;
          letter-spacing: 0.5px;
        }

        /* === Hero Title === */
        .modern-hero-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.1;
          color: #ffffff;
          margin: 0 0 1rem;
          letter-spacing: -1px;
        }

        .modern-hero-highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
          animation: modern-gradient-shift 5s ease infinite;
          background-size: 200% 200%;
        }

        @keyframes modern-gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .modern-hero-subtitle {
          font-size: 1.125rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 2.5rem;
          font-weight: 400;
        }

        /* === Glass Card === */
        .modern-glass-card {
          position: relative;
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          margin-bottom: 2.5rem;
        }

        .modern-glass-card:hover {
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 40px rgba(167, 139, 250, 0.2);
        }

        .modern-card-glow {
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
          border-radius: 24px;
          opacity: 0;
          filter: blur(20px);
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .modern-glass-card:hover .modern-card-glow {
          opacity: 0.5;
        }

        .modern-card-header {
          margin-bottom: 1.5rem;
        }

        .modern-card-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }

        .modern-card-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        /* === Google Button === */
        .modern-google-btn {
          position: relative;
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }

        .modern-google-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .modern-google-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .modern-google-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .modern-btn-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          z-index: 1;
        }

        .modern-google-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .modern-btn-text {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modern-spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(31, 41, 55, 0.2);
          border-top-color: #1f2937;
          border-radius: 50%;
          animation: modern-spin 0.6s linear infinite;
        }

        .modern-btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s ease;
        }

        .modern-google-btn:hover .modern-btn-shine {
          left: 100%;
        }

        /* === Feature Pills === */
        .modern-features-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }

        .modern-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50px;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .modern-pill:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(167, 139, 250, 0.3);
        }

        .modern-pill-icon {
          width: 16px;
          height: 16px;
          color: #a78bfa;
        }

        /* === Error Banner === */
        .modern-error-banner {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          margin-top: 1rem;
          animation: modern-slide-down 0.3s ease;
        }

        @keyframes modern-slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modern-error-icon {
          width: 20px;
          height: 20px;
          color: #ef4444;
          flex-shrink: 0;
        }

        .modern-error-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ef4444;
          margin-bottom: 0.25rem;
        }

        .modern-error-message {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        /* === Stats Grid === */
        .modern-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1.5rem;
          margin-top: 3rem;
          padding-top: 3rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modern-stat-item {
          text-align: center;
        }

        .modern-stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .modern-stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        /* === Features Section === */
        .modern-features-section {
          padding: 5rem 1.5rem;
        }

        .modern-section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 4rem;
        }

        .modern-section-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 1rem;
          letter-spacing: -0.5px;
        }

        .modern-section-desc {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        .modern-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .modern-feature-card {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modern-feature-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(167, 139, 250, 0.3);
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .modern-feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: transform 0.4s ease;
        }

        .modern-feature-card:hover .modern-feature-icon {
          transform: scale(1.1) rotate(-5deg);
        }

        .modern-icon-purple {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .modern-icon-blue {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          box-shadow: 0 8px 20px rgba(79, 172, 254, 0.3);
        }

        .modern-icon-green {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          box-shadow: 0 8px 20px rgba(67, 233, 123, 0.3);
        }

        .modern-icon-orange {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          box-shadow: 0 8px 20px rgba(250, 112, 154, 0.3);
        }

        .modern-icon-pink {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          box-shadow: 0 8px 20px rgba(240, 147, 251, 0.3);
        }

        .modern-icon-teal {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          box-shadow: 0 8px 20px rgba(79, 172, 254, 0.3);
        }

        .modern-feature-icon svg {
          width: 28px;
          height: 28px;
          color: white;
        }

        .modern-feature-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.75rem;
        }

        .modern-feature-desc {
          font-size: 0.975rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        /* === Footer === */
        .modern-footer {
          padding: 3rem 1.5rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }

        .modern-footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .modern-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .modern-footer-logo svg {
          width: 40px;
          height: 40px;
          filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.5));
        }

        .modern-footer-desc {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }

        .modern-footer-links {
          display: flex;
          gap: 3rem;
        }

        .modern-footer-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .modern-footer-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .modern-footer-link {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .modern-footer-link:hover {
          color: #a78bfa;
        }

        .modern-footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .modern-footer-bottom p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* === Responsive Design === */
        @media (max-width: 768px) {
          .modern-hero-title {
            font-size: 2rem;
          }

          .modern-glass-card {
            padding: 1.5rem;
          }

          .modern-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .modern-features-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .modern-footer-content {
            grid-template-columns: 1fr;
          }

          .modern-footer-links {
            flex-direction: column;
            gap: 1.5rem;
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

        /* === Focus States === */
        *:focus-visible {
          outline: 2px solid #a78bfa;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
