'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';

interface HeaderProps {
  showBackButton?: boolean;
  backButtonPath?: string;
  backButtonLabel?: string;
  className?: string;
}

export default function Header({
  showBackButton = false,
  backButtonPath = '/',
  backButtonLabel = 'Back',
  className = ''
}: HeaderProps) {
  const router = useRouter();
  const { user, handleSignOut, liquidGlass, toggleLiquidGlass } = useApp();
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
    <div className={`flex justify-between items-center ${className}`}>
      {/* Back Button (Optional) */}
      {showBackButton && (
        <button
          onClick={() => router.push(backButtonPath)}
          className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 shadow-lg hover:shadow-white/10 flex items-center gap-2"
          title={backButtonLabel}
        >
          <svg
            className="w-5 h-5 text-zinc-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm text-zinc-300">{backButtonLabel}</span>
        </button>
      )}

      {/* Spacer */}
      {!showBackButton && <div />}

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
            className="w-5 h-5 text-zinc-300"
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

            {/* Liquid Glass Toggle */}
            <button
              id="toggle-liquid-glass"
              onClick={() => {
                toggleLiquidGlass();
              }}
              className="w-full px-4 py-3 text-sm text-left text-zinc-200 hover:bg-white/10 transition-all duration-300 flex items-center justify-between gap-3 border-b border-white/10"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                <span>Liquid Glass</span>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all duration-300 ${liquidGlass ? 'bg-cyan-500/50' : 'bg-zinc-700'} relative`}>
                <div className={`absolute top-1 ${liquidGlass ? 'left-5' : 'left-1'} w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-300`} />
              </div>
            </button>

            {/* Sign Out Button */}
            <button
              id="sign-out"
              onClick={async () => {
                if (confirm('Are you sure you want to sign out?')) {
                  await handleSignOut();
                  setMenuOpen(false);
                }
              }}
              className="w-full px-4 py-3 text-sm text-left text-zinc-200 hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
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
  );
}
