'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  getUserFlashcards,
  getUserReviews,
  getFlashcard,
  saveFlashcardReview,
} from '@/lib/flashcardDb';
import { getDueFlashcards } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function StudyFlashcards() {
  const { userId, user, loading: authLoading, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useRequireAuth(user, authLoading);

  const [dueCardIds, setDueCardIds] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [imageEnlarged, setImageEnlarged] = useState(false);

  useEffect(() => {
    if (userId) {
      loadDueCards();
    }
  }, [userId]);

  const loadDueCards = async () => {
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

      setDueCardIds(due);

      if (due.length > 0) {
        const card = await getFlashcard(due[0]);
        setCurrentCard(card);
      }
    } catch (error) {
      console.error('Error loading due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || !userId || answering) return;

    setAnswering(true);

    try {
      // Get previous review if exists
      const reviews = await getUserReviews(userId);
      const previousReview = reviews.find((r) => r.flashcardId === currentCard.id) || null;

      // Calculate next review via API
      console.log('[Client] Requesting review calculation:', {
        flashcardId: currentCard.id,
        userId,
        difficulty,
        hasPreviousReview: !!previousReview
      });

      const response = await fetch('/api/flashcard-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousReview,
          difficulty,
          flashcardId: currentCard.id,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Client] API error:', errorData);
        throw new Error(`Failed to calculate review: ${errorData.details || errorData.error}`);
      }

      const newReview = await response.json();
      console.log('[Client] Received new review:', newReview);

      // Save review
      console.log('[Client] Saving review to Firebase...');
      await saveFlashcardReview(newReview);
      console.log('[Client] Review saved successfully');

      // Move to next card
      if (currentCardIndex < dueCardIds.length - 1) {
        const nextIndex = currentCardIndex + 1;
        setCurrentCardIndex(nextIndex);
        const nextCard = await getFlashcard(dueCardIds[nextIndex]);
        setCurrentCard(nextCard);
        setIsFlipped(false);
      } else {
        // Finished all cards
        router.push('/cybersecurity/flashcards?completed=true');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review. Please try again.');
    } finally {
      setAnswering(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading flashcards..." />;
  }

  if (dueCardIds.length === 0 || !currentCard) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        color: '#e5e5e5',
      }}>
        {/* Header */}
        <div style={{
          position: 'relative',
          paddingTop: '24px',
          paddingBottom: '16px',
        }}>
          <Header />
        </div>

        <div style={{
          position: 'relative',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)',
        }}>
          <div style={{
            maxWidth: '768px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'clamp(48px, 10vw, 96px)',
              marginBottom: 'clamp(20px, 3vw, 32px)',
            }}>✅</div>
            <h1 style={{
              fontSize: 'clamp(32px, 8vw, 80px)',
              fontWeight: 'bold',
              letterSpacing: '-0.05em',
              lineHeight: '0.95',
              marginBottom: 'clamp(20px, 3vw, 32px)',
              color: '#e5e5e5',
            }}>
              All Done!
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 4vw, 24px)',
              fontWeight: '300',
              lineHeight: '1.5',
              color: '#a8a8a8',
              marginBottom: 'clamp(32px, 6vw, 48px)',
            }}>
              No flashcards due right now.
            </p>
            <button
              onClick={() => router.push('/cybersecurity/flashcards')}
              style={{
                backgroundColor: '#0f0f0f',
                color: '#e5e5e5',
                padding: 'clamp(16px, 2.5vw, 24px) clamp(24px, 4vw, 48px)',
                fontSize: 'clamp(16px, 3.5vw, 20px)',
                fontWeight: '500',
                letterSpacing: '-0.025em',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
              }}
            >
              Back to Flashcards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentCardIndex + 1) / dueCardIds.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      color: '#e5e5e5',
    }}>
      {/* Header */}
      <div style={{
        position: 'relative',
        paddingTop: '24px',
        paddingBottom: '16px',
      }}>
        <Header />
      </div>

      <div style={{
        position: 'relative',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 clamp(20px, 4vw, 48px)',
      }}>
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          marginBottom: 'clamp(32px, 6vw, 48px)',
        }}>
          <div style={{
            maxWidth: '896px',
            margin: '0 auto',
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 8vw, 80px)',
              fontWeight: 'bold',
              letterSpacing: '-0.05em',
              lineHeight: '0.95',
              marginBottom: 'clamp(16px, 2.5vw, 24px)',
              color: '#e5e5e5',
            }}>
              Study
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}>
              <p style={{
                fontSize: 'clamp(16px, 4vw, 24px)',
                fontWeight: '300',
                letterSpacing: '-0.025em',
                color: '#a8a8a8',
              }}>
                Card {currentCardIndex + 1} <span style={{ color: '#666666' }}>of</span> {dueCardIds.length}
              </p>
            </div>
          </div>
        </section>

        {/* Progress Bar */}
        <div style={{
          marginBottom: 'clamp(32px, 6vw, 64px)',
        }}>
          <div style={{
            position: 'relative',
            maxWidth: '768px',
            margin: '0 auto',
          }}>
            <div style={{
              width: '100%',
              height: '12px',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#0f0f0f',
              borderRadius: '24px',
              boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
            }}>
              <div
                style={{
                  height: '12px',
                  width: `${progress}%`,
                  position: 'relative',
                  background: 'linear-gradient(90deg, #8b5cf6, #8b5cf6)',
                  borderRadius: '24px',
                  transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div style={{
          marginBottom: 'clamp(32px, 6vw, 48px)',
          perspective: '1000px',
        }}>
          <div
            style={{
              position: 'relative',
              minHeight: 'clamp(320px, 60vw, 480px)',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.7s',
              cursor: 'pointer',
            }}
            onClick={handleFlip}
          >
            {/* Front of card */}
            <div
              style={{
                position: 'absolute',
                inset: '0',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                overflow: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Scrollable Content Container */}
              <div style={{
                position: 'relative',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: 'clamp(32px, 6vw, 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  textAlign: 'center',
                  width: '100%',
                }}>
                  <h2 style={{
                    fontSize: 'clamp(24px, 6vw, 40px)',
                    fontWeight: 'bold',
                    letterSpacing: '-0.025em',
                    lineHeight: '1.2',
                    marginBottom: 'clamp(20px, 3vw, 32px)',
                    color: '#e5e5e5',
                  }}>{currentCard.term}</h2>
                  <p style={{
                    fontSize: 'clamp(16px, 3.5vw, 20px)',
                    fontWeight: '300',
                    letterSpacing: '-0.025em',
                    color: '#a8a8a8',
                  }}>Click to reveal definition</p>
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 'clamp(16px, 2.5vw, 24px)',
                left: '50%',
                transform: 'translateX(-50%)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#a8a8a8',
                }}>
                  <svg
                    style={{
                      width: '24px',
                      height: '24px',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span style={{
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    letterSpacing: '-0.025em',
                    fontWeight: '500',
                  }}>Flip</span>
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div
              style={{
                position: 'absolute',
                inset: '0',
                backgroundColor: '#0f0f0f',
                borderRadius: '24px',
                boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919, 0 0 40px rgba(139, 92, 246, 0.3)',
                overflow: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Scrollable Content Container */}
              <div style={{
                position: 'relative',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: 'clamp(32px, 6vw, 64px)',
                display: 'flex',
                alignItems: 'start',
              }}>
                <div style={{
                  textAlign: 'left',
                  width: '100%',
                  margin: 'auto 0',
                }}>
                  <p style={{
                    fontSize: 'clamp(16px, 4vw, 22px)',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    color: '#e5e5e5',
                    letterSpacing: '-0.025em',
                    fontWeight: '300',
                  }}>{currentCard.definition}</p>
                  {currentCard.imageUrl && (
                    <div style={{ marginTop: '32px' }}>
                      <img
                        src={currentCard.imageUrl}
                        alt="Flashcard visual"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageEnlarged(true);
                        }}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '256px',
                          margin: '0 auto',
                          borderRadius: '24px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'block',
                          boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                        }}
                        title="Click to enlarge"
                      />
                      <p style={{
                        fontSize: '14px',
                        color: '#a8a8a8',
                        marginTop: '12px',
                        textAlign: 'center',
                        letterSpacing: '-0.025em',
                      }}>Click image to enlarge</p>
                    </div>
                  )}
                  {currentCard.context && (
                    <div style={{
                      marginTop: 'clamp(20px, 3vw, 32px)',
                      paddingTop: 'clamp(20px, 3vw, 32px)',
                      borderTop: '1px solid #191919',
                    }}>
                      <p style={{
                        fontSize: 'clamp(14px, 3.5vw, 18px)',
                        color: '#a8a8a8',
                        fontStyle: 'italic',
                        whiteSpace: 'pre-wrap',
                        letterSpacing: '-0.025em',
                        fontWeight: '300',
                      }}>{currentCard.context}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer Buttons - Show when flipped */}
        {isFlipped && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'clamp(16px, 2.5vw, 24px)',
            marginBottom: 'clamp(32px, 6vw, 48px)',
          }}>
            {/* Again Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => handleAnswer('again')}
                disabled={answering}
                style={{
                  position: 'relative',
                  width: '100%',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  color: '#e5e5e5',
                  padding: 'clamp(20px, 3vw, 28px) clamp(16px, 2.5vw, 24px)',
                  fontWeight: 'bold',
                  minHeight: 'clamp(60px, 10vw, 72px)',
                  border: 'none',
                  cursor: answering ? 'not-allowed' : 'pointer',
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: 'clamp(16px, 3.5vw, 20px)',
                  letterSpacing: '-0.025em',
                  opacity: answering ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 20px rgba(244, 63, 94, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                  }
                }}
              >
                Again
              </button>
            </div>

            {/* Hard Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => handleAnswer('hard')}
                disabled={answering}
                style={{
                  position: 'relative',
                  width: '100%',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  color: '#e5e5e5',
                  padding: 'clamp(20px, 3vw, 28px) clamp(16px, 2.5vw, 24px)',
                  fontWeight: 'bold',
                  minHeight: 'clamp(60px, 10vw, 72px)',
                  border: 'none',
                  cursor: answering ? 'not-allowed' : 'pointer',
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: 'clamp(16px, 3.5vw, 20px)',
                  letterSpacing: '-0.025em',
                  opacity: answering ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 20px rgba(245, 158, 11, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                  }
                }}
              >
                Hard
              </button>
            </div>

            {/* Good Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => handleAnswer('good')}
                disabled={answering}
                style={{
                  position: 'relative',
                  width: '100%',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  color: '#e5e5e5',
                  padding: 'clamp(20px, 3vw, 28px) clamp(16px, 2.5vw, 24px)',
                  fontWeight: 'bold',
                  minHeight: 'clamp(60px, 10vw, 72px)',
                  border: 'none',
                  cursor: answering ? 'not-allowed' : 'pointer',
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: 'clamp(16px, 3.5vw, 20px)',
                  letterSpacing: '-0.025em',
                  opacity: answering ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 20px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                  }
                }}
              >
                Good
              </button>
            </div>

            {/* Easy Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => handleAnswer('easy')}
                disabled={answering}
                style={{
                  position: 'relative',
                  width: '100%',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '16px',
                  color: '#e5e5e5',
                  padding: 'clamp(20px, 3vw, 28px) clamp(16px, 2.5vw, 24px)',
                  fontWeight: 'bold',
                  minHeight: 'clamp(60px, 10vw, 72px)',
                  border: 'none',
                  cursor: answering ? 'not-allowed' : 'pointer',
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: 'clamp(16px, 3.5vw, 20px)',
                  letterSpacing: '-0.025em',
                  opacity: answering ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 20px rgba(6, 182, 212, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answering) {
                    e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                  }
                }}
              >
                Easy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {imageEnlarged && currentCard?.imageUrl && (
        <div
          style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '24px',
          }}
          onClick={() => setImageEnlarged(false)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '1280px',
            maxHeight: '100%',
          }}>
            <button
              onClick={() => setImageEnlarged(false)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                backgroundColor: '#0f0f0f',
                color: '#e5e5e5',
                padding: '20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              title="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 20px rgba(244, 63, 94, 0.5)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div style={{
              position: 'relative',
              backgroundColor: '#0f0f0f',
              padding: '32px',
              borderRadius: '24px',
              boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
              overflow: 'hidden',
            }}>
              <img
                src={currentCard.imageUrl}
                alt="Enlarged flashcard visual"
                style={{
                  position: 'relative',
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  borderRadius: '24px',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .flashcard-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .flashcard-scroll::-webkit-scrollbar-track {
          background: #0f0f0f;
          border-radius: 24px;
        }
        .flashcard-scroll::-webkit-scrollbar-thumb {
          background: #191919;
          border-radius: 24px;
        }
        .flashcard-scroll::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6;
        }
      `}</style>
    </div>
  );
}
