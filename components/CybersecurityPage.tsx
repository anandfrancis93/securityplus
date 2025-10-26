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

  // Main homepage with four cards - redesigned to match HomePage style
  const cards = [
    {
      id: 'quiz',
      name: 'Quiz',
      description: 'Test your knowledge with AI-generated questions',
      iconColor: 'text-violet-400',
      gradient: 'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20',
      borderColor: 'border-violet-500/30 hover:border-violet-400',
      glowColor: 'shadow-violet-500/50',
      onClick: () => router.push('/cybersecurity/quiz'),
      disabled: false,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 transition-all duration-500 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'flashcards',
      name: 'Flashcards',
      description: 'Learn with spaced repetition',
      iconColor: 'text-cyan-400',
      gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
      borderColor: 'border-blue-500/30 hover:border-cyan-400',
      glowColor: 'shadow-cyan-500/50',
      onClick: () => setSelectedCard('flashcards'),
      disabled: false,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 transition-all duration-500 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'pbq',
      name: 'Performance-Based Questions',
      description: 'Hands-on scenarios',
      iconColor: 'text-emerald-400',
      gradient: 'from-emerald-500/20 via-green-500/20 to-lime-500/20',
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/50',
      onClick: () => {},
      disabled: true,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 transition-all duration-500 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'simulate-exam',
      name: 'Simulate Exam',
      description: '90-minute timed exam',
      iconColor: 'text-amber-400',
      gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/50',
      onClick: () => {},
      disabled: true,
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 transition-all duration-500 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Background Pattern Overlay - MD3 Surface Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header - MD3 Top App Bar Pattern */}
        <header className="mb-16 md:mb-20">
          {/* Navigation Buttons - MD3 Icon Button with State Layer */}
          <div className="flex justify-between items-center mb-12">
            <div className="relative">
              <button
                id="back-to-home"
                onClick={() => router.push('/')}
                className="relative group p-3 rounded-full transition-all duration-300 ease-out
                         hover:bg-violet-500/10 active:bg-violet-500/20
                         focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Back to subjects"
                aria-label="Back to subjects"
              >
                {/* State Layer */}
                <span className="absolute inset-0 rounded-full bg-violet-400/0 group-hover:bg-violet-400/10 transition-colors duration-300" />

                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-violet-300 transition-colors duration-300 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                id="menu-cybersecurity"
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative group p-3 rounded-full transition-all duration-300 ease-out
                         hover:bg-violet-500/10 active:bg-violet-500/20
                         focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
                aria-label="Open menu"
              >
                {/* State Layer */}
                <span className="absolute inset-0 rounded-full bg-violet-400/0 group-hover:bg-violet-400/10 transition-colors duration-300" />

                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-violet-300 transition-colors duration-300 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu - MD3 Menu Pattern with Elevation 2 */}
              {menuOpen && user && !user?.isAnonymous && (
                <div
                  className="absolute right-0 top-full mt-3 bg-slate-800/95 backdrop-blur-xl
                           border border-slate-700/50 rounded-3xl overflow-hidden
                           shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]
                           min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* User Name Section - MD3 List Item */}
                  <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <svg
                          className="w-5 h-5 text-violet-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out Button - MD3 List Item with State Layer */}
                  <button
                    id="sign-out-cybersecurity"
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-slate-200
                             hover:bg-slate-700/50 active:bg-slate-700/70
                             transition-colors duration-200 flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Section - MD3 Display Typography */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-br from-white via-violet-100 to-violet-200 bg-clip-text text-transparent
                         tracking-tight leading-none animate-in fade-in slide-in-from-bottom-4 duration-700">
              Cybersecurity
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Choose your study method
            </p>
          </div>
        </header>

        {/* Cards Grid - MD3 Card Pattern with Elevation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 pb-12">
          {cards.map((card, index) => (
            <button
              key={card.id}
              id={card.id}
              onClick={() => !card.disabled && card.onClick()}
              disabled={card.disabled}
              onMouseEnter={() => !card.disabled && setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-gradient-to-br ${card.gradient}
                       backdrop-blur-sm rounded-[28px] p-10 md:p-12 border-2 ${card.borderColor}
                       transition-all duration-500 ease-out
                       animate-in fade-in slide-in-from-bottom-8 duration-700
                       ${card.disabled
                         ? 'opacity-40 cursor-not-allowed'
                         : `cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                            hover:shadow-2xl hover:${card.glowColor}
                            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-950`
                       }`}
              style={{
                animationDelay: `${index * 100}ms`,
                background: card.disabled
                  ? undefined
                  : hoveredCard === card.id
                    ? `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.15) 100%)`
                    : undefined,
              }}
            >
              {/* MD3 State Layer Overlay */}
              {!card.disabled && (
                <div className="absolute inset-0 rounded-[28px] bg-white/0 group-hover:bg-white/5 group-active:bg-white/10 transition-colors duration-300 pointer-events-none" />
              )}

              {/* Card Background Glow Effect */}
              {!card.disabled && hoveredCard === card.id && (
                <div className={`absolute inset-0 rounded-[28px] blur-xl ${card.gradient} opacity-50 -z-10 transition-opacity duration-500`} />
              )}

              {/* Icon with MD3 Scale Animation */}
              <div className={`flex justify-center items-center mb-6 transition-transform duration-500 ease-out ${card.iconColor}
                           ${!card.disabled && hoveredCard === card.id ? 'scale-110 rotate-3' : 'scale-100 rotate-0'}`}>
                {card.icon}
              </div>

              {/* Card Name - MD3 Headline Typography */}
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight relative z-10">
                {card.name}
              </h2>

              {/* Description - MD3 Body Typography */}
              <p className="text-slate-400 text-base md:text-lg leading-relaxed relative z-10">
                {card.description}
              </p>

              {/* Coming Soon Badge - MD3 Chip/Badge Pattern */}
              {card.disabled && (
                <div className="absolute top-5 right-5">
                  <span className="inline-flex items-center gap-2 bg-slate-700/80 backdrop-blur-sm text-slate-300
                                 text-xs font-medium px-4 py-2 rounded-full border border-slate-600/50
                                 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Active Indicator - MD3 Pattern */}
              {!card.disabled && (
                <div className={`absolute bottom-5 right-5 transition-all duration-300
                              ${hoveredCard === card.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                  <svg
                    className={`w-6 h-6 ${card.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
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
