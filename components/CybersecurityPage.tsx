'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';

export default function CybersecurityPage() {
  const { user, loading, handleSignOut, userId } = useApp();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<'quiz' | 'flashcards' | null>(null);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
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

  useEffect(() => {
    const loadDueCount = async () => {
      if (!userId) return;

      try {
        const [allCards, reviews] = await Promise.all([
          getUserFlashcards(userId),
          getUserReviews(userId),
        ]);

        const due = getDueFlashcards(
          reviews,
          allCards.map((c) => c.id)
        );

        setDueFlashcardsCount(due.length);
      } catch (error) {
        console.error('Error loading due flashcards count:', error);
      }
    };

    loadDueCount();
  }, [userId]);


  if (selectedCard === 'flashcards') {
    router.push('/cybersecurity/flashcards');
    return null;
  }

  const cards = [
    {
      id: 'quiz',
      name: 'Quiz',
      description: 'Test your knowledge with AI-generated questions',
      onClick: () => router.push('/cybersecurity/quiz'),
      disabled: false,
      clickable: true,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 text-violet-400 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'flashcards',
      name: 'Flashcards',
      description: 'Learn with spaced repetition',
      onClick: () => setSelectedCard('flashcards'),
      disabled: false,
      clickable: true,
      badge: dueFlashcardsCount > 0 ? `${dueFlashcardsCount} due` : null,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 text-cyan-400 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'pbq',
      name: 'Performance-Based Questions',
      description: 'Hands-on scenario simulations',
      onClick: () => {},
      disabled: false,
      clickable: false,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 text-emerald-400 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'simulate-exam',
      name: 'Simulate Exam',
      description: 'Full-length 90-minute practice exam',
      onClick: () => {},
      disabled: false,
      clickable: false,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 text-amber-400 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-16 md:mb-20">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-12">
            <div className="relative">
              <button
                id="back-to-home"
                onClick={() => router.push('/home')}
                className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                title="Back to subjects"
                aria-label="Back to subjects"
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
                id="menu-cybersecurity"
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
                    id="sign-out-cybersecurity"
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
              Cybersecurity
            </h1>
            <p className="text-zinc-500 text-base md:text-lg font-mono tracking-tight">
              Choose your study method
            </p>
          </div>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pb-12">
          {cards.map((card) => (
            <button
              key={card.id}
              id={card.id}
              onClick={() => card.clickable && card.onClick()}
              disabled={card.disabled}
              onMouseEnter={() => card.clickable && setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative bg-zinc-950 backdrop-blur-sm rounded-md p-10 md:p-12 border transition-all duration-150
                       ${card.disabled
                         ? 'border-zinc-900 opacity-40 cursor-not-allowed'
                         : card.clickable
                           ? hoveredCard === card.id
                             ? 'border-zinc-700 bg-zinc-900/50'
                             : 'border-zinc-800 hover:border-zinc-700'
                           : 'border-zinc-800 cursor-default'
                       }
                       focus:outline-none focus:ring-1 focus:ring-zinc-700`}
            >
              {/* Icon */}
              <div className={`flex justify-center items-center mb-6 ${card.disabled ? 'opacity-30' : ''}`}>
                {card.icon}
              </div>

              {/* Card Name */}
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white font-mono tracking-tight">
                {card.name}
              </h2>

              {/* Description */}
              <p className="text-zinc-500 text-sm md:text-base font-mono">
                {card.description}
              </p>

              {/* Badge (for due flashcards) */}
              {!card.disabled && card.badge && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-2 bg-violet-900 text-violet-300 text-xs font-mono px-3 py-1.5 rounded-md border border-violet-800">
                    {card.badge}
                  </span>
                </div>
              )}

              {/* Coming Soon Badge */}
              {card.disabled && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-2 bg-zinc-900 text-zinc-500 text-xs font-mono px-3 py-1.5 rounded-md border border-zinc-800">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Active Indicator Arrow */}
              {card.clickable && hoveredCard === card.id && (
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
