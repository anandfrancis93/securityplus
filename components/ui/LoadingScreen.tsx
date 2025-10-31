import React from 'react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

/**
 * Loading Screen Component
 * Displays a loading animation with graduation cap icon
 * Used across all pages for consistent loading states
 */
export function LoadingScreen({
  message = 'Loading...',
  submessage = 'Please wait',
}: LoadingScreenProps) {
  return (
    <div className="loading-screen-container">
      <div className="loading-screen-content">
        <div className="loading-screen-card">
          <div className="loading-screen-inner">
            {/* Animated icon */}
            <div className="loading-screen-icon-wrapper">
              {/* Outer ring with neumorphic effect */}
              <div className="loading-screen-outer-ring"></div>
              {/* Spinning gradient ring */}
              <div className="loading-screen-spinning-ring">
                <div className="loading-screen-ring-gradient"></div>
              </div>
              {/* Center icon - graduation cap */}
              <div className="loading-screen-icon">
                <svg
                  className="loading-screen-icon-svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                  <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                  <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                </svg>
              </div>
            </div>
            {/* Loading text */}
            <p className="loading-screen-message">
              {message}
            </p>
            <p className="loading-screen-submessage">
              {submessage}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* =====================================
           DARK NEUMORPHISM / SOFT UI DESIGN
           ===================================== */

        .loading-screen-container {
          min-height: 100vh;
          background: #0f0f0f;
          color: #e5e5e5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }

        .loading-screen-content {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        .loading-screen-card {
          background: #0f0f0f;
          box-shadow:
            12px 12px 24px #050505,
            -12px -12px 24px #191919;
          border-radius: 1.5rem;
          padding: 4rem;
        }

        @media (min-width: 768px) {
          .loading-screen-card {
            padding: 5rem;
          }
        }

        .loading-screen-inner {
          position: relative;
          text-align: center;
        }

        /* === Animated Icon === */
        .loading-screen-icon-wrapper {
          position: relative;
          margin: 0 auto 2rem;
          width: 8rem;
          height: 8rem;
        }

        @media (min-width: 768px) {
          .loading-screen-icon-wrapper {
            width: 10rem;
            height: 10rem;
          }
        }

        .loading-screen-outer-ring {
          position: absolute;
          inset: 0;
          border: 4px solid transparent;
          border-radius: 50%;
          background: #0f0f0f;
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
        }

        .loading-screen-spinning-ring {
          position: absolute;
          inset: 0;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .loading-screen-ring-gradient {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 4px solid transparent;
          border-top-color: #06b6d4;
          border-right-color: rgba(6, 182, 212, 0.5);
        }

        .loading-screen-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-screen-icon-svg {
          width: 4rem;
          height: 4rem;
          color: #06b6d4;
        }

        @media (min-width: 768px) {
          .loading-screen-icon-svg {
            width: 5rem;
            height: 5rem;
          }
        }

        /* === Loading Text === */
        .loading-screen-message {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #e5e5e5;
        }

        @media (min-width: 768px) {
          .loading-screen-message {
            font-size: 1.875rem;
          }
        }

        .loading-screen-submessage {
          font-size: 1rem;
          margin-top: 1rem;
          color: #a8a8a8;
        }

        @media (min-width: 768px) {
          .loading-screen-submessage {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
}
