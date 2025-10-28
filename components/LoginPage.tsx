'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase';
import { useApp } from './AppProvider';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading, liquidGlass } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set CSS variable for actual viewport height (fixes mobile browser address bar issue)
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Redirect will happen automatically via useEffect once user state updates
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className={`min-h-screen text-white flex items-center justify-center ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative text-zinc-300 text-sm">Loading...</div>
      </div>
    );
  }

  // Don't render login if already authenticated (redirect in progress)
  if (user) {
    return null;
  }

  return (
    <div className={`text-white overflow-hidden flex flex-col relative ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`} style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}
      <div className="relative flex items-center justify-center px-6 sm:px-8 lg:px-12 py-4 flex-1 overflow-auto">
        <div className="max-w-3xl w-full my-auto">
          {/* Hero Section - Apple Style */}
          <div className="text-center mb-8 md:mb-10">
            <div className="space-y-8">
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95]">
                <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                  Learn without
                </span>
                <span className="block bg-gradient-to-br from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  limits.
                </span>
              </h1>
              <p className={`text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Your adaptive learning companion powered by AI
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-950 rounded-md'} p-10 sm:p-12 md:p-16 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} ${liquidGlass ? 'shadow-2xl' : ''} transition-all duration-700`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
            )}
            <div className="relative mb-10">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 text-center tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>
                Welcome
              </h2>
              <p className={`text-center text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                Sign in to continue your learning journey
              </p>
            </div>

            {error && (
              <div className={`relative bg-red-500/20 border border-red-500/50 text-red-300 ${liquidGlass ? 'rounded-3xl backdrop-blur-xl' : 'rounded-md'} p-4 text-base mb-6 transition-all duration-700`}>
                {liquidGlass && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent rounded-3xl" />
                )}
                <span className="relative">{error}</span>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`relative w-full group ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-3xl border border-white/20 hover:border-white/30' : 'bg-blue-600 hover:bg-blue-700 rounded-md border border-blue-600'} disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 md:py-6 px-6 font-bold text-lg md:text-xl transition-all duration-700 flex items-center justify-center gap-3 ${liquidGlass ? 'shadow-xl hover:shadow-2xl hover:shadow-white/10 hover:scale-[1.02]' : ''}`}
            >
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}
              <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="relative z-10">{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <p className={`text-center mt-6 leading-relaxed ${liquidGlass ? 'text-zinc-500 text-sm md:text-base' : 'text-zinc-600 text-xs md:text-sm'}`}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
