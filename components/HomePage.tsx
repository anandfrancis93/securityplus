'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';
import Header from './Header';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useApp();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // SVG Icon Components with Glow
  const getSubjectIcon = (subjectId: string, isHovered: boolean) => {
    const baseClasses = `w-20 h-20 md:w-24 md:h-24 transition-all duration-500 ${isHovered ? 'scale-110 drop-shadow-[0_0_15px_currentColor]' : ''}`;

    switch (subjectId) {
      case 'cybersecurity':
        return (
          <svg className={`${baseClasses} text-violet-400`} viewBox="0 -1 24 26" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
            <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
          </svg>
        );
      case 'networking':
        return (
          <svg className={`${baseClasses} text-cyan-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" strokeLinecap="round" />
            <path strokeLinecap="round" d="M2 12h20" />
            <ellipse cx="12" cy="12" rx="4" ry="10" strokeLinecap="round" />
          </svg>
        );
      case 'maths':
        return (
          <svg className={`${baseClasses} text-emerald-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h3M8.5 7.5v3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 14.5l2 2M8.5 14.5l-2 2" />
            <circle cx="15.5" cy="13.5" r="0.2" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 15.5h3" />
            <circle cx="15.5" cy="17.5" r="0.2" fill="currentColor" />
          </svg>
        );
      case 'physics':
        return (
          <svg className={`${baseClasses} text-rose-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.9}>
            <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" />
            <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="4.5" strokeLinecap="round" transform="rotate(-60 12 12)" />
            <circle cx="3" cy="12" r="1.3" fill="currentColor" />
            <circle cx="16.5" cy="19.8" r="1.3" fill="currentColor" />
            <circle cx="16.5" cy="4.2" r="1.3" fill="currentColor" />
          </svg>
        );
      case 'english':
        return (
          <svg className={`${baseClasses} text-amber-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-5 2 5M10.5 12.5h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6" strokeWidth={1} />
          </svg>
        );
      default:
        return null;
    }
  };

  const subjects = [
    {
      id: 'cybersecurity',
      name: 'Cybersecurity',
      description: 'Master security concepts and best practices',
      path: '/cybersecurity',
      disabled: false,
      clickable: true,
      gradient: 'from-violet-500/20 to-purple-500/20',
      glowColor: 'shadow-violet-500/50',
    },
    {
      id: 'networking',
      name: 'Networking',
      description: 'Network protocols and infrastructure',
      path: '/networking',
      disabled: false,
      clickable: false,
      gradient: 'from-cyan-500/20 to-blue-500/20',
      glowColor: 'shadow-cyan-500/50',
    },
    {
      id: 'maths',
      name: 'Maths',
      description: 'Mathematical concepts and problem solving',
      path: '/maths',
      disabled: false,
      clickable: false,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      glowColor: 'shadow-emerald-500/50',
    },
    {
      id: 'physics',
      name: 'Physics',
      description: 'Physical laws and scientific principles',
      path: '/physics',
      disabled: false,
      clickable: false,
      gradient: 'from-rose-500/20 to-pink-500/20',
      glowColor: 'shadow-rose-500/50',
    },
    {
      id: 'english',
      name: 'English',
      description: 'Language arts and literature',
      path: '/english',
      disabled: false,
      clickable: false,
      gradient: 'from-amber-500/20 to-orange-500/20',
      glowColor: 'shadow-amber-500/50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-16 md:mb-20">
          <Header className="mb-12" />

          {/* Hero Section - Frosted Glass Card */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="relative">
              {/* Glow effect behind title */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-emerald-500/20 blur-3xl" />

              <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 shadow-2xl">
                {/* Light reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />

                <h1 className="relative text-6xl sm:text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-100 to-white bg-clip-text text-transparent tracking-tight">
                  Learning Hub
                </h1>
                <p className="relative text-zinc-400 text-base md:text-lg tracking-wide">
                  Select a subject to begin your learning journey
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Subject Cards Grid - Glass Morphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-12">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              id={subject.id}
              onClick={() => subject.clickable && router.push(subject.path)}
              disabled={subject.disabled}
              onMouseEnter={() => subject.clickable && setHoveredCard(subject.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border transition-all duration-500 transform
                       ${subject.disabled
                         ? 'border-white/5 opacity-40 cursor-not-allowed'
                         : subject.clickable
                           ? hoveredCard === subject.id
                             ? `border-white/20 bg-white/10 scale-105 shadow-2xl ${subject.glowColor}`
                             : 'border-white/10 hover:border-white/20'
                           : 'border-white/10 cursor-default'
                       }
                       focus:outline-none focus:ring-2 focus:ring-white/30`}
            >
              {/* Gradient overlay on hover */}
              {hoveredCard === subject.id && subject.clickable && (
                <div className={`absolute inset-0 bg-gradient-to-br ${subject.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              )}

              {/* Light reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`flex justify-center items-center mb-6 ${subject.disabled ? 'opacity-30' : ''}`}>
                  {getSubjectIcon(subject.id, hoveredCard === subject.id && subject.clickable)}
                </div>

                {/* Subject Name */}
                <h2 className="text-xl md:text-2xl font-bold mb-3 text-white tracking-tight">
                  {subject.name}
                </h2>

                {/* Description */}
                <p className="text-zinc-400 text-sm md:text-base min-h-[3rem]">
                  {subject.description}
                </p>
              </div>

              {/* Coming Soon Badge */}
              {subject.disabled && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Active Indicator Arrow with Glow */}
              {subject.clickable && hoveredCard === subject.id && (
                <div className="absolute bottom-6 right-6 text-white/80 animate-pulse">
                  <svg
                    className="w-6 h-6 drop-shadow-[0_0_8px_currentColor]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
