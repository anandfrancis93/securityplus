'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import Header from './Header';
import { authenticatedPost } from '@/lib/apiClient';

export default function QuizHistoryPage() {
  const { user, userProgress, loading, refreshProgress } = useApp();
  const router = useRouter();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await authenticatedPost('/api/delete-quiz', {
        userId: user.uid,
        quizId: quizId,
      });

      // Refresh user progress to reflect the deletion
      await refreshProgress();

      // Close confirmation dialog
      setDeleteConfirmId(null);
      console.log(`[DELETE QUIZ] Successfully deleted quiz ${quizId}`);
    } catch (error) {
      console.error('[DELETE QUIZ] Failed to delete quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f0f0f',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'relative'
        }}>
          {/* Loading card */}
          <div style={{
            background: '#0f0f0f',
            borderRadius: '24px',
            padding: '80px',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
          }}>
            <div style={{
              position: 'relative',
              textAlign: 'center'
            }}>
              {/* Animated spinner */}
              <div style={{
                position: 'relative',
                margin: '0 auto',
                width: '160px',
                height: '160px',
                marginBottom: '32px'
              }}>
                {/* Outer ring with inset shadow */}
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  border: '4px solid #0f0f0f',
                  borderRadius: '50%',
                  boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                }}></div>
                {/* Spinning gradient ring */}
                <div style={{
                  position: 'absolute',
                  inset: '0'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '4px solid transparent',
                    borderTopColor: '#06b6d4',
                    borderRightColor: 'rgba(6, 182, 212, 0.5)',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
                {/* Center icon */}
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '80px', height: '80px', color: '#06b6d4' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                letterSpacing: '-0.025em',
                color: '#e5e5e5'
              }}>
                Loading quiz history...
              </p>
              <p style={{
                fontSize: '18px',
                marginTop: '16px',
                color: '#a8a8a8'
              }}>
                Please wait
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      color: '#e5e5e5',
      position: 'relative',
      overflow: 'hidden',
      background: '#0f0f0f'
    }}>
      {/* Header - Full width */}
      <div style={{
        position: 'relative',
        paddingTop: '32px',
        paddingBottom: '16px'
      }}>
        <Header />
      </div>

      <div style={{
        position: 'relative',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 48px'
      }}>
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            maxWidth: '1024px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
          }}>
            <h1 style={{
              fontSize: '144px',
              fontWeight: 'bold',
              letterSpacing: '-0.05em',
              lineHeight: '0.95',
              color: '#e5e5e5'
            }}>
              <span style={{ display: 'block' }}>
                Quiz
              </span>
              <span style={{ display: 'block', color: '#06b6d4' }}>
                History
              </span>
            </h1>
            <p style={{
              fontSize: '32px',
              fontWeight: '300',
              maxWidth: '768px',
              margin: '0 auto',
              lineHeight: '1.5',
              color: '#a8a8a8'
            }}>
              View all your past quizzes
            </p>
          </div>
        </section>

        {/* Back Button */}
        <div style={{
          marginBottom: '32px'
        }}>
          <button
            onClick={() => router.push('/cybersecurity/performance')}
            style={{
              padding: '16px 32px',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: '#0f0f0f',
              borderRadius: '16px',
              border: 'none',
              color: '#e5e5e5',
              cursor: 'pointer',
              boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
            }}
          >
            ← Back to Performance
          </button>
        </div>

        {/* Quiz History List */}
        {userProgress && userProgress.quizHistory.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            paddingBottom: '48px'
          }}>
            {userProgress.quizHistory.slice().reverse().map((quiz) => {
              const date = new Date(quiz.startedAt);
              const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              // Calculate time taken
              const timeTakenMs = (quiz.endedAt || quiz.startedAt) - quiz.startedAt;
              const timeTakenMinutes = Math.floor(timeTakenMs / 60000);
              const timeTakenSeconds = Math.floor((timeTakenMs % 60000) / 1000);
              const timeDisplay = timeTakenMinutes > 0
                ? `${timeTakenMinutes}m ${timeTakenSeconds}s`
                : `${timeTakenSeconds}s`;

              // Check if quiz is incomplete
              const isIncomplete = quiz.questions.length < 10;

              return (
                <div
                  key={quiz.id}
                  style={{
                    position: 'relative'
                  }}
                >
                  <div
                    onClick={() => router.push(`/cybersecurity/quiz/review/${quiz.id}`)}
                    style={{
                      position: 'relative',
                      width: '100%',
                      padding: '40px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      background: '#0f0f0f',
                      borderRadius: '24px',
                      boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '14px 14px 28px #050505, -14px -14px 28px #191919';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '12px 12px 24px #050505, -12px -12px 24px #191919';
                    }}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(quiz.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        zIndex: 10,
                        padding: '12px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: '#0f0f0f',
                        borderRadius: '16px',
                        border: '2px solid #f43f5e',
                        cursor: 'pointer',
                        boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                      }}
                      title="Delete quiz"
                    >
                      <svg style={{ width: '20px', height: '20px', color: '#f43f5e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingRight: '48px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '20px',
                          color: '#a8a8a8'
                        }}>
                          {formattedDate} • {formattedTime}
                        </div>
                        <div style={{
                          fontSize: '20px',
                          marginTop: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div>
                            <span style={{ color: '#e5e5e5', fontWeight: '500' }}>{quiz.questions.length} questions</span>
                            {isIncomplete && (
                              <span style={{
                                marginLeft: '16px',
                                fontSize: '16px',
                                padding: '8px 16px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderRadius: '12px',
                                background: '#0f0f0f',
                                color: '#f59e0b',
                                border: '2px solid #f59e0b',
                                boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                                display: 'inline-block'
                              }}>
                                Incomplete
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#a8a8a8' }}>
                            Time: {timeDisplay}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '56px',
                          fontWeight: 'bold',
                          color: '#06b6d4'
                        }}>
                          {quiz.score}/{quiz.questions.length}
                        </div>
                        <div style={{
                          fontSize: '24px',
                          color: '#a8a8a8',
                          marginTop: '8px'
                        }}>
                          {((quiz.score / quiz.questions.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirmation Dialog */}
                  {deleteConfirmId === quiz.id && (
                    <div style={{
                      position: 'fixed',
                      inset: '0',
                      background: 'rgba(0, 0, 0, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 50,
                      padding: '16px'
                    }}>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '448px',
                        padding: '40px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: '#0f0f0f',
                        borderRadius: '24px',
                        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
                      }}>
                        <div style={{ position: 'relative' }}>
                          <h3 style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: '#e5e5e5',
                            marginBottom: '16px'
                          }}>Delete Quiz?</h3>
                          <p style={{
                            fontSize: '18px',
                            color: '#a8a8a8',
                            marginBottom: '32px'
                          }}>
                            Are you sure you want to delete this quiz? This will remove all associated data and recalculate your performance metrics. This action cannot be undone.
                          </p>
                          <div style={{
                            display: 'flex',
                            gap: '16px'
                          }}>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              disabled={isDeleting}
                              style={{
                                flex: '1',
                                padding: '16px 24px',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: '#0f0f0f',
                                borderRadius: '16px',
                                border: '2px solid #f43f5e',
                                color: '#f43f5e',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                opacity: isDeleting ? 0.5 : 1,
                                boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                              }}
                              onMouseEnter={(e) => {
                                if (!isDeleting) {
                                  e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isDeleting) {
                                  e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                                }
                              }}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isDeleting}
                              style={{
                                flex: '1',
                                padding: '16px 24px',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: '#0f0f0f',
                                borderRadius: '16px',
                                border: 'none',
                                color: '#e5e5e5',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                opacity: isDeleting ? 0.5 : 1,
                                boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                              }}
                              onMouseEnter={(e) => {
                                if (!isDeleting) {
                                  e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isDeleting) {
                                  e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                                }
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            position: 'relative',
            padding: '64px',
            marginBottom: '48px',
            background: '#0f0f0f',
            borderRadius: '24px',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
            textAlign: 'center'
          }}>
            <div style={{ position: 'relative' }}>
              <p style={{
                fontSize: '32px',
                color: '#a8a8a8'
              }}>
                No quizzes taken yet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
