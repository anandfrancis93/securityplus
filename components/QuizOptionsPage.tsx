'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import Header from './Header';

export default function QuizOptions() {
  const { user, loading, liquidGlass } = useApp();
  const router = useRouter();
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
        <Header showBackButton backButtonPath="/cybersecurity" backButtonLabel="Back to Cybersecurity" />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        {/* Hero Section - Apple Style */}
        <section className="text-center mb-16 md:mb-20">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Main Headline */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95]">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Test your
              </span>
              <span className="block bg-gradient-to-br from-violet-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">
                knowledge
              </span>
            </h1>

            {/* Tagline */}
            <p className={`text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Choose how you want to challenge yourself.
            </p>
          </div>
        </section>

        {/* Quiz Options - Featured Cards */}
        <section className="mb-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Start New Quiz Card */}
            <button
              id="start-new-quiz"
              onClick={() => router.push('/cybersecurity/quiz/start')}
              onMouseEnter={() => setHoveredCard('start-new-quiz')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'start-new-quiz'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-violet-500/30'
                    : 'border-violet-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'start-new-quiz' && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              <div className="relative space-y-6">
                {/* Icon */}
                <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${
                  liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
                } ${hoveredCard === 'start-new-quiz' && liquidGlass ? 'shadow-2xl shadow-violet-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-violet-400 ${hoveredCard === 'start-new-quiz' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Start New Quiz
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    Take 10 AI-generated synthesis questions and get instant feedback on your performance.
                  </p>
                  <div className="flex items-center gap-3 text-violet-400 font-medium pt-2">
                    <span>Begin Quiz</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'start-new-quiz' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Performance Card */}
            <button
              id="performance"
              onClick={() => router.push('/cybersecurity/performance')}
              onMouseEnter={() => setHoveredCard('performance')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'performance'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-cyan-500/30'
                    : 'border-cyan-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'performance' && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              <div className="relative space-y-6">
                {/* Icon */}
                <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${
                  liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
                } ${hoveredCard === 'performance' && liquidGlass ? 'shadow-2xl shadow-cyan-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-cyan-400 ${hoveredCard === 'performance' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Performance
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    View your scores, IRT analysis, and complete quiz history to track your progress.
                  </p>
                  <div className="flex items-center gap-3 text-cyan-400 font-medium pt-2">
                    <span>View Stats</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'performance' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
