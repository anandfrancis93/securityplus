'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, handleSignOut } = useApp();
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

  // SVG Icon Components
  const getSubjectIcon = (subjectId: string) => {
    const baseClasses = "w-20 h-20 md:w-24 md:h-24 transition-opacity duration-200";

    switch (subjectId) {
      case 'cybersecurity':
        return (
          <svg className={baseClasses} viewBox="0 -1 24 26" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
            <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
          </svg>
        );
      case 'networking':
        return (
          <svg className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" strokeLinecap="round" />
            <path strokeLinecap="round" d="M2 12h20" />
            <ellipse cx="12" cy="12" rx="4" ry="10" strokeLinecap="round" />
          </svg>
        );
      case 'maths':
        return (
          <svg className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h3M8.5 7.5v3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 14.5l2 2M8.5 14.5l-2 2" />
            <circle cx="15.5" cy="13.5" r="0.2" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 15.5h3" />
            <circle cx="15.5" cy="17.5" r="0.2" fill="currentColor" />
          </svg>
        );
      case 'physics':
        return (
          <svg className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.9}>
            <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" />
            <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(-60 12 12)" />
            <circle cx="3" cy="12" r="1.3" fill="currentColor" />
            <circle cx="16.5" cy="19.8" r="1.3" fill="currentColor" />
            <circle cx="16.5" cy="4.2" r="1.3" fill="currentColor" />
          </svg>
        );
      case 'english':
        return (
          <svg className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-5 2 5M10.5 12.5h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6" strokeWidth={1} />
          </svg>
        );
      default:
        return null;
    }
  };

  const subjects = [
    {
      id: 'cybersecurity',
      name: 'Cybersecurity',
      description: 'Master security concepts and best practices',
      path: '/cybersecurity',
      disabled: false,
    },
    {
      id: 'networking',
      name: 'Networking',
      description: 'Coming soon',
      path: '/networking',
      disabled: true,
    },
    {
      id: 'maths',
      name: 'Maths',
      description: 'Coming soon',
      path: '/maths',
      disabled: true,
    },
    {
      id: 'physics',
      name: 'Physics',
      description: 'Coming soon',
      path: '/physics',
      disabled: true,
    },
    {
      id: 'english',
      name: 'English',
      description: 'Coming soon',
      path: '/english',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-16 md:mb-20">
          {/* Menu Button */}
          <div className="flex justify-end items-center mb-12 relative">
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
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
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
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 text-white font-mono tracking-tighter">
              Learning Hub
            </h1>
            <p className="text-zinc-500 text-base md:text-lg font-mono tracking-tight">
              Select a subject to begin your learning journey
            </p>
          </div>
        </header>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-12">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              id={subject.id}
              onClick={() => !subject.disabled && router.push(subject.path)}
              disabled={subject.disabled}
              onMouseEnter={() => !subject.disabled && setHoveredCard(subject.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative bg-zinc-950 backdrop-blur-sm rounded-md p-8 border transition-all duration-150
                       ${subject.disabled
                         ? 'border-zinc-900 opacity-40 cursor-not-allowed'
                         : hoveredCard === subject.id
                           ? 'border-zinc-700 bg-zinc-900/50'
                           : 'border-zinc-800 hover:border-zinc-700'
                       }
                       focus:outline-none focus:ring-1 focus:ring-zinc-700`}
            >
              {/* Icon */}
              <div className={`flex justify-center items-center mb-6 ${subject.disabled ? 'text-zinc-700' : 'text-zinc-400'}`}>
                {getSubjectIcon(subject.id)}
              </div>

              {/* Subject Name */}
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-white font-mono tracking-tight">
                {subject.name}
              </h2>

              {/* Description */}
              <p className="text-zinc-500 text-sm md:text-base font-mono min-h-[3rem]">
                {subject.description}
              </p>

              {/* Coming Soon Badge */}
              {subject.disabled && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-2 bg-zinc-900 text-zinc-500 text-xs font-mono px-3 py-1.5 rounded-md border border-zinc-800">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Active Indicator Arrow */}
              {!subject.disabled && hoveredCard === subject.id && (
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
