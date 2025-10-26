'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';

export default function QuizOptionsPage() {
  const { user, loading, handleSignOut } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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

  const options = [
    {
      id: 'start-new-quiz',
      name: 'Start New Quiz',
      description: 'Take 10 AI-generated synthesis questions',
      onClick: () => router.push('/cybersecurity/quiz/start'),
      icon: (
        <svg className="w-16 h-16 md:w-20 md:h-20 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'View your scores, IRT analysis, and history',
      onClick: () => router.push('/cybersecurity/performance'),
      icon: (
        <svg className="w-16 h-16 md:w-20 md:h-20 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black font-mono">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-8">
            <div className="relative">
              <button
                id="back-to-cybersecurity"
                onClick={() => router.push('/cybersecurity')}
                className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                title="Back to Cybersecurity"
                aria-label="Back to Cybersecurity"
              >
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                id="menu"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                title="Menu"
                aria-label="Open menu"
              >
                <svg
                  className="w-5 h-5 text-zinc-400"
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
                <div className="absolute right-0 top-full mt-2 bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-md overflow-hidden min-w-[200px] z-50">
                  {/* User Name Section */}
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm text-zinc-300 font-mono">{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    id="sign-out"
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-sm text-left text-zinc-300 hover:bg-zinc-900 transition-colors duration-150 flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-mono">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white font-mono tracking-tight">
              Quiz
            </h1>
            <p className="text-zinc-500 text-sm font-mono tracking-tight">
              Choose an option
            </p>
          </div>
        </header>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-8">
          {options.map((option) => (
            <button
              key={option.id}
              id={option.id}
              onClick={option.onClick}
              onMouseEnter={() => setHoveredCard(option.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative bg-zinc-950 rounded-md p-8 md:p-10 border transition-all duration-150
                       ${hoveredCard === option.id
                         ? 'border-zinc-700 bg-zinc-900/50'
                         : 'border-zinc-800 hover:border-zinc-700'
                       }
                       focus:outline-none focus:ring-1 focus:ring-zinc-700`}
            >
              {/* Icon */}
              <div className="flex justify-center items-center mb-6">
                {option.icon}
              </div>

              {/* Option Name */}
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white font-mono tracking-tight text-center">
                {option.name}
              </h2>

              {/* Description */}
              <p className="text-zinc-500 text-sm md:text-base font-mono text-center">
                {option.description}
              </p>

              {/* Active Indicator Arrow */}
              {hoveredCard === option.id && (
                <div className="absolute bottom-4 right-4 text-zinc-600">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
