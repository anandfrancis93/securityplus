'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import Header from './Header';

export default function CybersecurityPage() {
  const { user, loading, userId, liquidGlass } = useApp();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<'quiz' | 'flashcards' | null>(null);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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
      gradient: 'from-violet-500/20 to-purple-500/20',
      glowColor: 'shadow-violet-500/50',
      icon: (
        <svg className={`w-20 h-20 md:w-24 md:h-24 text-violet-400 ${liquidGlass ? 'transition-all duration-500' : 'transition-opacity duration-200'} ${liquidGlass && hoveredCard === 'quiz' && 'scale-110 drop-shadow-[0_0_15px_currentColor]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
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
      gradient: 'from-cyan-500/20 to-blue-500/20',
      glowColor: 'shadow-cyan-500/50',
      icon: (
        <svg className={`w-20 h-20 md:w-24 md:h-24 text-cyan-400 ${liquidGlass ? 'transition-all duration-500' : 'transition-opacity duration-200'} ${liquidGlass && hoveredCard === 'flashcards' && 'scale-110 drop-shadow-[0_0_15px_currentColor]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
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
      gradient: 'from-emerald-500/20 to-teal-500/20',
      glowColor: 'shadow-emerald-500/50',
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
      gradient: 'from-amber-500/20 to-orange-500/20',
      glowColor: 'shadow-amber-500/50',
      icon: (
        <svg className="w-20 h-20 md:w-24 md:h-24 text-amber-400 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {/* Animated Background Gradients (Liquid Glass only) */}
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-16 md:mb-20">
          <Header showBackButton backButtonPath="/home" backButtonLabel="Back to Subjects" className="mb-12" />

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            {liquidGlass ? (
              <div className="relative">
                {/* Glow effect behind title */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-emerald-500/20 blur-3xl" />

                <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 shadow-2xl">
                  {/* Light reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />

                  <h1 className="relative text-6xl sm:text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-100 to-white bg-clip-text text-transparent tracking-tight">
                    Cybersecurity
                  </h1>
                  <p className="relative text-zinc-400 text-base md:text-lg tracking-wide">
                    Choose your study method
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 text-white font-mono tracking-tighter">
                  Cybersecurity
                </h1>
                <p className="text-zinc-500 text-base md:text-lg font-mono tracking-tight">
                  Choose your study method
                </p>
              </>
            )}
          </div>
        </header>

        {/* Cards Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pb-12 ${liquidGlass ? 'md:gap-8' : ''}`}>
          {cards.map((card) => (
            <button
              key={card.id}
              id={card.id}
              onClick={() => card.clickable && card.onClick()}
              disabled={card.disabled}
              onMouseEnter={() => card.clickable && setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative group ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-zinc-950 backdrop-blur-sm rounded-md'} p-10 md:p-12 border transform
                       ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-150'}
                       ${card.disabled
                         ? liquidGlass ? 'border-white/5 opacity-40 cursor-not-allowed' : 'border-zinc-900 opacity-40 cursor-not-allowed'
                         : card.clickable
                           ? hoveredCard === card.id
                             ? liquidGlass
                               ? `border-white/20 bg-white/10 scale-105 shadow-2xl ${card.glowColor}`
                               : 'border-zinc-700 bg-zinc-900/50'
                             : liquidGlass
                               ? 'border-white/10 hover:border-white/20'
                               : 'border-zinc-800 hover:border-zinc-700'
                           : liquidGlass
                             ? 'border-white/10 cursor-default'
                             : 'border-zinc-800 cursor-default'
                       }
                       ${liquidGlass ? 'focus:outline-none focus:ring-2 focus:ring-white/30' : 'focus:outline-none focus:ring-1 focus:ring-zinc-700'}`}
            >
              {/* Gradient overlay on hover (Liquid Glass only) */}
              {liquidGlass && hoveredCard === card.id && card.clickable && (
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              )}

              {/* Light reflection (Liquid Glass only) */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
              )}
              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`flex justify-center items-center mb-6 ${card.disabled ? 'opacity-30' : ''}`}>
                  {card.icon}
                </div>

                {/* Card Name */}
                <h2 className={`text-2xl md:text-3xl font-bold mb-4 text-white tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>
                  {card.name}
                </h2>

                {/* Description */}
                <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
                  {card.description}
                </p>
              </div>

              {/* Badge (for due flashcards) */}
              {!card.disabled && card.badge && (
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 ${liquidGlass ? 'bg-white/10 backdrop-blur-xl text-violet-300 border border-white/20 rounded-full' : 'bg-violet-900 text-violet-300 border border-violet-800 rounded-md font-mono'}`}>
                    {card.badge}
                  </span>
                </div>
              )}

              {/* Coming Soon Badge */}
              {card.disabled && (
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 ${liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-400 border border-white/20 rounded-full' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-md font-mono'}`}>
                    <span className={`${liquidGlass ? 'w-1.5 h-1.5' : 'w-1 h-1'} rounded-full ${liquidGlass ? 'bg-zinc-500 animate-pulse' : 'bg-zinc-600'}`} />
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Active Indicator Arrow */}
              {card.clickable && hoveredCard === card.id && (
                <div className={`absolute bottom-6 right-6 ${liquidGlass ? 'text-white/80 animate-pulse' : 'text-zinc-600'}`}>
                  <svg
                    className={`${liquidGlass ? 'w-6 h-6 drop-shadow-[0_0_8px_currentColor]' : 'w-5 h-5'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={liquidGlass ? 2 : 1.5}
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
