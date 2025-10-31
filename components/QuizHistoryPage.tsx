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

      <div className="content-wrapper">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span style={{ display: 'block' }}>
                Quiz
              </span>
              <span style={{ display: 'block', color: '#06b6d4' }}>
                History
              </span>
            </h1>
            <p className="hero-subtitle">
              View all your past quizzes
            </p>
          </div>
        </section>

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
                    className="quiz-card"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '13px 13px 26px #050505, -13px -13px 26px #191919';
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
                      className="delete-button"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                      }}
                      title="Delete quiz"
                    >
                      <svg className="delete-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="quiz-card-content">
                      <div>
                        <div className="quiz-date">
                          {formattedDate} • {formattedTime}
                        </div>
                        <div className="quiz-info">
                          <div>
                            <span className="quiz-questions-count">{quiz.questions.length} questions</span>
                            {isIncomplete && (
                              <span className="incomplete-badge">
                                Incomplete
                              </span>
                            )}
                          </div>
                          <div className="quiz-time">
                            Time: {timeDisplay}
                          </div>
                        </div>
                      </div>
                      <div className="quiz-score-section">
                        <div className="quiz-score">
                          {quiz.score}/{quiz.questions.length}
                        </div>
                        <div className="quiz-percentage">
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
          <div className="empty-state">
            <div style={{ position: 'relative' }}>
              <p className="empty-state-text">
                No quizzes taken yet
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Mobile-first responsive styles */
        .content-wrapper {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 48px);
        }

        .hero-section {
          text-align: center;
          margin-bottom: clamp(24px, 4vw, 32px);
        }

        .hero-content {
          max-width: 1024px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: clamp(20px, 4vw, 32px);
        }

        .hero-title {
          font-size: clamp(48px, 12vw, 144px);
          font-weight: bold;
          letter-spacing: -0.05em;
          line-height: 0.95;
          color: #e5e5e5;
        }

        .hero-subtitle {
          font-size: clamp(18px, 3vw, 32px);
          font-weight: 300;
          max-width: 768px;
          margin: 0 auto;
          line-height: 1.5;
          color: #a8a8a8;
        }

        .back-button {
          padding: clamp(12px, 2vw, 16px) clamp(20px, 3vw, 32px);
          font-size: clamp(16px, 2vw, 20px);
          font-weight: bold;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #0f0f0f;
          border-radius: 16px;
          border: none;
          color: #e5e5e5;
          cursor: pointer;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .quiz-card {
          position: relative;
          width: 100%;
          padding: clamp(24px, 4vw, 40px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          background: #0f0f0f;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          transform: translateY(0);
        }

        .delete-button {
          position: absolute;
          top: clamp(12px, 2vw, 16px);
          right: clamp(12px, 2vw, 16px);
          z-index: 10;
          padding: clamp(8px, 1.5vw, 12px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #0f0f0f;
          border-radius: 16px;
          border: 2px solid #f43f5e;
          cursor: pointer;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .delete-icon {
          width: clamp(16px, 2.5vw, 20px);
          height: clamp(16px, 2.5vw, 20px);
          color: #f43f5e;
        }

        .quiz-card-content {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-right: clamp(32px, 5vw, 48px);
          flex-wrap: wrap;
          gap: clamp(16px, 3vw, 24px);
        }

        .quiz-date {
          font-size: clamp(14px, 2vw, 20px);
          color: #a8a8a8;
        }

        .quiz-info {
          font-size: clamp(14px, 2vw, 20px);
          margin-top: clamp(12px, 2vw, 16px);
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.5vw, 12px);
        }

        .quiz-questions-count {
          color: #e5e5e5;
          font-weight: 500;
        }

        .incomplete-badge {
          margin-left: clamp(8px, 2vw, 16px);
          font-size: clamp(12px, 1.8vw, 16px);
          padding: clamp(6px, 1.2vw, 8px) clamp(12px, 2vw, 16px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
          background: #0f0f0f;
          color: #f59e0b;
          border: 2px solid #f59e0b;
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
          display: inline-block;
        }

        .quiz-time {
          color: #a8a8a8;
        }

        .quiz-score-section {
          text-align: right;
        }

        .quiz-score {
          font-size: clamp(32px, 6vw, 56px);
          font-weight: bold;
          color: #06b6d4;
        }

        .quiz-percentage {
          font-size: clamp(16px, 2.5vw, 24px);
          color: #a8a8a8;
          margin-top: clamp(4px, 1vw, 8px);
        }

        .empty-state {
          position: relative;
          padding: clamp(40px, 6vw, 64px);
          margin-bottom: clamp(32px, 5vw, 48px);
          background: #0f0f0f;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          text-align: center;
        }

        .empty-state-text {
          font-size: clamp(20px, 3.5vw, 32px);
          color: #a8a8a8;
        }

        /* Tablet (768px+) */
        @media (min-width: 768px) {
          .quiz-card-content {
            flex-wrap: nowrap;
          }
        }

        /* 4K (1920px+) */
        @media (min-width: 1920px) {
          .content-wrapper {
            max-width: 1600px;
          }
        }
      `}</style>
    </div>
  );
}
