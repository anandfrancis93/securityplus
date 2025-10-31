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
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-zinc-950 to-cyan-950 text-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-zinc-950 to-cyan-950 text-white overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg">
              S+
            </div>
            <span className="text-xl font-bold">SecurityPlus AI</span>
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-full border border-white/20 hover:border-white/30 font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32 md:px-12 lg:px-20 md:pt-32 md:pb-40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-block mb-6 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-sm font-medium backdrop-blur-xl">
              🎯 Adaptive Learning Platform
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
              <span className="block bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Master Security+
              </span>
              <span className="block bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                with AI Precision
              </span>
            </h1>

            <p className="text-xl md:text-2xl lg:text-3xl text-zinc-400 leading-relaxed mb-12 max-w-3xl mx-auto font-light">
              Intelligent quiz generation, real-time performance tracking, and personalized learning paths powered by advanced AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{loading ? 'Signing in...' : 'Start Learning Free'}</span>
              </button>

              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30 font-bold text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Learn More</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {error && (
              <div className="mt-6 max-w-md mx-auto bg-red-500/20 border border-red-500/50 text-red-300 rounded-2xl p-4 backdrop-blur-xl">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-20 md:px-12 lg:px-20 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                400+
              </div>
              <div className="text-zinc-400 text-sm md:text-base">Security+ Topics</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                AI-Powered
              </div>
              <div className="text-zinc-400 text-sm md:text-base">Question Generation</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2">
                Real-time
              </div>
              <div className="text-zinc-400 text-sm md:text-base">Performance Tracking</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Adaptive
              </div>
              <div className="text-zinc-400 text-sm md:text-base">Learning Paths</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-32 md:px-12 lg:px-20 md:py-40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Everything you need to ace the exam
            </h2>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto">
              Our platform uses cutting-edge AI to create a personalized learning experience that adapts to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">AI-Generated Questions</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Unlimited unique questions generated on-demand, covering all 400+ Security+ SY0-701 topics with varying difficulty levels.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Performance Analytics</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Track your progress with IRT-based ability estimation, confidence intervals, and detailed performance graphs across topics and domains.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Adaptive Learning</h3>
                <p className="text-zinc-400 leading-relaxed">
                  FSRS-based spaced repetition that prioritizes topics you need to review, optimizing your study time for maximum retention.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-pink-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Balanced Difficulty</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Every quiz contains exactly 3 easy, 4 medium, and 3 hard questions (30/40/30%) to match the actual Security+ exam distribution.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-orange-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Comprehensive Coverage</h3>
                <p className="text-zinc-400 leading-relaxed">
                  All 5 Security+ domains covered: General Security Concepts, Threats & Vulnerabilities, Architecture, Operations, and Management.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Detailed Explanations</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Every question includes comprehensive explanations for all options, helping you understand not just the correct answer, but why others are wrong.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-32 md:px-12 lg:px-20 md:py-40 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Simple, powerful workflow
            </h2>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto">
              Get started in seconds and begin your journey to Security+ certification
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16 relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 -z-10" />

            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold relative">
                <div className="absolute inset-0 bg-violet-500/50 rounded-full blur-2xl" />
                <span className="relative">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Sign In</h3>
              <p className="text-zinc-400 leading-relaxed">
                Connect with your Google account in one click. No lengthy registration forms or credit card required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-4xl font-bold relative">
                <div className="absolute inset-0 bg-cyan-500/50 rounded-full blur-2xl" />
                <span className="relative">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Take Quizzes</h3>
              <p className="text-zinc-400 leading-relaxed">
                Start your first AI-generated quiz. Answer 10 questions tailored to your current knowledge level.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-4xl font-bold relative">
                <div className="absolute inset-0 bg-emerald-500/50 rounded-full blur-2xl" />
                <span className="relative">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Track Progress</h3>
              <p className="text-zinc-400 leading-relaxed">
                Watch your ability score improve with detailed analytics and personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-32 md:px-12 lg:px-20 md:py-40 border-t border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="relative bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-emerald-500/10 border border-white/20 rounded-[3rem] p-12 md:p-20 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 rounded-[3rem]" />

            <h2 className="relative text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Ready to ace Security+?
            </h2>
            <p className="relative text-xl md:text-2xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Join thousands of learners using AI-powered adaptive learning to pass their certification exam.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="relative group px-10 py-5 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Signing in...' : 'Get Started Free'}</span>
            </button>

            <p className="relative text-zinc-500 text-sm md:text-base mt-6">
              No credit card required • Free forever • Takes 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 md:px-12 lg:px-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg">
                S+
              </div>
              <span className="text-lg font-semibold">SecurityPlus AI</span>
            </div>

            <p className="text-zinc-500 text-sm text-center md:text-left">
              © 2024 SecurityPlus AI. All rights reserved.
            </p>

            <div className="flex gap-6 text-sm text-zinc-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
