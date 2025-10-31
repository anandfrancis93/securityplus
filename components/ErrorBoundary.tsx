'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, send to error tracking service)
    console.error('Error Boundary caught an error:', error, errorInfo);

    // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
    // if (process.env.NODE_ENV === 'production') {
    //   // Example: Sentry.captureException(error, { extra: errorInfo });
    // }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>

            <h1 className="error-boundary-title">Something went wrong</h1>

            <p className="error-boundary-description">
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary-stack">
                  <code>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </code>
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="error-boundary-button error-boundary-button-primary"
                type="button"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="error-boundary-button error-boundary-button-secondary"
                type="button"
              >
                Go to Homepage
              </button>
            </div>
          </div>

          <style jsx>{`
            .error-boundary-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: var(--space-6, 24px);
              background: var(--color-background, #000000);
              font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif);
            }

            .error-boundary-card {
              max-width: 600px;
              width: 100%;
              padding: var(--space-12, 48px);
              background: var(--color-surface-elevated, rgba(255, 255, 255, 0.03));
              border: 1px solid var(--color-border-primary, rgba(255, 255, 255, 0.1));
              border-radius: var(--radius-xl, 30px);
              text-align: center;
            }

            .error-boundary-icon {
              width: 64px;
              height: 64px;
              margin: 0 auto var(--space-6, 24px);
              color: var(--color-error, #ff3b30);
            }

            .error-boundary-icon svg {
              width: 100%;
              height: 100%;
            }

            .error-boundary-title {
              font-size: var(--font-size-2xl, 40px);
              font-weight: var(--font-weight-semibold, 600);
              color: var(--color-text-primary, #f5f5f7);
              margin: 0 0 var(--space-4, 16px);
              line-height: var(--line-height-snug, 1.1);
            }

            .error-boundary-description {
              font-size: var(--font-size-base, 17px);
              color: var(--color-text-secondary, #a1a1a6);
              margin: 0 0 var(--space-8, 32px);
              line-height: var(--line-height-relaxed, 1.47);
            }

            .error-boundary-details {
              text-align: left;
              margin: var(--space-6, 24px) 0;
              padding: var(--space-4, 16px);
              background: var(--color-surface, rgba(255, 255, 255, 0.02));
              border: 1px solid var(--color-border-secondary, rgba(255, 255, 255, 0.05));
              border-radius: var(--radius-md, 12px);
            }

            .error-boundary-details summary {
              cursor: pointer;
              font-size: var(--font-size-sm, 14px);
              color: var(--color-text-tertiary, #86868b);
              margin-bottom: var(--space-3, 12px);
              user-select: none;
            }

            .error-boundary-details summary:hover {
              color: var(--color-text-secondary, #a1a1a6);
            }

            .error-boundary-stack {
              margin: 0;
              padding: var(--space-3, 12px);
              background: var(--color-background, #000000);
              border-radius: var(--radius-sm, 6px);
              overflow-x: auto;
            }

            .error-boundary-stack code {
              font-family: var(--font-mono, 'Monaco', monospace);
              font-size: 12px;
              line-height: 1.5;
              color: var(--color-error, #ff3b30);
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-boundary-actions {
              display: flex;
              gap: var(--space-3, 12px);
              justify-content: center;
              flex-wrap: wrap;
            }

            .error-boundary-button {
              padding: 14px 28px;
              border-radius: var(--radius-full, 980px);
              font-size: var(--font-size-base, 17px);
              font-weight: var(--font-weight-regular, 400);
              cursor: pointer;
              border: none;
              transition: all var(--transition-base, 200ms) ease;
              font-family: inherit;
            }

            .error-boundary-button-primary {
              background: var(--color-primary, #0071e3);
              color: white;
            }

            .error-boundary-button-primary:hover {
              background: var(--color-primary-hover, #0077ed);
            }

            .error-boundary-button-primary:focus-visible {
              outline: 2px solid var(--color-border-focus, #0071e3);
              outline-offset: 2px;
            }

            .error-boundary-button-secondary {
              background: transparent;
              color: var(--color-primary-light, #2997ff);
              border: 1px solid var(--color-border-primary, rgba(255, 255, 255, 0.1));
            }

            .error-boundary-button-secondary:hover {
              background: rgba(41, 151, 255, 0.08);
            }

            .error-boundary-button-secondary:focus-visible {
              outline: 2px solid var(--color-border-focus, #0071e3);
              outline-offset: 2px;
            }

            @media (max-width: 640px) {
              .error-boundary-card {
                padding: var(--space-8, 32px);
              }

              .error-boundary-title {
                font-size: var(--font-size-xl, 24px);
              }

              .error-boundary-actions {
                flex-direction: column;
              }

              .error-boundary-button {
                width: 100%;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
