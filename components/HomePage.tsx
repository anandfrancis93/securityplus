'use client';
// Trigger deployment
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';

export default function HomePage() {
  const router = useRouter();
  const { user, handleSignOut } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
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

  // SVG Icon Components
  const getSubjectIcon = (subjectId: string, isHovered: boolean) => {
    const baseClasses = "w-24 h-24 md:w-28 md:h-28 transition-all duration-500 ease-out";
    const colorClass = isHovered ? "opacity-100" : "opacity-80";

    switch (subjectId) {
      case 'cybersecurity':
        return (
          <svg className={`${baseClasses} ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
            <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
          </svg>
        );
      case 'networking':
        return (
          <svg className={`${baseClasses} ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" strokeLinecap="round" />
            <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        );
      case 'maths':
        return (
          <svg className={`${baseClasses} ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            {/* Calculator-style math symbols */}
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
            {/* Plus sign */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h3M8.5 7.5v3" />
            {/* Minus sign */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3" />
            {/* Multiply sign */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 14.5l2 2M8.5 14.5l-2 2" />
            {/* Divide sign */}
            <circle cx="15.5" cy="14" r="0.5" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 15.5h3" />
            <circle cx="15.5" cy="17" r="0.5" fill="currentColor" />
          </svg>
        );
      case 'physics':
        return (
          <svg className={`${baseClasses} ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            {/* Lightning bolt - represents energy/electricity */}
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
                  fill="currentColor"
                  stroke="none" />
          </svg>
        );
      case 'english':
        return (
          <svg className={`${baseClasses} ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            {/* Book with "A" */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            {/* Letter "A" */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-5 2 5M10.5 12.5h3" />
            {/* Underline decoration */}
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
      iconColor: 'text-violet-400',
      gradient: 'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20',
      borderColor: 'border-violet-500/30 hover:border-violet-400',
      glowColor: 'shadow-violet-500/50',
      path: '/cybersecurity',
      disabled: false,
    },
    {
      id: 'networking',
      name: 'Networking',
      description: 'Coming soon',
      iconColor: 'text-cyan-400',
      gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/50',
      path: '/networking',
      disabled: true,
    },
    {
      id: 'maths',
      name: 'Maths',
      description: 'Coming soon',
      iconColor: 'text-emerald-400',
      gradient: 'from-emerald-500/20 via-green-500/20 to-lime-500/20',
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/50',
      path: '/maths',
      disabled: true,
    },
    {
      id: 'physics',
      name: 'Physics',
      description: 'Coming soon',
      iconColor: 'text-rose-400',
      gradient: 'from-rose-500/20 via-red-500/20 to-orange-500/20',
      borderColor: 'border-rose-500/30',
      glowColor: 'shadow-rose-500/50',
      path: '/physics',
      disabled: true,
    },
    {
      id: 'english',
      name: 'English',
      description: 'Coming soon',
      iconColor: 'text-amber-400',
      gradient: 'from-amber-500/20 via-yellow-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/50',
      path: '/english',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Background Pattern Overlay - MD3 Surface Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header - MD3 Top App Bar Pattern */}
        <header className="mb-16 md:mb-20">
          {/* Menu Button - MD3 Icon Button with State Layer */}
          <div className="flex justify-end items-center mb-12 relative">
            <div className="relative" ref={menuRef}>
              <button
                id="menu"
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative group p-3 rounded-full transition-all duration-300 ease-out
                         hover:bg-violet-500/10 active:bg-violet-500/20
                         focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                title="Menu"
                aria-label="Open menu"
              >
                {/* State Layer */}
                <span className="absolute inset-0 rounded-full bg-violet-400/0 group-hover:bg-violet-400/10 transition-colors duration-300" />

                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-violet-300 transition-colors duration-300 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu - MD3 Menu Pattern with Elevation 2 */}
              {menuOpen && user && !user?.isAnonymous && (
                <div
                  className="absolute right-0 top-full mt-3 bg-slate-800/95 backdrop-blur-xl
                           border border-slate-700/50 rounded-3xl overflow-hidden
                           shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]
                           min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* User Name Section - MD3 List Item */}
                  <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <svg
                          className="w-5 h-5 text-violet-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-200">{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out Button - MD3 List Item with State Layer */}
                  <button
                    id="sign-out"
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-5 py-4 text-sm text-left text-slate-200
                             hover:bg-slate-700/50 active:bg-slate-700/70
                             transition-colors duration-200 flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Section - MD3 Display Typography */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-br from-white via-violet-100 to-violet-200 bg-clip-text text-transparent
                         tracking-tight leading-none animate-in fade-in slide-in-from-bottom-4 duration-700">
              Learning Hub
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Select a subject to begin your learning journey
            </p>
          </div>
        </header>

        {/* Subject Cards Grid - MD3 Card Pattern with Elevation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-12">
          {subjects.map((subject, index) => (
            <button
              key={subject.id}
              id={subject.id}
              onClick={() => !subject.disabled && router.push(subject.path)}
              disabled={subject.disabled}
              onMouseEnter={() => !subject.disabled && setHoveredCard(subject.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-gradient-to-br ${subject.gradient}
                       backdrop-blur-sm rounded-[28px] p-8 border-2 ${subject.borderColor}
                       transition-all duration-500 ease-out
                       animate-in fade-in slide-in-from-bottom-8 duration-700
                       ${subject.disabled
                         ? 'opacity-40 cursor-not-allowed'
                         : `cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                            hover:shadow-2xl hover:${subject.glowColor}
                            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-950`
                       }`}
              style={{
                animationDelay: `${index * 100}ms`,
                background: subject.disabled
                  ? undefined
                  : hoveredCard === subject.id
                    ? `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.15) 100%)`
                    : undefined,
              }}
            >
              {/* MD3 State Layer Overlay */}
              {!subject.disabled && (
                <div className="absolute inset-0 rounded-[28px] bg-white/0 group-hover:bg-white/5 group-active:bg-white/10 transition-colors duration-300 pointer-events-none" />
              )}

              {/* Card Background Glow Effect */}
              {!subject.disabled && hoveredCard === subject.id && (
                <div className={`absolute inset-0 rounded-[28px] blur-xl ${subject.gradient} opacity-50 -z-10 transition-opacity duration-500`} />
              )}

              {/* SVG Icon with MD3 Scale Animation */}
              <div className={`flex justify-center items-center mb-6 transition-transform duration-500 ease-out ${subject.iconColor}
                           ${!subject.disabled && hoveredCard === subject.id ? 'scale-110 rotate-3' : 'scale-100 rotate-0'}`}>
                {getSubjectIcon(subject.id, hoveredCard === subject.id)}
              </div>

              {/* Subject Name - MD3 Headline Typography */}
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white tracking-tight relative z-10">
                {subject.name}
              </h2>

              {/* Description - MD3 Body Typography */}
              <p className="text-slate-400 text-sm md:text-base leading-relaxed relative z-10 min-h-[3rem]">
                {subject.description}
              </p>

              {/* Coming Soon Badge - MD3 Chip/Badge Pattern */}
              {subject.disabled && (
                <div className="absolute top-5 right-5">
                  <span className="inline-flex items-center gap-2 bg-slate-700/80 backdrop-blur-sm text-slate-300
                                 text-xs font-medium px-4 py-2 rounded-full border border-slate-600/50
                                 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Active Indicator - MD3 Pattern */}
              {!subject.disabled && (
                <div className={`absolute bottom-5 right-5 transition-all duration-300
                              ${hoveredCard === subject.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                  <svg
                    className="w-6 h-6 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
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
