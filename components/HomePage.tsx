'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';
import Header from './Header';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useApp();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-zinc-950 to-cyan-950 text-white relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        {/* Hero Section */}
        <section className="text-center mb-16 md:mb-20 pt-12 md:pt-16">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Welcome Badge */}
            <div className="inline-block mb-6 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-sm font-medium backdrop-blur-xl">
              👋 Welcome back, {user?.displayName?.split(' ')[0] || 'Learner'}
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.1]">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent mb-2">
                Learn without
              </span>
              <span className="block bg-gradient-to-br from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                limits.
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed text-zinc-400">
              Your adaptive learning companion powered by AI.
            </p>
          </div>
        </section>

        {/* Featured Subject - Cybersecurity */}
        <section className="mb-20">
          <div className="max-w-6xl mx-auto">
            <button
              id="cybersecurity"
              onClick={() => router.push('/cybersecurity')}
              onMouseEnter={() => setHoveredCard('cybersecurity')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative w-full bg-white/5 backdrop-blur-2xl rounded-[40px] p-12 md:p-20 border border-white/10 hover:border-violet-500/50 transition-all duration-500 hover:scale-[1.02] overflow-hidden hover:shadow-2xl hover:shadow-violet-500/20"
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Light Reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />

              <div className="relative flex flex-col md:flex-row items-center gap-12">
                {/* Icon */}
                <div className="flex-shrink-0 transition-all duration-500 group-hover:scale-110">
                  <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 group-hover:shadow-2xl group-hover:shadow-violet-500/50 transition-all duration-500">
                    <svg className="w-20 h-20 md:w-24 md:h-24 text-violet-400 group-hover:drop-shadow-[0_0_20px_currentColor] transition-all duration-500" viewBox="0 -1 24 26" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                      <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left space-y-6">
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    Cybersecurity
                  </h2>
                  <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl">
                    Master security concepts and best practices with AI-powered quizzes, adaptive flashcards, and comprehensive learning tools.
                  </p>
                  <div className="flex items-center gap-3 text-violet-400 font-semibold text-lg pt-2 justify-center md:justify-start group-hover:text-violet-300 transition-colors duration-500">
                    <span>Start Learning</span>
                    <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Coming Soon Subjects */}
        <section className="mb-20">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                More subjects coming soon
              </h3>
              <p className="text-lg md:text-xl text-zinc-500">
                Expanding your learning possibilities
              </p>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Networking */}
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 opacity-60 hover:opacity-80 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                <div className="relative space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-2xl">
                    <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                      <path strokeLinecap="round" d="M2 12h20" />
                      <ellipse cx="12" cy="12" rx="4" ry="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Networking</h4>
                  <p className="text-sm md:text-base text-zinc-500">
                    Network protocols and infrastructure
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* Maths */}
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 opacity-60 hover:opacity-80 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                <div className="relative space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-2xl">
                    <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h3M8.5 7.5v3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Maths</h4>
                  <p className="text-sm md:text-base text-zinc-500">
                    Mathematical problem solving
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* Physics */}
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 opacity-60 hover:opacity-80 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                <div className="relative space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-2xl">
                    <svg className="w-10 h-10 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.9}>
                      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(60 12 12)" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(-60 12 12)" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Physics</h4>
                  <p className="text-sm md:text-base text-zinc-500">
                    Physical laws and principles
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* English */}
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 opacity-60 hover:opacity-80 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                <div className="relative space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-2xl">
                    <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">English</h4>
                  <p className="text-sm md:text-base text-zinc-500">
                    Language arts and literature
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20">
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
