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
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center">
        {/* Logo - Left Side */}
        <button
          onClick={() => {
            if (onHomeClick) {
              onHomeClick();
            } else {
              router.push('/');
            }
          }}
          className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-lg transition-all duration-200 focus:outline-none"
          title="Home"
        >
          {/* Logo Icon */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-500/25">
            S+
          </div>

          {/* Logo Text */}
          <div className="hidden sm:block">
            <div className="text-lg font-bold tracking-tight leading-tight">
              SecurityPlus AI
            </div>
            <div className="text-xs leading-tight text-zinc-400">
              Master Your Skills
            </div>
          </div>
        </button>

        {/* Menu Button - Right Side */}
        <div className="relative" ref={menuRef}>
          <button
            id="menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 focus:outline-none"
            title="Menu"
            aria-label="Open menu"
          >
            <svg
              className="w-5 h-5 text-white"
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
            <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-w-[220px] z-50 shadow-xl">
              {/* User Name Section */}
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-violet-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-white font-medium">{user?.displayName || 'User'}</span>
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
                  className={`w-full px-4 py-3 text-sm text-left transition-all duration-200 flex items-center gap-3 ${
                    hasData
                      ? 'text-zinc-200 hover:bg-white/5 cursor-pointer'
                      : 'text-zinc-600 cursor-not-allowed opacity-50'
                  }`}
                  title={hasData ? 'Download backup of your performance data' : 'No data to export'}
                >
                  <svg
                    className={`w-4 h-4 ${hasData ? 'text-blue-400' : 'text-zinc-600'}`}
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
                <label className="w-full px-4 py-3 text-sm text-left text-zinc-200 hover:bg-white/5 transition-all duration-200 flex items-center gap-3 cursor-pointer">
                  <svg
                    className="w-4 h-4 text-green-400"
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
                    className="hidden"
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
                  className="w-full px-4 py-3 text-sm text-left text-zinc-200 hover:bg-white/5 transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4 text-purple-400"
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
                className="w-full px-4 py-3 text-sm text-left text-zinc-200 hover:bg-white/5 transition-all duration-200 flex items-center gap-3 border-t border-zinc-800"
              >
                <svg
                  className="w-4 h-4 text-zinc-400"
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
    </div>
  );
}
