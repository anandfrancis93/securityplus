'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import Header from './Header';

export default function Cybersecurity() {
  const { user, loading, userId } = useApp();
  const router = useRouter();
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              </svg>
              <span className="text-zinc-400">Security+ SY0-701</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Master
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">
                Cybersecurity
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Choose your learning path and start building expertise.
            </p>
          </div>
        </section>

        {/* Primary Study Methods */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Quiz Card */}
            <button
              id="quiz"
              onClick={() => router.push('/cybersecurity/quiz')}
              onMouseEnter={() => setHoveredCard('quiz')}
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
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Quiz</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                    Test your knowledge with AI-generated questions and get instant feedback.
                  </p>
                  <div className="flex items-center gap-2 text-violet-400 font-medium">
                    <span>Start Quiz</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'quiz' ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Flashcards Card */}
            <button
              id="flashcards"
              onClick={() => router.push('/cybersecurity/flashcards')}
              onMouseEnter={() => setHoveredCard('flashcards')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative p-10 md:p-12 bg-zinc-900/50 border border-zinc-800/50 hover:border-cyan-500/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 text-left"
            >
              {/* Due badge */}
              {dueFlashcardsCount > 0 && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-sm font-semibold text-cyan-300">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    {dueFlashcardsCount} due
                  </div>
                </div>
              )}

              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Flashcards</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                    Learn with spaced repetition and interleaving for long-term retention.
                  </p>
                  <div className="flex items-center gap-2 text-cyan-400 font-medium">
                    <span>Study Now</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'flashcards' ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section>
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-3">
                More features coming soon
              </h3>
              <p className="text-lg text-zinc-400">
                Expanding your learning toolkit
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Performance-Based Questions */}
              <div className="relative p-8 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl opacity-60">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-semibold mb-2">Performance-Based Questions</h4>
                    <p className="text-zinc-500 mb-3">
                      Hands-on scenario simulations
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulate Exam */}
              <div className="relative p-8 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl opacity-60">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-semibold mb-2">Simulate Exam</h4>
                    <p className="text-zinc-500 mb-3">
                      Full-length 90-minute practice exam
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      Coming Soon
                    </div>
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
