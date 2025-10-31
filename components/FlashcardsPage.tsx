'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import Header from './Header';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function FlashcardsPage() {
  const { user, loading, userId } = useApp();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [flashcardsCount, setFlashcardsCount] = useState(0);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useRequireAuth(user, loading);

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
    return <LoadingScreen message="Loading flashcards..." />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      {/* Header */}
      <div style={{ position: 'relative', paddingTop: '1.5rem', paddingBottom: '1rem' }}>
        <Header />
      </div>

      <div style={{
        position: 'relative',
        margin: '0 auto',
        padding: '0 1.5rem',
        maxWidth: '80rem'
      }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(3.75rem, 8vw, 8rem)',
              fontWeight: 'bold',
              letterSpacing: '-0.025em',
              lineHeight: '0.95',
              marginBottom: '2rem'
            }}>
              <span style={{
                display: 'block',
                color: '#e5e5e5',
                marginBottom: '0.5rem'
              }}>
                Master with
              </span>
              <span style={{
                display: 'block',
                color: '#06b6d4'
              }}>
                Flashcards
              </span>
            </h1>

            {/* Tagline */}
            <p style={{
              fontSize: 'clamp(1.25rem, 2vw, 1.875rem)',
              fontWeight: '300',
              maxWidth: '48rem',
              margin: '0 auto',
              lineHeight: '1.625',
              color: '#a8a8a8'
            }}>
              Learn with spaced repetition and active recall.
            </p>
          </div>
        </section>

        {/* Primary Actions - Featured Cards */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{
            maxWidth: '72rem',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
            gap: '2rem'
          }}>
            {/* Study Card */}
            <button
              id="study"
              onClick={() => router.push('/cybersecurity/flashcards/study')}
              onMouseEnter={() => setHoveredCard('study')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(3rem, 6vw, 4rem)',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                textAlign: 'left',
                boxShadow: hoveredCard === 'study'
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === 'study' ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              {/* Badge for due cards */}
              {dueCardsCount > 0 && (
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                    fontWeight: '600',
                    backgroundColor: '#0f0f0f',
                    borderRadius: '12px',
                    color: '#8b5cf6',
                    boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                  }}>
                    <span style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      backgroundColor: '#8b5cf6',
                      borderRadius: '50%',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }} />
                    {dueCardsCount} due
                  </div>
                </div>
              )}

              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Icon */}
                <div style={{
                  width: 'clamp(5rem, 8vw, 6rem)',
                  height: 'clamp(5rem, 8vw, 6rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '24px',
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <svg style={{
                    width: 'clamp(3rem, 5vw, 3.5rem)',
                    height: 'clamp(3rem, 5vw, 3.5rem)',
                    color: '#8b5cf6',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{
                    fontSize: 'clamp(2.5rem, 4vw, 3rem)',
                    fontWeight: 'bold',
                    letterSpacing: '-0.025em',
                    color: '#e5e5e5'
                  }}>
                    Study
                  </h2>
                  <p style={{
                    fontSize: 'clamp(1.125rem, 1.8vw, 1.25rem)',
                    color: '#a8a8a8',
                    lineHeight: '1.625'
                  }}>
                    Review with spaced repetition for long-term retention.
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#8b5cf6',
                    fontWeight: '500',
                    paddingTop: '0.5rem'
                  }}>
                    <span>Start Studying</span>
                    <svg style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: hoveredCard === 'study' ? 'translateX(0.5rem)' : 'translateX(0)'
                    }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(3rem, 6vw, 4rem)',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                textAlign: 'left',
                boxShadow: hoveredCard === 'create'
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === 'create' ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Icon */}
                <div style={{
                  width: 'clamp(5rem, 8vw, 6rem)',
                  height: 'clamp(5rem, 8vw, 6rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '24px',
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <svg style={{
                    width: 'clamp(3rem, 5vw, 3.5rem)',
                    height: 'clamp(3rem, 5vw, 3.5rem)',
                    color: '#06b6d4',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{
                    fontSize: 'clamp(2.5rem, 4vw, 3rem)',
                    fontWeight: 'bold',
                    letterSpacing: '-0.025em',
                    color: '#e5e5e5'
                  }}>
                    Create
                  </h2>
                  <p style={{
                    fontSize: 'clamp(1.125rem, 1.8vw, 1.25rem)',
                    color: '#a8a8a8',
                    lineHeight: '1.625'
                  }}>
                    Make new flashcards with AI assistance or manually.
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#06b6d4',
                    fontWeight: '500',
                    paddingTop: '0.5rem'
                  }}>
                    <span>Create Flashcard</span>
                    <svg style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: hoveredCard === 'create' ? 'translateX(0.5rem)' : 'translateX(0)'
                    }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Secondary Actions - Large Cards */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{
            maxWidth: '72rem',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
            gap: '2rem'
          }}>
            {/* Search Card */}
            <button
              id="search"
              onClick={() => router.push('/cybersecurity/flashcards/search')}
              onMouseEnter={() => setHoveredCard('search')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(3rem, 6vw, 4rem)',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                textAlign: 'left',
                boxShadow: hoveredCard === 'search'
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === 'search' ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              {/* Badge for card count */}
              {flashcardsCount > 0 && (
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                    fontWeight: '600',
                    backgroundColor: '#0f0f0f',
                    borderRadius: '12px',
                    color: '#10b981',
                    boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                  }}>
                    {flashcardsCount} cards
                  </div>
                </div>
              )}

              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Icon */}
                <div style={{
                  width: 'clamp(5rem, 8vw, 6rem)',
                  height: 'clamp(5rem, 8vw, 6rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '24px',
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <svg style={{
                    width: 'clamp(3rem, 5vw, 3.5rem)',
                    height: 'clamp(3rem, 5vw, 3.5rem)',
                    color: '#10b981',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{
                    fontSize: 'clamp(2.5rem, 4vw, 3rem)',
                    fontWeight: 'bold',
                    letterSpacing: '-0.025em',
                    color: '#e5e5e5'
                  }}>
                    Search & Manage
                  </h2>
                  <p style={{
                    fontSize: 'clamp(1.125rem, 1.8vw, 1.25rem)',
                    color: '#a8a8a8',
                    lineHeight: '1.625'
                  }}>
                    Find and organize your flashcard collection.
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#10b981',
                    fontWeight: '500',
                    paddingTop: '0.5rem'
                  }}>
                    <span>Browse Cards</span>
                    <svg style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: hoveredCard === 'search' ? 'translateX(0.5rem)' : 'translateX(0)'
                    }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(3rem, 6vw, 4rem)',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                textAlign: 'left',
                boxShadow: hoveredCard === 'performance'
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === 'performance' ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Icon */}
                <div style={{
                  width: 'clamp(5rem, 8vw, 6rem)',
                  height: 'clamp(5rem, 8vw, 6rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '24px',
                  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <svg style={{
                    width: 'clamp(3rem, 5vw, 3.5rem)',
                    height: 'clamp(3rem, 5vw, 3.5rem)',
                    color: '#f59e0b',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{
                    fontSize: 'clamp(2.5rem, 4vw, 3rem)',
                    fontWeight: 'bold',
                    letterSpacing: '-0.025em',
                    color: '#e5e5e5'
                  }}>
                    Performance
                  </h2>
                  <p style={{
                    fontSize: 'clamp(1.125rem, 1.8vw, 1.25rem)',
                    color: '#a8a8a8',
                    lineHeight: '1.625'
                  }}>
                    View your learning statistics and progress.
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#f59e0b',
                    fontWeight: '500',
                    paddingTop: '0.5rem'
                  }}>
                    <span>View Stats</span>
                    <svg style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: hoveredCard === 'performance' ? 'translateX(0.5rem)' : 'translateX(0)'
                    }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (min-width: 768px) {
          div > div:first-of-type {
            padding-top: 2rem;
            padding-bottom: 1.5rem;
          }
        }

        @media (min-width: 640px) {
          div > div:nth-of-type(2) {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }

        @media (min-width: 1024px) {
          div > div:nth-of-type(2) {
            padding-left: 3rem;
            padding-right: 3rem;
          }
        }
      `}</style>
    </div>
  );
}
