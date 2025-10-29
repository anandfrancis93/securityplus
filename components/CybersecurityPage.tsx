'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import Header from './Header';

export default function Cybersecurity() {
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
                Master
              </span>
              <span className="block bg-gradient-to-br from-violet-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">
                Cybersecurity
              </span>
            </h1>

            {/* Tagline */}
            <p className={`text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Choose your learning path and start building expertise.
            </p>
          </div>
        </section>

        {/* Primary Study Methods - Featured Cards */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quiz Card */}
            <button
              id="quiz"
              onClick={() => router.push('/cybersecurity/quiz')}
              onMouseEnter={() => setHoveredCard('quiz')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'quiz'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-violet-500/30'
                    : 'border-violet-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'quiz' && (
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
                } ${hoveredCard === 'quiz' && liquidGlass ? 'shadow-2xl shadow-violet-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-violet-400 ${hoveredCard === 'quiz' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Quiz
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    Test your knowledge with AI-generated synthesis questions and get instant feedback.
                  </p>
                  <div className="flex items-center gap-3 text-violet-400 font-medium pt-2">
                    <span>Start Quiz</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'quiz' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Flashcards Card */}
            <button
              id="flashcards"
              onClick={() => setSelectedCard('flashcards')}
              onMouseEnter={() => setHoveredCard('flashcards')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'flashcards'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-cyan-500/30'
                    : 'border-cyan-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'flashcards' && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              {/* Badge for due flashcards */}
              {dueFlashcardsCount > 0 && (
                <div className="absolute top-6 right-6">
                  <div className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-semibold ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-cyan-300' : 'bg-cyan-900 border border-cyan-800 rounded-full text-cyan-300'
                  }`}>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    {dueFlashcardsCount} due
                  </div>
                </div>
              )}

              <div className="relative space-y-6">
                {/* Icon */}
                <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${
                  liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
                } ${hoveredCard === 'flashcards' && liquidGlass ? 'shadow-2xl shadow-cyan-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-cyan-400 ${hoveredCard === 'flashcards' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Flashcards
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    Learn with spaced repetition and interleaving for long-term retention.
                  </p>
                  <div className="flex items-center gap-3 text-cyan-400 font-medium pt-2">
                    <span>Study Now</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'flashcards' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="mb-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8">
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                More features coming soon
              </h3>
              <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                Expanding your learning toolkit
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Performance-Based Questions */}
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
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Performance-Based Questions</h4>
                  <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Hands-on scenario simulations
                  </p>
                  <div className={`inline-flex items-center gap-2 text-xs md:text-sm font-medium px-3 py-1.5 ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-400 rounded-full border border-white/20' : 'bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </div>

              {/* Simulate Exam */}
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
                    <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold">Simulate Exam</h4>
                  <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Full-length 90-minute practice exam
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
