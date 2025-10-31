'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';

interface HeaderProps {
  showBackButton?: boolean;
  backButtonPath?: string;
  backButtonLabel?: string;
  className?: string;
  onHomeClick?: () => void;
  onSignOutClick?: () => void;
  onExportData?: () => void;
  onImportData?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRecalculateProgress?: () => void;
  hasData?: boolean;
}

export default function Header({
  showBackButton = false,
  backButtonPath = '/',
  backButtonLabel = 'Back',
  className = '',
  onHomeClick,
  onSignOutClick,
  onExportData,
  onImportData,
  onRecalculateProgress,
  hasData = false
}: HeaderProps) {
  const router = useRouter();
  const { user, handleSignOut } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  return (
    <div className={`header-wrapper ${className}`}>
      <div className="header-content">
        {/* Logo - Left Side */}
        <button
          onClick={() => {
            if (onHomeClick) {
              onHomeClick();
            } else {
              router.push('/');
            }
          }}
          className="header-logo-btn"
          title="Home"
        >
          {/* Logo Icon */}
          <div className="header-logo-icon">
            S+
          </div>

          {/* Logo Text */}
          <div className="header-logo-text">
            <div className="header-logo-title">
              SecurityPlus AI
            </div>
            <div className="header-logo-subtitle">
              Master Your Skills
            </div>
          </div>
        </button>

        {/* Menu Button - Right Side */}
        <div className="header-menu-container" ref={menuRef}>
          <button
            id="menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="header-menu-btn"
            title="Menu"
            aria-label="Open menu"
          >
            <svg
              className="header-menu-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && user && !user?.isAnonymous && (
            <div className="header-dropdown">
              {/* User Name Section */}
              <div className="header-dropdown-user">
                <div className="header-dropdown-user-content">
                  <div className="header-dropdown-user-icon">
                    <svg
                      className="header-dropdown-user-icon-svg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="header-dropdown-user-name">{user?.displayName || 'User'}</span>
                </div>
              </div>

              {/* Export Data Button */}
              {onExportData && (
                <button
                  onClick={() => {
                    onExportData();
                    setMenuOpen(false);
                  }}
                  disabled={!hasData}
                  className={`header-dropdown-item ${!hasData ? 'header-dropdown-item-disabled' : ''}`}
                  title={hasData ? 'Download backup of your performance data' : 'No data to export'}
                >
                  <svg
                    className="header-dropdown-item-icon header-dropdown-item-icon-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Data</span>
                </button>
              )}

              {/* Import Data Button */}
              {onImportData && (
                <label className="header-dropdown-item header-dropdown-item-label">
                  <svg
                    className="header-dropdown-item-icon header-dropdown-item-icon-green"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Import Data</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      onImportData(e);
                      setMenuOpen(false);
                    }}
                    className="header-dropdown-file-input"
                  />
                </label>
              )}

              {/* Recalculate Progress Button */}
              {onRecalculateProgress && (
                <button
                  onClick={() => {
                    onRecalculateProgress();
                    setMenuOpen(false);
                  }}
                  disabled={!hasData}
                  className={`header-dropdown-item ${!hasData ? 'header-dropdown-item-disabled' : ''}`}
                >
                  <svg
                    className="header-dropdown-item-icon header-dropdown-item-icon-purple"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>Recalculate Progress</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                id="sign-out"
                onClick={async () => {
                  if (onSignOutClick) {
                    onSignOutClick();
                    setMenuOpen(false);
                  } else {
                    if (confirm('Are you sure you want to sign out?')) {
                      await handleSignOut();
                      setMenuOpen(false);
                    }
                  }
                }}
                className="header-dropdown-item header-dropdown-item-signout"
              >
                <svg
                  className="header-dropdown-item-icon header-dropdown-item-icon-gray"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* =====================================
           DARK NEUMORPHISM / SOFT UI DESIGN
           ===================================== */

        .header-wrapper {
          width: 100%;
          padding: 0 24px;
        }

        @media (min-width: 640px) {
          .header-wrapper {
            padding: 0 32px;
          }
        }

        @media (min-width: 1024px) {
          .header-wrapper {
            padding: 0 48px;
          }
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* === Logo Button === */
        .header-logo-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: #0f0f0f;
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          border-radius: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
          color: inherit;
        }

        .header-logo-btn:hover {
          box-shadow:
            3px 3px 6px #050505,
            -3px -3px 6px #191919;
          transform: translateY(-1px);
        }

        .header-logo-btn:focus {
          outline: none;
        }

        .header-logo-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          background: #0f0f0f;
          box-shadow:
            inset 4px 4px 8px #050505,
            inset -4px -4px 8px #191919;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          color: #8b5cf6;
        }

        .header-logo-text {
          display: none;
        }

        @media (min-width: 640px) {
          .header-logo-text {
            display: block;
          }
        }

        .header-logo-title {
          font-size: 1.125rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.2;
          color: #e5e5e5;
        }

        .header-logo-subtitle {
          font-size: 0.75rem;
          line-height: 1.2;
          color: #a8a8a8;
        }

        /* === Menu Container === */
        .header-menu-container {
          position: relative;
        }

        /* === Menu Button === */
        .header-menu-btn {
          padding: 0.75rem;
          background: #0f0f0f;
          box-shadow:
            6px 6px 12px #050505,
            -6px -6px 12px #191919;
          border-radius: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
        }

        .header-menu-btn:hover {
          box-shadow:
            3px 3px 6px #050505,
            -3px -3px 6px #191919;
        }

        .header-menu-btn:focus {
          outline: none;
        }

        .header-menu-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #e5e5e5;
        }

        /* === Dropdown Menu === */
        .header-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 0.5rem);
          background: #0f0f0f;
          box-shadow:
            12px 12px 24px #050505,
            -12px -12px 24px #191919;
          border-radius: 1.5rem;
          overflow: hidden;
          min-width: 220px;
          z-index: 50;
        }

        /* === User Section === */
        .header-dropdown-user {
          padding: 0.75rem 1rem;
          background: #0f0f0f;
          box-shadow:
            inset 3px 3px 6px #050505,
            inset -3px -3px 6px #191919;
        }

        .header-dropdown-user-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-dropdown-user-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: #0f0f0f;
          box-shadow:
            4px 4px 8px #050505,
            -4px -4px 8px #191919;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-dropdown-user-icon-svg {
          width: 1.25rem;
          height: 1.25rem;
          color: #8b5cf6;
        }

        .header-dropdown-user-name {
          font-size: 0.875rem;
          color: #e5e5e5;
          font-weight: 500;
        }

        /* === Dropdown Items === */
        .header-dropdown-item {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          text-align: left;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #e5e5e5;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .header-dropdown-item:hover {
          background: #0f0f0f;
          box-shadow:
            inset 3px 3px 6px #050505,
            inset -3px -3px 6px #191919;
        }

        .header-dropdown-item-label {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          text-align: left;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #e5e5e5;
          cursor: pointer;
        }

        .header-dropdown-item-label:hover {
          background: #0f0f0f;
          box-shadow:
            inset 3px 3px 6px #050505,
            inset -3px -3px 6px #191919;
        }

        .header-dropdown-item-disabled {
          color: #666666;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .header-dropdown-item-disabled:hover {
          background: transparent;
          box-shadow: none;
        }

        .header-dropdown-item-signout {
          border-top: 1px solid #1a1a1a;
        }

        .header-dropdown-item-icon {
          width: 1rem;
          height: 1rem;
        }

        .header-dropdown-item-icon-blue {
          color: #3b82f6;
        }

        .header-dropdown-item-icon-green {
          color: #10b981;
        }

        .header-dropdown-item-icon-purple {
          color: #8b5cf6;
        }

        .header-dropdown-item-icon-gray {
          color: #a8a8a8;
        }

        .header-dropdown-file-input {
          display: none;
        }
      `}</style>
    </div>
  );
}
