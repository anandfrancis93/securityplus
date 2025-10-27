'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase';
import { useApp } from './AppProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-300 text-sm">Loading...</div>
      </div>
    );
  }

  // Don't render login if already authenticated (redirect in progress)
  if (user) {
    return null;
  }

  return (
    <div className="bg-black text-white overflow-hidden flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 overflow-auto">
        <div className="max-w-2xl w-full my-auto">
          {/* Logo/Title Section */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-3 sm:mb-3 md:mb-4 text-white tracking-tight leading-tight">
              Learning Hub
            </h1>
            <p className="text-zinc-500 text-base sm:text-lg md:text-xl">
              Master your skills with adaptive learning
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-zinc-950 rounded-md p-6 sm:p-12 md:p-16 border border-zinc-800">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 text-center leading-tight">
                Welcome
              </h2>
              <p className="text-zinc-400 text-center text-sm leading-snug sm:text-lg md:text-xl">
                Sign in with your Google account to save your progress and sync across devices
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-md p-3 text-sm sm:text-sm mb-4 sm:mb-6">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3.5 sm:py-4 px-4 sm:px-6 rounded-md font-medium text-base sm:text-lg transition-all duration-150 flex items-center justify-center gap-2 sm:gap-3 border border-blue-600"
            >
              <svg className="w-5 h-5 sm:w-5 sm:h-5" viewBox="0 0 24 24">
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
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <p className="text-zinc-600 text-xs sm:text-sm md:text-base text-center mt-4 sm:mt-6 leading-tight">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
