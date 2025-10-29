'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import Header from './Header';

export default function FlashcardsPage() {
  const { user, loading, userId, liquidGlass } = useApp();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [flashcardsCount, setFlashcardsCount] = useState(0);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadData = async () => {
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

        setFlashcardsCount(allCards.length);
        setDueCardsCount(due.length);
      } catch (error) {
        console.error('Error loading flashcard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative">
          {/* Liquid glass card */}
          <div className={`${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl'} p-16 md:p-20 shadow-2xl`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
            )}
            <div className="relative text-center">
              {/* Animated icon */}
              <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-8">
                {/* Outer ring */}
                <div className={`absolute inset-0 ${liquidGlass ? 'border-4 border-white/20 rounded-full' : 'border-4 border-slate-700 rounded-full'}`}></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 animate-spin">
                  <div className={`w-full h-full rounded-full ${liquidGlass ? 'border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50' : 'border-4 border-transparent border-t-cyan-500 border-r-cyan-500/50'}`}></div>
                </div>
                {/* Center icon - graduation cap */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className={`w-16 h-16 md:w-20 md:h-20 ${liquidGlass ? 'text-cyan-400' : 'text-cyan-500'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p className={`text-2xl md:text-3xl font-bold tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>
                Loading flashcards...
              </p>
              <p className={`text-base md:text-lg mt-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                Please wait
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
                Master with
              </span>
              <span className="block bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                Flashcards
              </span>
            </h1>

            {/* Tagline */}
            <p className={`text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Learn with spaced repetition and active recall.
            </p>
          </div>
        </section>

        {/* Primary Actions - Featured Cards */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Study Card */}
            <button
              id="study"
              onClick={() => router.push('/cybersecurity/flashcards/study')}
              onMouseEnter={() => setHoveredCard('study')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'study'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-violet-500/30'
                    : 'border-violet-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'study' && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              {/* Badge for due cards */}
              {dueCardsCount > 0 && (
                <div className="absolute top-6 right-6">
                  <div className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-semibold ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-violet-300' : 'bg-violet-900 border border-violet-800 rounded-full text-violet-300'
                  }`}>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                    {dueCardsCount} due
                  </div>
                </div>
              )}

              <div className="relative space-y-6">
                {/* Icon */}
                <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${
                  liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
                } ${hoveredCard === 'study' && liquidGlass ? 'shadow-2xl shadow-violet-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-violet-400 ${hoveredCard === 'study' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Study
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    Review with spaced repetition for long-term retention.
                  </p>
                  <div className="flex items-center gap-3 text-violet-400 font-medium pt-2">
                    <span>Start Studying</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'study' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Create Card */}
            <button
              id="create"
              onClick={() => router.push('/cybersecurity/flashcards/create')}
              onMouseEnter={() => setHoveredCard('create')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'create'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-cyan-500/30'
                    : 'border-cyan-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'create' && (
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
                } ${hoveredCard === 'create' && liquidGlass ? 'shadow-2xl shadow-cyan-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-cyan-400 ${hoveredCard === 'create' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Create
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    Make new flashcards with AI assistance or manually.
                  </p>
                  <div className="flex items-center gap-3 text-cyan-400 font-medium pt-2">
                    <span>Create Flashcard</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'create' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Secondary Actions - Large Cards */}
        <section className="mb-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Search Card */}
            <button
              id="search"
              onClick={() => router.push('/cybersecurity/flashcards/search')}
              onMouseEnter={() => setHoveredCard('search')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'search'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-emerald-500/30'
                    : 'border-emerald-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'search' && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              {/* Badge for card count */}
              {flashcardsCount > 0 && (
                <div className="absolute top-6 right-6">
                  <div className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-semibold ${
                    liquidGlass ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-emerald-300' : 'bg-emerald-900 border border-emerald-800 rounded-full text-emerald-300'
                  }`}>
                    {flashcardsCount} cards
                  </div>
                </div>
              )}

              <div className="relative space-y-6">
                {/* Icon */}
                <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${
                  liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
                } ${hoveredCard === 'search' && liquidGlass ? 'shadow-2xl shadow-emerald-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-emerald-400 ${hoveredCard === 'search' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Search & Manage
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    Find and organize your flashcard collection.
                  </p>
                  <div className="flex items-center gap-3 text-emerald-400 font-medium pt-2">
                    <span>Browse Cards</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'search' ? 'translate-x-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Performance Card */}
            <button
              id="flashcard-performance"
              onClick={() => router.push('/cybersecurity/flashcards/performance')}
              onMouseEnter={() => setHoveredCard('performance')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative ${
                liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'
              } p-12 md:p-16 border ${
                hoveredCard === 'performance'
                  ? liquidGlass
                    ? 'border-white/30 bg-white/10 shadow-2xl shadow-amber-500/30'
                    : 'border-amber-500/50 bg-zinc-800'
                  : liquidGlass
                    ? 'border-white/10'
                    : 'border-zinc-800'
              } transition-all duration-700 hover:scale-[1.02] overflow-hidden text-left`}
            >
              {/* Gradient Overlay on Hover */}
              {liquidGlass && hoveredCard === 'performance' && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Light Reflection */}
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
              )}

              <div className="relative space-y-6">
                {/* Icon */}
                <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${
                  liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
                } ${hoveredCard === 'performance' && liquidGlass ? 'shadow-2xl shadow-amber-500/50' : ''} transition-all duration-700`}>
                  <svg className={`w-12 h-12 md:w-14 md:h-14 text-amber-400 ${hoveredCard === 'performance' && liquidGlass ? 'drop-shadow-[0_0_20px_currentColor]' : ''} transition-all duration-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Performance
                  </h2>
                  <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                    View your learning statistics and progress.
                  </p>
                  <div className="flex items-center gap-3 text-amber-400 font-medium pt-2">
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
