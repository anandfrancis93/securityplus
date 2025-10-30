'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';

interface HeaderProps {
  showBackButton?: boolean;
  backButtonPath?: string;
  backButtonLabel?: string;
  className?: string;
  onHomeClick?: () => void; // Custom handler for home button (e.g., to show warning on quiz page)
  onSignOutClick?: () => void; // Custom handler for sign out (e.g., to show save/end modal on quiz page)
  onExportData?: () => void; // Handler for exporting performance data
  onImportData?: (event: React.ChangeEvent<HTMLInputElement>) => void; // Handler for importing performance data
  hasData?: boolean; // Whether user has data to export
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
  hasData = false
}: HeaderProps) {
  const router = useRouter();
  const { user, handleSignOut, liquidGlass } = useApp();
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
      <div className="flex justify-between items-center px-6 sm:px-8 lg:px-12">
        {/* Logo - Top Left */}
        <button
          onClick={() => {
            if (onHomeClick) {
              onHomeClick(); // Use custom handler if provided (e.g., show warning on quiz page)
            } else {
              router.push('/'); // Default behavior
            }
          }}
          className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300 focus:outline-none ${
            liquidGlass
              ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:scale-[1.02] shadow-lg hover:shadow-white/10'
              : 'hover:opacity-80'
          }`}
          title="Home"
        >
          {/* Learning Icon - Graduation Cap */}
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
            <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
            <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
          </svg>

          {/* Logo Text */}
          <div className="hidden sm:block">
            <div className="text-lg md:text-xl font-bold tracking-tight leading-tight text-white">
              LearnQuest
            </div>
            <div className="text-xs leading-tight text-zinc-400">
              Master Your Skills
            </div>
          </div>
        </button>

        {/* Menu Button - Liquid Glass */}
        <div className="relative" ref={menuRef}>
        <button
          id="menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 shadow-lg hover:shadow-white/10"
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

        {/* Dropdown Menu - Liquid Glass */}
        {menuOpen && user && !user?.isAnonymous && (
          <div className="absolute right-0 top-full mt-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden min-w-[220px] z-50 shadow-2xl shadow-black/50">
            {/* User Name Section */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center backdrop-blur-xl">
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
                className={`w-full px-4 py-3 text-sm text-left transition-all duration-300 flex items-center gap-3 ${
                  hasData
                    ? 'text-zinc-200 hover:bg-white/10 cursor-pointer'
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
              <label className="w-full px-4 py-3 text-sm text-left text-zinc-200 hover:bg-white/10 transition-all duration-300 flex items-center gap-3 cursor-pointer">
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

            {/* Sign Out Button */}
            <button
              id="sign-out"
              onClick={async () => {
                if (onSignOutClick) {
                  onSignOutClick(); // Use custom handler if provided (e.g., show save/end modal on quiz page)
                  setMenuOpen(false);
                } else {
                  if (confirm('Are you sure you want to sign out?')) {
                    await handleSignOut();
                    setMenuOpen(false);
                  }
                }
              }}
              className="w-full px-4 py-3 text-sm text-left text-zinc-200 hover:bg-white/10 transition-all duration-300 flex items-center gap-3 border-t border-white/10"
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
