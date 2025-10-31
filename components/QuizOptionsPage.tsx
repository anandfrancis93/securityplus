'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import Header from './Header';

export default function QuizOptions() {
  const { user, loading } = useApp();
  const router = useRouter();
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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium mb-8">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-zinc-400">Quiz Mode</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Test your
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">
                knowledge
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Choose how you want to challenge yourself.
            </p>
          </div>
        </section>

        {/* Quiz Options */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Start New Quiz */}
            <button
              id="start-new-quiz"
              onClick={() => router.push('/cybersecurity/quiz/start')}
              onMouseEnter={() => setHoveredCard('start-new-quiz')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative p-10 md:p-12 bg-zinc-900/50 border border-zinc-800/50 hover:border-violet-500/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 text-left"
            >
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Start New Quiz</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                    Take a fresh quiz with 10 AI-generated questions. Perfect for building knowledge and tracking your progress.
                  </p>
                  <div className="flex items-center gap-2 text-violet-400 font-medium">
                    <span>Configure Quiz</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'start-new-quiz' ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Quiz History */}
            <button
              id="quiz-history"
              onClick={() => router.push('/cybersecurity/quiz/history')}
              onMouseEnter={() => setHoveredCard('quiz-history')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative p-10 md:p-12 bg-zinc-900/50 border border-zinc-800/50 hover:border-cyan-500/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 text-left"
            >
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Quiz History</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                    Review your past quizzes, revisit questions, and analyze your performance over time.
                  </p>
                  <div className="flex items-center gap-2 text-cyan-400 font-medium">
                    <span>View History</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'quiz-history' ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Performance Section */}
        <section>
          <div className="max-w-5xl mx-auto">
            <button
              id="performance"
              onClick={() => router.push('/cybersecurity/performance')}
              onMouseEnter={() => setHoveredCard('performance')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group w-full relative p-10 md:p-12 bg-zinc-900/50 border border-zinc-800/50 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 text-left"
            >
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Performance Analytics</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                    View detailed analytics, ability estimates, confidence intervals, and performance graphs across topics and domains.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <span>View Analytics</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'performance' ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
