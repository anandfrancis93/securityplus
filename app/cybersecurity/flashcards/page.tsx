'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards } from '@/lib/flashcardDb';
import { Flashcard } from '@/lib/types';
import NotificationSettings from '@/components/NotificationSettings';

export default function FlashcardsPage() {
  const { userId, user, loading: authLoading, handleSignOut, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  useEffect(() => {
    if (userId) {
      loadFlashcards();
    }
  }, [userId]);

  const loadFlashcards = async () => {
    if (!userId) return;

    try {
      const cards = await getUserFlashcards(userId);
      setFlashcards(cards);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStudy = () => {
    router.push('/cybersecurity/flashcards/study');
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative text-center">
          <div className={`animate-spin rounded-2xl h-32 w-32 md:h-40 md:w-40 border-4 ${liquidGlass ? 'border-white/10 border-t-cyan-400/80' : 'border-transparent border-b-2 border-b-violet-500'} mx-auto`}></div>
          <p className="mt-8 text-2xl text-zinc-400">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  // Flashcards landing page with four options
  return (
    <>
      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}
      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => router.push('/cybersecurity')}
              className="text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-700 p-3 rounded-full"
              title="Back to Cybersecurity"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50">
                  <div className="px-4 py-2 text-sm text-slate-200 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-slate-200 hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-4 bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent tracking-tight leading-tight">Flashcards</h1>
          <p className="text-zinc-400 text-xl md:text-2xl">Choose an option</p>
        </div>

        {/* Four Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Study Option */}
          <button
            id="study"
            onClick={handleStartStudy}
            className={`relative p-10 border cursor-pointer min-h-[280px] touch-manipulation hover:scale-105 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border-white/10 hover:border-white/30 hover:bg-white/10 rounded-[40px] hover:shadow-2xl hover:shadow-violet-500/30' : 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 rounded-[28px] hover:shadow-2xl'}`}
          >
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative text-center space-y-4">
              <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'} transition-all duration-700`}>
                <svg className="w-12 h-12 md:w-14 md:h-14 text-violet-400 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Study</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">Review with spaced repetition</p>
            </div>
          </button>

          {/* Create Option */}
          <button
            id="create"
            onClick={() => router.push('/cybersecurity/flashcards/create')}
            className={`relative p-10 border cursor-pointer min-h-[280px] touch-manipulation hover:scale-105 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border-white/10 hover:border-white/30 hover:bg-white/10 rounded-[40px] hover:shadow-2xl hover:shadow-cyan-500/30' : 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 rounded-[28px] hover:shadow-2xl'}`}
          >
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative text-center space-y-4">
              <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'} transition-all duration-700`}>
                <svg className="w-12 h-12 md:w-14 md:h-14 text-cyan-400 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Create</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">Make new flashcards</p>
            </div>
          </button>

          {/* Search Option */}
          <button
            id="search"
            onClick={() => router.push('/cybersecurity/flashcards/search')}
            className={`relative p-10 border cursor-pointer min-h-[280px] touch-manipulation hover:scale-105 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border-white/10 hover:border-white/30 hover:bg-white/10 rounded-[40px] hover:shadow-2xl hover:shadow-emerald-500/30' : 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 rounded-[28px] hover:shadow-2xl'}`}
          >
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative text-center space-y-4">
              <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'} transition-all duration-700`}>
                <svg className="w-12 h-12 md:w-14 md:h-14 text-emerald-400 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Search</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">Find and manage cards</p>
              <p className="text-zinc-500 text-base mt-3">{flashcards.length} total cards</p>
            </div>
          </button>

          {/* Performance Option */}
          <button
            id="flashcard-performance"
            onClick={() => router.push('/cybersecurity/flashcards/performance')}
            className={`relative p-10 border cursor-pointer min-h-[280px] touch-manipulation hover:scale-105 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border-white/10 hover:border-white/30 hover:bg-white/10 rounded-[40px] hover:shadow-2xl hover:shadow-amber-500/30' : 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 rounded-[28px] hover:shadow-2xl'}`}
          >
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative text-center space-y-4">
              <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'} transition-all duration-700`}>
                <svg className="w-12 h-12 md:w-14 md:h-14 text-amber-400 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Performance</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">View your statistics</p>
            </div>
          </button>
        </div>

        {/* Notification Settings at bottom */}
        {flashcards.length > 0 && (
          <div className="mt-12">
            <NotificationSettings />
          </div>
        )}
      </div>
    </div>
    </>
  );
}
