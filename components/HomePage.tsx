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

  // SVG Icon Components - Ultra-minimal Geist style
  const getSubjectIcon = (subjectId: string) => {
    const baseClasses = "w-16 h-16 md:w-20 md:h-20 transition-opacity duration-200";

    switch (subjectId) {
      case 'cybersecurity':
        return (
          <svg className={`${baseClasses} text-violet-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'networking':
        return (
          <svg className={`${baseClasses} text-cyan-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <path strokeLinecap="round" d="M12 8v8M12 16l-5 1M12 16l5 1" />
          </svg>
        );
      case 'maths':
        return (
          <svg className={`${baseClasses} text-emerald-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'physics':
        return (
          <svg className={`${baseClasses} text-rose-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        );
      case 'english':
        return (
          <svg className={`${baseClasses} text-amber-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path strokeLinecap="round" d="M9 9h6M9 12h6M9 15h4" />
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
      clickable: true,
    },
    {
      id: 'networking',
      name: 'Networking',
      description: 'Network protocols and infrastructure',
      path: '/networking',
      disabled: false,
      clickable: false,
    },
    {
      id: 'maths',
      name: 'Maths',
      description: 'Mathematical concepts and problem solving',
      path: '/maths',
      disabled: false,
      clickable: false,
    },
    {
      id: 'physics',
      name: 'Physics',
      description: 'Physical laws and scientific principles',
      path: '/physics',
      disabled: false,
      clickable: false,
    },
    {
      id: 'english',
      name: 'English',
      description: 'Language arts and literature',
      path: '/english',
      disabled: false,
      clickable: false,
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
              onClick={() => subject.clickable && router.push(subject.path)}
              disabled={subject.disabled}
              onMouseEnter={() => subject.clickable && setHoveredCard(subject.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative bg-zinc-950 backdrop-blur-sm rounded-md p-8 border transition-all duration-150
                       ${subject.disabled
                         ? 'border-zinc-900 opacity-40 cursor-not-allowed'
                         : subject.clickable
                           ? hoveredCard === subject.id
                             ? 'border-zinc-700 bg-zinc-900/50'
                             : 'border-zinc-800 hover:border-zinc-700'
                           : 'border-zinc-800 cursor-default'
                       }
                       focus:outline-none focus:ring-1 focus:ring-zinc-700`}
            >
              {/* Icon */}
              <div className={`flex justify-center items-center mb-6 ${subject.disabled ? 'opacity-30' : ''}`}>
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
              {subject.clickable && hoveredCard === subject.id && (
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
