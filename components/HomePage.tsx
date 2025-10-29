'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';
import Header from './Header';

export default function Home() {
  const router = useRouter();
  const { user, loading, liquidGlass } = useApp();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {/* Animated Background Gradients */}
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        {/* Hero Section - Apple Style */}
        <section className="text-center mb-8 md:mb-12">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Main Headline */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95]">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Learn without
              </span>
              <span className="block bg-gradient-to-br from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                limits.
              </span>
            </h1>

            {/* Tagline */}
            <p className={`text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Your adaptive learning companion powered by AI.
            </p>
          </div>
        </section>

        {/* Featured Subject - Cybersecurity */}
        <section className="mb-12">
          <div className="max-w-6xl mx-auto">
            <button
              id="cybersecurity"
              onClick={() => router.push('/cybersecurity')}
              onMouseEnter={() => setHoveredCard('cybersecurity')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative w-full ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'cybersecurity'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-violet-500/30'
                    : 'border-violet-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'cybersecurity' && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              <div className="relative flex flex-col md:flex-row items-center gap-12">
                {/* Icon */}
                <div className={`flex-shrink-0 transition-all duration-700 ${hoveredCard === 'cybersecurity' ? 'scale-110' : ''}`}>
                  <div className={`w-32 h-32 md:w-40 md:h-40 flex items-center justify-center ${
                    liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
                  } ${hoveredCard === 'cybersecurity' && liquidGlass ? 'shadow-2xl shadow-violet-500/50' : ''} transition-all duration-700`}>
                    <svg className={`w-20 h-20 md:w-24 md:h-24 text-violet-400 ${hoveredCard === 'cybersecurity' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} viewBox="0 -1 24 26" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                      <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                    Cybersecurity
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed max-w-2xl`}>
                    Master security concepts and best practices with AI-powered quizzes, adaptive flashcards, and comprehensive learning tools.
                  </p>
                  <div className="flex items-center gap-3 text-violet-400 font-medium pt-2 justify-center md:justify-start">
                    <span>Start Learning</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'cybersecurity' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Coming Soon Subjects */}
        <section className="mb-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                More subjects coming soon
              </h3>
              <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                Expanding your learning possibilities
              </p>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Networking */}
              <div className={`relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-zinc-900 rounded-2xl'
              } p-8 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} opacity-60`}>
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                )}
                <div className="relative space-y-4">
                  <div className={`w-16 h-16 flex items-center justify-center ${
                    liquidGlass ? 'bg-white/5 rounded-2xl' : 'bg-zinc-800 rounded-xl'
                  }`}>
                    <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                      <path strokeLinecap="round" d="M2 12h20" />
                      <ellipse cx="12" cy="12" rx="4" ry="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Networking</h4>
                  <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Network protocols and infrastructure
                  </p>
                  <div className={`inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20' : 'bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* Maths */}
              <div className={`relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-zinc-900 rounded-2xl'
              } p-8 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} opacity-60`}>
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                )}
                <div className="relative space-y-4">
                  <div className={`w-16 h-16 flex items-center justify-center ${
                    liquidGlass ? 'bg-white/5 rounded-2xl' : 'bg-zinc-800 rounded-xl'
                  }`}>
                    <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h3M8.5 7.5v3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Maths</h4>
                  <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Mathematical problem solving
                  </p>
                  <div className={`inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20' : 'bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* Physics */}
              <div className={`relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-zinc-900 rounded-2xl'
              } p-8 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} opacity-60`}>
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                )}
                <div className="relative space-y-4">
                  <div className={`w-16 h-16 flex items-center justify-center ${
                    liquidGlass ? 'bg-white/5 rounded-2xl' : 'bg-zinc-800 rounded-xl'
                  }`}>
                    <svg className="w-10 h-10 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.9}>
                      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(60 12 12)" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(-60 12 12)" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Physics</h4>
                  <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Physical laws and principles
                  </p>
                  <div className={`inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20' : 'bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* English */}
              <div className={`relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-zinc-900 rounded-2xl'
              } p-8 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} opacity-60`}>
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                )}
                <div className="relative space-y-4">
                  <div className={`w-16 h-16 flex items-center justify-center ${
                    liquidGlass ? 'bg-white/5 rounded-2xl' : 'bg-zinc-800 rounded-xl'
                  }`}>
                    <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">English</h4>
                  <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Language arts and literature
                  </p>
                  <div className={`inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20' : 'bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
