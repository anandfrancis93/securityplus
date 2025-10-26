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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-slate-300 text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render login if already authenticated (redirect in progress)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo/Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-br from-white via-violet-100 to-violet-200 bg-clip-text text-transparent tracking-tight leading-tight pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Learning Hub
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Master your skills with adaptive learning
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 backdrop-blur-sm rounded-[28px] p-8 sm:p-10 border-2 border-violet-500/30 shadow-2xl shadow-violet-500/50 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight text-center">
                Welcome
              </h2>
              <p className="text-slate-300 text-center text-sm sm:text-base">
                Sign in with your Google account to save your progress and sync across devices
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-2xl p-4 text-sm mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 active:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 py-4 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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

            <p className="text-slate-500 text-xs text-center mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
