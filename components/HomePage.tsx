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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <div className="border-b border-zinc-800/50 backdrop-blur-sm">
        <div className="px-6 py-4 md:px-8 lg:px-12">
          <Header />
        </div>
      </div>

      <div className="px-6 py-12 md:px-8 lg:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-16 md:mb-20">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium mb-8">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-zinc-400">Welcome back, {user?.displayName?.split(' ')[0] || 'Learner'}</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Learn without
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                limits.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Your adaptive learning companion powered by AI.
            </p>
          </div>
        </section>

        {/* Featured Subject - Cybersecurity */}
        <section className="mb-16">
          <div className="max-w-5xl mx-auto">
            <button
              id="cybersecurity"
              onClick={() => router.push('/cybersecurity')}
              onMouseEnter={() => setHoveredCard('cybersecurity')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group w-full relative p-10 md:p-12 bg-zinc-900/50 border border-zinc-800/50 hover:border-violet-500/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 text-left"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Icon */}
                <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <svg className="w-12 h-12 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                    <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">Cybersecurity</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                    Master security concepts and best practices with AI-powered quizzes, adaptive flashcards, and comprehensive learning tools.
                  </p>
                  <div className="flex items-center gap-2 text-violet-400 font-medium justify-center md:justify-start">
                    <span>Start Learning</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'cybersecurity' ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Coming Soon Subjects */}
        <section>
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-3">
                More subjects coming soon
              </h3>
              <p className="text-lg text-zinc-400">
                Expanding your learning possibilities
              </p>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Networking */}
              <div className="relative p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl opacity-60">
                <div className="space-y-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                      <path strokeLinecap="round" d="M2 12h20" />
                      <ellipse cx="12" cy="12" rx="4" ry="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h4 className="text-lg md:text-xl font-bold">Networking</h4>
                  <p className="text-sm text-zinc-500">
                    Network protocols
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* Maths */}
              <div className="relative p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl opacity-60">
                <div className="space-y-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h3M8.5 7.5v3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3" />
                    </svg>
                  </div>
                  <h4 className="text-lg md:text-xl font-bold">Maths</h4>
                  <p className="text-sm text-zinc-500">
                    Problem solving
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* Physics */}
              <div className="relative p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl opacity-60">
                <div className="space-y-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.9}>
                      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(60 12 12)" />
                      <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(-60 12 12)" />
                    </svg>
                  </div>
                  <h4 className="text-lg md:text-xl font-bold">Physics</h4>
                  <p className="text-sm text-zinc-500">
                    Physical laws
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* English */}
              <div className="relative p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl opacity-60">
                <div className="space-y-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg md:text-xl font-bold">English</h4>
                  <p className="text-sm text-zinc-500">
                    Language arts
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400">
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
