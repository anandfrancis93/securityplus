'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import Header from './Header';

export default function QuizOptionsPage() {
  const { user, loading, liquidGlass } = useApp();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const options = [
    {
      id: 'start-new-quiz',
      name: 'Start New Quiz',
      description: 'Take 10 AI-generated synthesis questions',
      onClick: () => router.push('/cybersecurity/quiz/start'),
      gradient: 'from-violet-500/20 to-purple-500/20',
      glowColor: 'shadow-violet-500/50',
      icon: (
        <svg className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-violet-400 ${liquidGlass ? 'transition-all duration-500' : ''} ${liquidGlass && hoveredCard === 'start-new-quiz' && 'scale-110 drop-shadow-[0_0_15px_currentColor]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'View your scores, IRT analysis, and history',
      onClick: () => router.push('/cybersecurity/performance'),
      gradient: 'from-cyan-500/20 to-blue-500/20',
      glowColor: 'shadow-cyan-500/50',
      icon: (
        <svg className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-cyan-400 ${liquidGlass ? 'transition-all duration-500' : ''} ${liquidGlass && hoveredCard === 'performance' && 'scale-110 drop-shadow-[0_0_15px_currentColor]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`min-h-screen text-white relative overflow-hidden flex flex-col ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
      {/* Animated Background Gradients (Liquid Glass only) */}
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl flex-1 flex flex-col">
        {/* Header */}
        <header className="mb-4 sm:mb-6 md:mb-8">
          <Header showBackButton backButtonPath="/cybersecurity" backButtonLabel="Back to Cybersecurity" className="mb-4 sm:mb-6 md:mb-8" />

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            {liquidGlass ? (
              <div className="relative">
                {/* Glow effect behind title */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-emerald-500/20 blur-3xl" />

                <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl">
                  {/* Light reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />

                  <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-white via-zinc-100 to-white bg-clip-text text-transparent tracking-tight">
                    Quiz
                  </h1>
                  <p className="relative text-zinc-400 text-sm sm:text-base tracking-tight">
                    Choose an option
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 text-white font-mono tracking-tight">
                  Quiz
                </h1>
                <p className="text-zinc-500 text-sm sm:text-base font-mono tracking-tight">
                  Choose an option
                </p>
              </>
            )}
          </div>
        </header>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 pb-4 sm:pb-6 md:pb-8 flex-1 content-start">
          {options.map((option) => (
            <button
              key={option.id}
              id={option.id}
              onClick={option.onClick}
              onMouseEnter={() => setHoveredCard(option.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative group ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-zinc-950 rounded-md'} p-10 sm:p-12 md:p-16 border transform
                       ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-150'}
                       ${hoveredCard === option.id
                         ? liquidGlass
                           ? `border-white/20 bg-white/10 scale-105 shadow-2xl ${option.glowColor}`
                           : 'border-zinc-700 bg-zinc-900/50'
                         : liquidGlass
                           ? 'border-white/10 hover:border-white/20'
                           : 'border-zinc-800 hover:border-zinc-700'
                       }
                       ${liquidGlass ? 'focus:outline-none focus:ring-2 focus:ring-white/30' : 'focus:outline-none focus:ring-1 focus:ring-zinc-700'}`}
            >
              {/* Gradient overlay on hover (Liquid Glass only) */}
              {liquidGlass && hoveredCard === option.id && (
                <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              )}

              {/* Light reflection (Liquid Glass only) */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
              )}

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className="flex justify-center items-center mb-6 sm:mb-8 md:mb-10">
                  {option.icon}
                </div>

                {/* Option Name */}
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white tracking-tight text-center ${liquidGlass ? '' : 'font-mono'}`}>
                  {option.name}
                </h2>

                {/* Description */}
                <p className={`text-sm sm:text-base md:text-lg text-center ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
                  {option.description}
                </p>
              </div>

              {/* Active Indicator Arrow */}
              {hoveredCard === option.id && (
                <div className={`absolute bottom-4 right-4 ${liquidGlass ? 'text-white/80 animate-pulse' : 'text-zinc-600'}`}>
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
