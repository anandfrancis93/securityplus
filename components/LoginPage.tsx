'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase';
import { useApp } from './AppProvider';
import { Button } from '@carbon/react';
import { Login as LoginIcon, ArrowRight, CheckmarkFilled, Dashboard, ChartLine, Book, Security } from '@carbon/icons-react';

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
      <div className="cds--loading-overlay">
        <div className="cds--loading">
          <svg className="cds--loading__svg" viewBox="0 0 100 100">
            <circle className="cds--loading__stroke" cx="50%" cy="50%" r="44" />
          </svg>
        </div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="carbon-login-page">
      {/* Carbon Header */}
      <header className="cds--header" role="banner">
        <div className="cds--header__global">
          <div className="cds--header-name">
            <span className="cds--header-name-prefix">Security</span>
            <span className="cds--header-name-main">Plus AI</span>
          </div>
          <nav className="cds--header__nav" aria-label="Main navigation">
            <Button
              kind="tertiary"
              size="md"
              renderIcon={LoginIcon}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section - Carbon Grid */}
      <section className="carbon-hero">
        <div className="cds--grid cds--grid--full-width">
          <div className="cds--row">
            <div className="cds--col-lg-8 cds--offset-lg-2 cds--col-md-8 carbon-hero__content">
              {/* Tag */}
              <div className="cds--tag cds--tag--green">
                <Security size={16} />
                <span className="cds--tag__label">SY0-701 Certification</span>
              </div>

              {/* Headline */}
              <h1 className="carbon-hero__headline">
                Master Security+ with adaptive AI learning
              </h1>

              {/* Subheadline */}
              <p className="carbon-hero__subheadline cds--type-body-long-02">
                Intelligent question generation, real-time analytics, and spaced repetition algorithms
                designed to help you pass the CompTIA Security+ SY0-701 exam with confidence.
              </p>

              {/* CTA Buttons */}
              <div className="carbon-hero__cta">
                <Button
                  kind="primary"
                  size="xl"
                  renderIcon={ArrowRight}
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Start learning free'}
                </Button>
                <Button
                  kind="secondary"
                  size="xl"
                  href="#features"
                >
                  View capabilities
                </Button>
              </div>

              {/* Trust Bar */}
              <div className="carbon-trust-bar">
                <div className="carbon-trust-item">
                  <CheckmarkFilled size={16} className="carbon-trust-icon" />
                  <span>Free forever</span>
                </div>
                <div className="carbon-trust-item">
                  <CheckmarkFilled size={16} className="carbon-trust-icon" />
                  <span>No credit card</span>
                </div>
                <div className="carbon-trust-item">
                  <CheckmarkFilled size={16} className="carbon-trust-icon" />
                  <span>400+ topics</span>
                </div>
              </div>

              {/* Error Notification */}
              {error && (
                <div className="cds--inline-notification cds--inline-notification--error" role="alert">
                  <div className="cds--inline-notification__details">
                    <div className="cds--inline-notification__text-wrapper">
                      <p className="cds--inline-notification__title">Authentication error</p>
                      <p className="cds--inline-notification__subtitle">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="carbon-stats">
        <div className="cds--grid">
          <div className="cds--row">
            <div className="cds--col-lg-3 cds--col-md-2 cds--col-sm-2">
              <div className="carbon-stat">
                <div className="carbon-stat__number">400+</div>
                <div className="carbon-stat__label cds--type-label-01">Security+ topics</div>
              </div>
            </div>
            <div className="cds--col-lg-3 cds--col-md-2 cds--col-sm-2">
              <div className="carbon-stat">
                <div className="carbon-stat__number">AI</div>
                <div className="carbon-stat__label cds--type-label-01">Question generation</div>
              </div>
            </div>
            <div className="cds--col-lg-3 cds--col-md-2 cds--col-sm-2">
              <div className="carbon-stat">
                <div className="carbon-stat__number">IRT</div>
                <div className="carbon-stat__label cds--type-label-01">Ability tracking</div>
              </div>
            </div>
            <div className="cds--col-lg-3 cds--col-md-2 cds--col-sm-2">
              <div className="carbon-stat">
                <div className="carbon-stat__number">FSRS</div>
                <div className="carbon-stat__label cds--type-label-01">Spaced repetition</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="carbon-features">
        <div className="cds--grid">
          <div className="cds--row">
            <div className="cds--col-lg-8 cds--offset-lg-2">
              <h2 className="carbon-section-title cds--type-expressive-heading-05">
                Platform capabilities
              </h2>
              <p className="carbon-section-subtitle cds--type-body-long-02">
                Enterprise-grade learning tools built on proven algorithms and modern architecture
              </p>
            </div>
          </div>

          <div className="cds--row carbon-feature-grid">
            {/* Feature 1 */}
            <div className="cds--col-lg-4 cds--col-md-4">
              <div className="cds--tile carbon-feature-tile">
                <div className="carbon-feature-icon carbon-feature-icon--purple">
                  <Dashboard size={24} />
                </div>
                <h3 className="cds--type-productive-heading-03">AI question generation</h3>
                <p className="cds--type-body-short-01">
                  Unlimited unique questions covering all 400+ Security+ topics with deterministic
                  difficulty distribution matching real exam patterns.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="cds--col-lg-4 cds--col-md-4">
              <div className="cds--tile carbon-feature-tile">
                <div className="carbon-feature-icon carbon-feature-icon--blue">
                  <ChartLine size={24} />
                </div>
                <h3 className="cds--type-productive-heading-03">IRT analytics</h3>
                <p className="cds--type-body-short-01">
                  Advanced Item Response Theory provides precise ability estimates with confidence
                  intervals and score predictions based on your performance.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="cds--col-lg-4 cds--col-md-4">
              <div className="cds--tile carbon-feature-tile">
                <div className="carbon-feature-icon carbon-feature-icon--teal">
                  <Book size={24} />
                </div>
                <h3 className="cds--type-productive-heading-03">Spaced repetition</h3>
                <p className="cds--type-body-short-01">
                  FSRS-powered flashcard system with adaptive scheduling optimizes review
                  intervals for maximum long-term retention and recall.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="cds--col-lg-4 cds--col-md-4">
              <div className="cds--tile carbon-feature-tile">
                <div className="carbon-feature-icon carbon-feature-icon--magenta">
                  <Security size={24} />
                </div>
                <h3 className="cds--type-productive-heading-03">Exam-aligned format</h3>
                <p className="cds--type-body-short-01">
                  Questions mirror actual exam structure with 30% easy, 40% medium, 30% hard
                  distribution and both single and multiple-select formats.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="cds--col-lg-4 cds--col-md-4">
              <div className="cds--tile carbon-feature-tile">
                <div className="carbon-feature-icon carbon-feature-icon--cyan">
                  <Dashboard size={24} />
                </div>
                <h3 className="cds--type-productive-heading-03">Full domain coverage</h3>
                <p className="cds--type-body-short-01">
                  Complete coverage of all 5 Security+ domains: General Security Concepts,
                  Threats, Architecture, Operations, and Governance.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="cds--col-lg-4 cds--col-md-4">
              <div className="cds--tile carbon-feature-tile">
                <div className="carbon-feature-icon carbon-feature-icon--purple">
                  <ChartLine size={24} />
                </div>
                <h3 className="cds--type-productive-heading-03">Detailed explanations</h3>
                <p className="cds--type-body-short-01">
                  Comprehensive explanations for every answer option help you understand
                  concepts deeply rather than just memorizing facts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="carbon-steps">
        <div className="cds--grid">
          <div className="cds--row">
            <div className="cds--col-lg-8 cds--offset-lg-2">
              <h2 className="carbon-section-title cds--type-expressive-heading-05">
                Getting started
              </h2>
              <p className="carbon-section-subtitle cds--type-body-long-02">
                Begin your Security+ certification journey in three steps
              </p>
            </div>
          </div>

          <div className="cds--row">
            <div className="cds--col-lg-8 cds--offset-lg-2">
              <div className="carbon-steps-container">
                {/* Step 1 */}
                <div className="carbon-step">
                  <div className="carbon-step-number">01</div>
                  <div className="carbon-step-content">
                    <h3 className="cds--type-productive-heading-03">Authenticate with Google</h3>
                    <p className="cds--type-body-short-01">
                      Single sign-on authentication. No forms, no credit card, no configuration required.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="carbon-step">
                  <div className="carbon-step-number">02</div>
                  <div className="carbon-step-content">
                    <h3 className="cds--type-productive-heading-03">Start adaptive quiz</h3>
                    <p className="cds--type-body-short-01">
                      Begin with 10 AI-generated questions calibrated to establish your baseline ability level.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="carbon-step">
                  <div className="carbon-step-number">03</div>
                  <div className="carbon-step-content">
                    <h3 className="cds--type-productive-heading-03">Monitor analytics</h3>
                    <p className="cds--type-body-short-01">
                      Track ability progression with IRT-based analytics and confidence intervals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="carbon-cta">
        <div className="cds--grid">
          <div className="cds--row">
            <div className="cds--col-lg-8 cds--offset-lg-2">
              <div className="cds--tile carbon-cta-tile">
                <h2 className="cds--type-expressive-heading-04">
                  Ready to begin your certification journey?
                </h2>
                <p className="cds--type-body-long-02">
                  Join learners using AI-powered adaptive learning to pass Security+ certification.
                </p>
                <div className="carbon-cta-actions">
                  <Button
                    kind="primary"
                    size="xl"
                    renderIcon={ArrowRight}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : 'Get started free'}
                  </Button>
                </div>
                <p className="carbon-cta-subtitle cds--type-helper-text-01">
                  No credit card required • Free forever • Start in 30 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="carbon-footer">
        <div className="cds--grid">
          <div className="cds--row">
            <div className="cds--col-lg-4">
              <div className="carbon-footer-brand">
                <span className="carbon-footer-name">SecurityPlus AI</span>
                <p className="cds--type-body-short-01">
                  AI-powered learning platform for CompTIA Security+ SY0-701 certification
                </p>
              </div>
            </div>
            <div className="cds--col-lg-4">
              <p className="cds--type-label-01 carbon-footer-heading">Legal</p>
              <ul className="carbon-footer-links">
                <li><a href="#" className="cds--link">Privacy policy</a></li>
                <li><a href="#" className="cds--link">Terms of service</a></li>
                <li><a href="#" className="cds--link">Cookie policy</a></li>
              </ul>
            </div>
            <div className="cds--col-lg-4">
              <p className="cds--type-label-01 carbon-footer-heading">Support</p>
              <ul className="carbon-footer-links">
                <li><a href="#" className="cds--link">Documentation</a></li>
                <li><a href="#" className="cds--link">Contact us</a></li>
                <li><a href="#" className="cds--link">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="cds--row carbon-footer-legal">
            <div className="cds--col">
              <p className="cds--type-legal-01">
                © 2024 SecurityPlus AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .carbon-login-page {
          min-height: 100vh;
          background: var(--cds-background, #161616);
          color: var(--cds-text-primary, #f4f4f4);
        }

        /* Header Styles */
        .cds--header {
          background: var(--cds-ui-background, #262626);
          border-bottom: 1px solid var(--cds-ui-03, #393939);
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          position: sticky;
          top: 0;
          z-index: 8000;
        }

        .cds--header__global {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1584px;
          margin: 0 auto;
        }

        .cds--header-name {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.1px;
        }

        .cds--header-name-prefix {
          color: var(--cds-text-secondary, #c6c6c6);
        }

        .cds--header-name-main {
          color: var(--cds-text-primary, #f4f4f4);
        }

        /* Hero Section */
        .carbon-hero {
          padding: 4rem 0 6rem;
          background: var(--cds-background, #161616);
        }

        .carbon-hero__content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .cds--tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 0.75rem;
          height: 24px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 12px;
          width: fit-content;
        }

        .cds--tag--green {
          background: var(--cds-tag-background-green, #0f62fe);
          color: var(--cds-tag-color-green, #ffffff);
        }

        .carbon-hero__headline {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 300;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--cds-text-primary, #f4f4f4);
          margin: 0;
        }

        .carbon-hero__subheadline {
          color: var(--cds-text-secondary, #c6c6c6);
          max-width: 38rem;
          line-height: 1.5;
        }

        .carbon-hero__cta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .carbon-trust-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--cds-border-subtle-01, #393939);
        }

        .carbon-trust-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--cds-text-secondary, #c6c6c6);
        }

        .carbon-trust-icon {
          color: var(--cds-support-success, #24a148);
        }

        /* Stats Section */
        .carbon-stats {
          background: var(--cds-layer-01, #262626);
          padding: 3rem 0;
          border-top: 1px solid var(--cds-border-subtle-01, #393939);
          border-bottom: 1px solid var(--cds-border-subtle-01, #393939);
        }

        .carbon-stat {
          text-align: center;
          padding: 1rem;
        }

        .carbon-stat__number {
          font-size: 3rem;
          font-weight: 300;
          color: var(--cds-text-primary, #f4f4f4);
          margin-bottom: 0.5rem;
        }

        .carbon-stat__label {
          color: var(--cds-text-secondary, #c6c6c6);
          text-transform: uppercase;
        }

        /* Features Section */
        .carbon-features {
          padding: 6rem 0;
          background: var(--cds-background, #161616);
        }

        .carbon-section-title {
          margin-bottom: 1rem;
          font-weight: 300;
        }

        .carbon-section-subtitle {
          color: var(--cds-text-secondary, #c6c6c6);
          margin-bottom: 4rem;
        }

        .carbon-feature-grid {
          margin-top: 3rem;
        }

        .cds--tile {
          background: var(--cds-layer-01, #262626);
          padding: 1.5rem;
          min-height: 100%;
          transition: all 0.2s cubic-bezier(0.2, 0, 0.38, 0.9);
        }

        .carbon-feature-tile:hover {
          background: var(--cds-layer-hover-01, #2e2e2e);
        }

        .carbon-feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .carbon-feature-icon--purple { background: #8a3ffc; }
        .carbon-feature-icon--blue { background: #0f62fe; }
        .carbon-feature-icon--teal { background: #007d79; }
        .carbon-feature-icon--magenta { background: #d02670; }
        .carbon-feature-icon--cyan { background: #1192e8; }

        .carbon-feature-tile h3 {
          margin-bottom: 1rem;
          color: var(--cds-text-primary, #f4f4f4);
        }

        .carbon-feature-tile p {
          color: var(--cds-text-secondary, #c6c6c6);
          line-height: 1.5;
        }

        /* Steps Section */
        .carbon-steps {
          padding: 6rem 0;
          background: var(--cds-layer-01, #262626);
        }

        .carbon-steps-container {
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .carbon-step {
          display: flex;
          gap: 1.5rem;
          padding: 2rem;
          background: var(--cds-layer-02, #303030);
          border-left: 4px solid var(--cds-border-interactive, #0f62fe);
        }

        .carbon-step-number {
          font-size: 2rem;
          font-weight: 300;
          color: var(--cds-text-secondary, #c6c6c6);
          min-width: 4rem;
        }

        .carbon-step-content h3 {
          margin-bottom: 0.5rem;
          color: var(--cds-text-primary, #f4f4f4);
        }

        .carbon-step-content p {
          color: var(--cds-text-secondary, #c6c6c6);
          line-height: 1.5;
        }

        /* CTA Section */
        .carbon-cta {
          padding: 6rem 0;
          background: var(--cds-background, #161616);
        }

        .carbon-cta-tile {
          background: var(--cds-layer-01, #262626);
          padding: 3rem;
          text-align: center;
          border: 1px solid var(--cds-border-subtle-01, #393939);
        }

        .carbon-cta-tile h2 {
          margin-bottom: 1rem;
          font-weight: 300;
        }

        .carbon-cta-tile p {
          color: var(--cds-text-secondary, #c6c6c6);
          margin-bottom: 2rem;
          max-width: 32rem;
          margin-left: auto;
          margin-right: auto;
        }

        .carbon-cta-actions {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .carbon-cta-subtitle {
          color: var(--cds-text-helper, #6f6f6f);
        }

        /* Footer */
        .carbon-footer {
          background: var(--cds-layer-01, #262626);
          padding: 3rem 0 2rem;
          border-top: 1px solid var(--cds-border-subtle-01, #393939);
        }

        .carbon-footer-brand {
          margin-bottom: 2rem;
        }

        .carbon-footer-name {
          font-size: 1.25rem;
          font-weight: 600;
          display: block;
          margin-bottom: 0.5rem;
        }

        .carbon-footer-heading {
          color: var(--cds-text-primary, #f4f4f4);
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .carbon-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .carbon-footer-links a {
          color: var(--cds-link-primary, #78a9ff);
          text-decoration: none;
          font-size: 0.875rem;
        }

        .carbon-footer-links a:hover {
          color: var(--cds-link-primary-hover, #a6c8ff);
          text-decoration: underline;
        }

        .carbon-footer-legal {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--cds-border-subtle-01, #393939);
        }

        .carbon-footer-legal p {
          color: var(--cds-text-helper, #6f6f6f);
          font-size: 0.75rem;
        }

        /* Responsive */
        @media (max-width: 672px) {
          .carbon-hero {
            padding: 2rem 0 3rem;
          }

          .carbon-hero__headline {
            font-size: 2.5rem;
          }

          .carbon-step {
            flex-direction: column;
          }

          .carbon-step-number {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}
