'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getUserFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDeckStats } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function FlashcardPerformance() {
  const { userId, user, loading: authLoading } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useRequireAuth(user, authLoading);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewScheduleOpen, setReviewScheduleOpen] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFlashcards();
    }
  }, [userId]);

  const loadFlashcards = async () => {
    if (!userId) return;

    try {
      const [cards, cardReviews] = await Promise.all([
        getUserFlashcards(userId),
        getUserReviews(userId),
      ]);

      setFlashcards(cards);
      setReviews(cardReviews);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!userId) return;

    if (!confirm('Reset ALL flashcard progress? This will clear all review history and spaced repetition data. Your flashcards will not be deleted.')) return;

    try {
      const { resetFlashcardProgress } = await import('@/lib/flashcardDb');
      await resetFlashcardProgress(userId);
      alert('Flashcard progress reset successfully!');
      await loadFlashcards();
    } catch (error) {
      console.error('Error resetting flashcard progress:', error);
      alert('Failed to reset progress. Please try again.');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading performance..." />;
  }

  const stats = getDeckStats(reviews, flashcards.map(f => f.id));

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      color: '#e5e5e5'
    }}>
      <style jsx>{`
        @keyframes tooltipFade {
          0%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }

        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card:hover .tooltip {
          opacity: 1;
        }

        .button-reset {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .table-row {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'relative',
        paddingTop: '24px',
        paddingBottom: '16px'
      }}>
        <Header />
      </div>

      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '0 clamp(20px, 4vw, 48px) clamp(20px, 3vw, 32px)'
      }}>
        {/* Hero Section */}
        <div style={{
          marginBottom: 'clamp(20px, 3vw, 32px)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(48px, 10vw, 72px)',
            fontWeight: 'bold',
            letterSpacing: '-0.025em',
            lineHeight: '1.2',
            marginBottom: 'clamp(16px, 2.5vw, 24px)'
          }}>
            <span style={{
              display: 'block',
              color: '#e5e5e5',
              marginBottom: '8px'
            }}>Flashcard</span>
            <span style={{
              display: 'block',
              color: '#8b5cf6'
            }}>Performance</span>
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 3.5vw, 20px)',
            fontWeight: '300',
            color: '#a8a8a8',
            lineHeight: '1.6',
            maxWidth: '672px',
            margin: '0 auto'
          }}>
            View your progress and statistics
          </p>
        </div>

        {/* Stats */}
        {flashcards.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(16px, 2.5vw, 24px)',
            marginBottom: 'clamp(20px, 3vw, 32px)'
          }}>
            {/* Total Stats Card */}
            <div
              className="stat-card"
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(16px, 2.5vw, 24px)',
                boxShadow: hoveredStat === 0
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                cursor: 'help'
              }}
              onMouseEnter={() => setHoveredStat(0)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={{
                marginBottom: '12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: '600',
                color: '#a8a8a8',
                letterSpacing: '0.05em'
              }}>
                Total
              </div>
              <div style={{
                fontSize: 'clamp(28px, 6vw, 36px)',
                fontWeight: 'bold',
                color: '#f59e0b'
              }}>
                {stats.total}
              </div>
              {/* Tooltip */}
              <div
                className="tooltip"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  width: '192px',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  padding: '12px',
                  boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919',
                  zIndex: 50,
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#e5e5e5',
                  margin: 0
                }}>
                  Total number of flashcards in your deck, including new and reviewed cards.
                </p>
              </div>
            </div>

            {/* Learning Stats Card */}
            <div
              className="stat-card"
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(16px, 2.5vw, 24px)',
                boxShadow: hoveredStat === 1
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                cursor: 'help'
              }}
              onMouseEnter={() => setHoveredStat(1)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={{
                marginBottom: '12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: '600',
                color: '#a8a8a8',
                letterSpacing: '0.05em'
              }}>
                Learning
              </div>
              <div style={{
                fontSize: 'clamp(28px, 6vw, 36px)',
                fontWeight: 'bold',
                color: '#f43f5e'
              }}>
                {stats.learning}
              </div>
              {stats.learning > 0 && (
                <div style={{
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  color: '#666666',
                  marginTop: '8px',
                  fontWeight: '500'
                }}>
                  New cards
                </div>
              )}
              {/* Tooltip */}
              <div
                className="tooltip"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  width: '224px',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  padding: '12px',
                  boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919',
                  zIndex: 50,
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#e5e5e5',
                  margin: 0
                }}>
                  Cards you&apos;re struggling with - rated as &quot;Again&quot; or have been forgotten after learning. These need more practice to master.
                </p>
              </div>
            </div>

            {/* Review Stats Card */}
            <div
              className="stat-card"
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(16px, 2.5vw, 24px)',
                boxShadow: hoveredStat === 2
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                cursor: 'help'
              }}
              onMouseEnter={() => setHoveredStat(2)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={{
                marginBottom: '12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: '600',
                color: '#a8a8a8',
                letterSpacing: '0.05em'
              }}>
                Review
              </div>
              <div style={{
                fontSize: 'clamp(28px, 6vw, 36px)',
                fontWeight: 'bold',
                color: '#06b6d4'
              }}>
                {stats.review}
              </div>
              {stats.review > 0 && (
                <div style={{
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  color: '#666666',
                  marginTop: '8px',
                  fontWeight: '500'
                }}>
                  In progress
                </div>
              )}
              {/* Tooltip */}
              <div
                className="tooltip"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  width: '224px',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  padding: '12px',
                  boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919',
                  zIndex: 50,
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#e5e5e5',
                  margin: 0
                }}>
                  Cards you&apos;re actively learning - rated as &quot;Hard&quot;, &quot;Good&quot;, or &quot;Easy&quot; with 1-2 successful reviews. Making good progress!
                </p>
              </div>
            </div>

            {/* Mastered Stats Card */}
            <div
              className="stat-card"
              style={{
                position: 'relative',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                padding: 'clamp(16px, 2.5vw, 24px)',
                boxShadow: hoveredStat === 3
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '12px 12px 24px #050505, -12px -12px 24px #191919',
                cursor: 'help'
              }}
              onMouseEnter={() => setHoveredStat(3)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={{
                marginBottom: '12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: '600',
                color: '#a8a8a8',
                letterSpacing: '0.05em'
              }}>
                Mastered
              </div>
              <div style={{
                fontSize: 'clamp(28px, 6vw, 36px)',
                fontWeight: 'bold',
                color: '#10b981'
              }}>
                {stats.mastered}
              </div>
              {stats.mastered > 0 && (
                <div style={{
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  color: '#666666',
                  marginTop: '8px',
                  fontWeight: '500'
                }}>
                  {Math.round((stats.mastered / stats.total) * 100)}% complete
                </div>
              )}
              {/* Tooltip */}
              <div
                className="tooltip"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  width: '224px',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  padding: '12px',
                  boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919',
                  zIndex: 50,
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#e5e5e5',
                  margin: 0
                }}>
                  Cards you&apos;ve successfully reviewed 3 or more times. Well-learned and scheduled with optimal intervals for long-term retention using FSRS.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review Schedule Table */}
        {flashcards.length > 0 && (
          <div style={{
            position: 'relative',
            backgroundColor: '#0f0f0f',
            borderRadius: '24px',
            padding: 'clamp(20px, 3vw, 32px)',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
            marginBottom: 'clamp(20px, 3vw, 32px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'clamp(16px, 2.5vw, 24px)'
            }}>
              <h3 style={{
                fontSize: 'clamp(18px, 4vw, 24px)',
                fontWeight: 'bold',
                color: '#e5e5e5',
                margin: 0
              }}>
                Review Schedule
              </h3>
              {reviews.length > 0 && (
                <button
                  onClick={() => setReviewScheduleOpen(!reviewScheduleOpen)}
                  className="toggle-button"
                  style={{
                    padding: '8px',
                    borderRadius: '12px',
                    backgroundColor: '#0f0f0f',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                  }}
                  aria-label="Toggle review schedule"
                >
                  <svg
                    style={{
                      width: '24px',
                      height: '24px',
                      transform: reviewScheduleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: '#a8a8a8'
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            {(reviews.length === 0 || reviewScheduleOpen) && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  fontSize: '14px',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: '1px solid #191919'
                    }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontWeight: '600',
                        color: '#a8a8a8'
                      }}>Term</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontWeight: '600',
                        color: '#a8a8a8'
                      }}>Last Review</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontWeight: '600',
                        color: '#a8a8a8'
                      }}>Last Rating</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontWeight: '600',
                        color: '#a8a8a8'
                      }}>Next Review</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontWeight: '600',
                        color: '#a8a8a8'
                      }}>Interval</th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontWeight: '600',
                        color: '#a8a8a8'
                      }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{
                          padding: '48px 16px',
                          textAlign: 'center',
                          color: '#666666'
                        }}>
                          No reviews yet. Start studying to see your review schedule here!
                        </td>
                      </tr>
                    ) : (
                      reviews
                        .sort((a, b) => a.nextReviewDate - b.nextReviewDate)
                        .map((review) => {
                          const card = flashcards.find(f => f.id === review.flashcardId);
                          if (!card) return null;

                          const now = Date.now();
                          const isDue = review.nextReviewDate <= now;
                          const nextReviewDate = new Date(review.nextReviewDate);
                          const lastReviewDate = new Date(review.reviewedAt);
                          const intervalHours = Math.round((review.nextReviewDate - review.reviewedAt) / (1000 * 60 * 60));
                          const intervalDays = Math.round(intervalHours / 24);

                          // Calculate time until/since due
                          const timeDiff = Math.abs(review.nextReviewDate - now);
                          const hoursUntil = Math.round(timeDiff / (1000 * 60 * 60));
                          const daysUntil = Math.round(hoursUntil / 24);

                          return (
                            <tr
                              key={review.flashcardId}
                              className="table-row"
                              style={{
                                borderBottom: '1px solid #0a0a0a'
                              }}
                            >
                              <td style={{ padding: '16px' }}>
                                <div style={{
                                  fontWeight: '500',
                                  color: '#e5e5e5',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '200px'
                                }} title={card.term}>
                                  {card.term}
                                </div>
                              </td>
                              <td style={{
                                padding: '16px',
                                color: '#a8a8a8'
                              }}>
                                <div>{lastReviewDate.toLocaleDateString()}</div>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#666666'
                                }}>
                                  {lastReviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '6px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: '#0f0f0f',
                                  boxShadow: 'inset 2px 2px 4px #050505, inset -2px -2px 4px #191919',
                                  color: review.difficulty === 'again' ? '#f43f5e' :
                                         review.difficulty === 'hard' ? '#f59e0b' :
                                         review.difficulty === 'good' ? '#10b981' :
                                         '#06b6d4'
                                }}>
                                  {review.difficulty.charAt(0).toUpperCase() + review.difficulty.slice(1)}
                                </span>
                              </td>
                              <td style={{
                                padding: '16px',
                                color: '#a8a8a8'
                              }}>
                                <div>{nextReviewDate.toLocaleDateString()}</div>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#666666'
                                }}>
                                  {nextReviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td style={{
                                padding: '16px',
                                color: '#a8a8a8'
                              }}>
                                {intervalDays > 0 ? (
                                  <span>{intervalDays} day{intervalDays !== 1 ? 's' : ''}</span>
                                ) : (
                                  <span style={{
                                    color: '#f59e0b',
                                    fontWeight: '600'
                                  }}>{intervalHours} hour{intervalHours !== 1 ? 's' : ''}</span>
                                )}
                              </td>
                              <td style={{
                                padding: '16px',
                                color: isDue ? '#f43f5e' : '#a8a8a8',
                                fontWeight: isDue ? '600' : 'normal'
                              }}>
                                {isDue ? 'Due now' : (daysUntil > 0 ? `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : `In ${hoursUntil}h`)}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reset Progress Button */}
        {flashcards.length > 0 && (
          <div style={{
            position: 'relative',
            textAlign: 'center',
            marginTop: 'clamp(32px, 6vw, 48px)'
          }}>
            <button
              id="reset-flashcard-progress"
              onClick={handleResetProgress}
              className="button-reset"
              style={{
                backgroundColor: '#0f0f0f',
                color: '#f59e0b',
                border: 'none',
                fontWeight: 'bold',
                padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)',
                fontSize: 'clamp(14px, 2.5vw, 16px)',
                borderRadius: '16px',
                minHeight: 'clamp(44px, 8vw, 52px)',
                cursor: 'pointer',
                boxShadow: hoveredButton
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '6px 6px 12px #050505, -6px -6px 12px #191919'
              }}
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
            >
              Reset Progress
            </button>
          </div>
        )}

        {flashcards.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'clamp(32px, 6vw, 64px) 0'
          }}>
            <div style={{
              width: 'clamp(96px, 15vw, 128px)',
              height: 'clamp(96px, 15vw, 128px)',
              margin: '0 auto clamp(20px, 3vw, 32px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f0f0f',
              borderRadius: '24px',
              boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
            }}>
              <svg style={{
                width: 'clamp(64px, 10vw, 80px)',
                height: 'clamp(64px, 10vw, 80px)',
                color: '#8b5cf6'
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p style={{
              fontSize: 'clamp(16px, 3.5vw, 20px)',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#e5e5e5'
            }}>
              No flashcards yet
            </p>
            <p style={{
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              color: '#666666'
            }}>
              Create your first flashcard to start tracking performance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
