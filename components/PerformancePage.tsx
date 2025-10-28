'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import PerformanceGraphs from './PerformanceGraphs';
import { UserProgress } from '@/lib/types';
import Header from './Header';

// Generate dynamic insights based on actual performance
function generatePerformanceInsights(userProgress: UserProgress | null, estimatedAbility: number): string[] {
  if (!userProgress || !userProgress.quizHistory || userProgress.quizHistory.length === 0) {
    return ['Not enough data yet - take more quizzes for personalized insights'];
  }

  const insights: string[] = [];

  // Collect all attempts
  const allAttempts = userProgress.quizHistory.flatMap(quiz => quiz.questions);

  if (allAttempts.length === 0) return ['No question attempts found'];

  // Analyze by difficulty
  const byDifficulty = {
    easy: { total: 0, correct: 0, points: 0, maxPoints: 0 },
    medium: { total: 0, correct: 0, points: 0, maxPoints: 0 },
    hard: { total: 0, correct: 0, points: 0, maxPoints: 0 },
  };

  // Analyze by category
  const byCategory = {
    'single-domain-single-topic': { total: 0, correct: 0, points: 0, maxPoints: 0 },
    'single-domain-multiple-topics': { total: 0, correct: 0, points: 0, maxPoints: 0 },
    'multiple-domains-multiple-topics': { total: 0, correct: 0, points: 0, maxPoints: 0 },
  };

  // Analyze by type
  const byType = {
    single: { total: 0, correct: 0 },
    multiple: { total: 0, correct: 0, partialCredit: 0 },
  };

  // Domain performance
  const domainPerformance: { [domain: string]: { correct: number; total: number } } = {};

  allAttempts.forEach(attempt => {
    const q = attempt.question;
    const difficulty = q.difficulty || 'medium';
    const category = q.questionCategory || 'single-domain-single-topic';
    const type = q.questionType || 'single';

    // Track by difficulty
    byDifficulty[difficulty].total++;
    if (attempt.isCorrect) byDifficulty[difficulty].correct++;
    byDifficulty[difficulty].points += attempt.pointsEarned;
    byDifficulty[difficulty].maxPoints += attempt.maxPoints;

    // Track by category
    byCategory[category].total++;
    if (attempt.isCorrect) byCategory[category].correct++;
    byCategory[category].points += attempt.pointsEarned;
    byCategory[category].maxPoints += attempt.maxPoints;

    // Track by type
    byType[type].total++;
    if (attempt.isCorrect) byType[type].correct++;
    if (type === 'multiple' && attempt.pointsEarned > 0 && attempt.pointsEarned < attempt.maxPoints) {
      byType[type].partialCredit++;
    }

    // Track by domain
    q.topics?.forEach((topic: string) => {
      // Extract domain from topic (this is simplified - you may need better domain extraction)
      const domainMatch = topic.match(/^\d+\.\d+\s+(.+)$/);
      const domain = domainMatch ? domainMatch[1] : 'Unknown';

      if (!domainPerformance[domain]) {
        domainPerformance[domain] = { correct: 0, total: 0 };
      }
      domainPerformance[domain].total++;
      if (attempt.isCorrect) domainPerformance[domain].correct++;
    });
  });

  // Generate insights based on analysis

  // 1. Difficulty Performance Insight
  const difficultyInsight = [];
  for (const [diff, stats] of Object.entries(byDifficulty)) {
    if (stats.total > 0) {
      const acc = ((stats.correct / stats.total) * 100).toFixed(0);
      difficultyInsight.push(`${diff}: ${acc}%`);
    }
  }
  if (difficultyInsight.length > 0) {
    insights.push(`Accuracy by difficulty: ${difficultyInsight.join(', ')}`);
  }

  // 2. Strength/Weakness by Difficulty
  if (byDifficulty.easy.total >= 3 && byDifficulty.easy.correct / byDifficulty.easy.total < 0.7) {
    insights.push('Struggling with easy questions - review fundamental concepts');
  } else if (byDifficulty.hard.total >= 3 && byDifficulty.hard.correct / byDifficulty.hard.total >= 0.75) {
    insights.push('Strong performance on hard questions - excellent mastery');
  } else if (byDifficulty.medium.total >= 5 && byDifficulty.medium.correct / byDifficulty.medium.total >= 0.8) {
    insights.push('Solid grasp of medium difficulty concepts');
  }

  // 3. Category Performance Insight
  const multiDomain = byCategory['multiple-domains-multiple-topics'];
  if (multiDomain.total >= 3) {
    const acc = (multiDomain.correct / multiDomain.total) * 100;
    if (acc >= 75) {
      insights.push(`Excelling at cross-domain synthesis (${acc.toFixed(0)}% accuracy)`);
    } else if (acc < 50) {
      insights.push(`Improve cross-domain integration (currently ${acc.toFixed(0)}%)`);
    }
  }

  const multiTopic = byCategory['single-domain-multiple-topics'];
  if (multiTopic.total >= 3) {
    const acc = (multiTopic.correct / multiTopic.total) * 100;
    if (acc < 60) {
      insights.push(`Focus on connecting multiple concepts within domains (${acc.toFixed(0)}%)`);
    }
  }

  // 4. Question Type Performance
  if (byType.multiple.total >= 3) {
    const multiAcc = ((byType.multiple.correct / byType.multiple.total) * 100).toFixed(0);
    if (byType.multiple.partialCredit > 0) {
      insights.push(`Partial credit earned on ${byType.multiple.partialCredit} multi-select questions - review all correct options`);
    }
    if (byType.multiple.correct / byType.multiple.total < 0.6) {
      insights.push(`Multi-select questions need work (${multiAcc}%) - practice "select all that apply"`);
    }
  }

  // 5. Recent Performance Trend (last 3 quizzes)
  if (userProgress.quizHistory.length >= 3) {
    const recentQuizzes = userProgress.quizHistory.slice(-3);
    const recentAccuracies = recentQuizzes.map(quiz =>
      quiz.questions.length > 0 ? (quiz.questions.filter(q => q.isCorrect).length / quiz.questions.length) * 100 : 0
    );
    const avgRecent = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;

    if (recentAccuracies.length === 3) {
      if (recentAccuracies[2] > recentAccuracies[0] + 10) {
        insights.push('Improving trend - keep up the momentum!');
      } else if (recentAccuracies[2] < recentAccuracies[0] - 10) {
        insights.push('Recent dip in performance - consider reviewing recent topics');
      }
    }
  }

  // 6. Overall recommendation based on ability
  if (estimatedAbility >= 1.5) {
    insights.push('Exam-ready performance - consider scheduling your test');
  } else if (estimatedAbility >= 1.0) {
    insights.push('On track for passing - continue building confidence');
  } else if (estimatedAbility >= 0) {
    insights.push('Moderate understanding - increase practice volume');
  } else {
    insights.push('Focus on fundamentals - start with easier questions');
  }

  return insights.length > 0 ? insights : ['Continue taking quizzes for more detailed insights'];
}

export default function QuizPerformance() {
  const { user, userProgress, predictedScore, loading, resetProgress, liquidGlass } = useApp();
  const router = useRouter();
  const [irtExpanded, setIrtExpanded] = useState(false);
  const [recentQuizzesExpanded, setRecentQuizzesExpanded] = useState(false);
  const [showReliabilityTooltip, setShowReliabilityTooltip] = useState(false);
  const [tooltipDismissTimeout, setTooltipDismissTimeout] = useState<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Handle reliability tooltip hover
  const handleReliabilityHover = () => {
    setShowReliabilityTooltip(true);

    // Clear any existing timeout
    if (tooltipDismissTimeout) {
      clearTimeout(tooltipDismissTimeout);
    }

    // Set new timeout to auto-dismiss after 5 seconds
    const timeout = setTimeout(() => {
      setShowReliabilityTooltip(false);
    }, 5000);

    setTooltipDismissTimeout(timeout);
  };

  const handleReliabilityLeave = () => {
    // Clear timeout when user moves away
    if (tooltipDismissTimeout) {
      clearTimeout(tooltipDismissTimeout);
      setTooltipDismissTimeout(null);
    }
    setShowReliabilityTooltip(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipDismissTimeout) {
        clearTimeout(tooltipDismissTimeout);
      }
    };
  }, [tooltipDismissTimeout]);

  const handleResetProgress = async () => {
    console.log('[DEBUG] Reset button clicked');

    const confirmed = confirm('Are you sure you want to reset your quiz progress? This cannot be undone.');
    console.log('[DEBUG] User confirmed:', confirmed);

    if (confirmed) {
      try {
        console.log('[DEBUG] Starting reset progress...');
        console.log('[DEBUG] Current user ID:', user?.uid);
        console.log('[DEBUG] Current progress:', userProgress);

        await resetProgress();

        console.log('[DEBUG] Reset progress completed successfully');
        alert('Progress reset successfully! The page will now reload.');

        // Force a page reload to ensure UI updates
        console.log('[DEBUG] Reloading page...');
        window.location.reload();
      } catch (error) {
        console.error('[ERROR] Failed to reset progress:', error);
        alert(`Failed to reset progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('[DEBUG] Reset cancelled by user');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        <div className="relative text-center">
          <div className={`animate-spin rounded-2xl h-32 w-32 md:h-40 md:w-40 border-4 ${liquidGlass ? 'border-white/10 border-t-cyan-400/80' : 'border-zinc-800 border-t-blue-500'} mx-auto`}></div>
          <p className={`mt-8 text-2xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-400 font-mono'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  const totalAnswered = userProgress?.totalQuestions || 0;
  const correctAnswers = userProgress?.correctAnswers || 0;
  const estimatedAbility = userProgress?.estimatedAbility || 0;
  const accuracy = totalAnswered > 0 ? ((correctAnswers / totalAnswered) * 100).toFixed(1) : 0;

  // Minimum questions needed for reliable IRT prediction
  const MIN_QUESTIONS_FOR_PREDICTION = 10;
  const hasEnoughQuestions = totalAnswered >= MIN_QUESTIONS_FOR_PREDICTION;
  const questionsNeeded = MIN_QUESTIONS_FOR_PREDICTION - totalAnswered;

  // Reliability tier based on question count
  const getReliabilityInfo = () => {
    if (totalAnswered >= 50) return { label: 'High reliability', sublabel: 'Very stable predictions', color: 'emerald' };
    if (totalAnswered >= 30) return { label: 'Good reliability', sublabel: 'Stable estimates', color: 'cyan' };
    if (totalAnswered >= 20) return { label: 'Moderate reliability', sublabel: 'Reasonable confidence', color: 'yellow' };
    if (totalAnswered >= 10) return { label: 'Basic estimate', sublabel: 'High uncertainty', color: 'orange' };
    return { label: 'Insufficient', sublabel: 'Not enough data', color: 'zinc' };
  };
  const reliabilityInfo = getReliabilityInfo();

  // Color logic based on Ability Level (matches IRT progress bar)
  const isGoodPerformance = estimatedAbility >= 1.0;
  const isNeedsWork = estimatedAbility < -1.0;

  return (
    <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black font-mono'}`}>
      {/* Animated Background Gradients */}
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-16">
          <Header showBackButton backButtonPath="/cybersecurity/quiz" backButtonLabel="Back to Quiz" className="mb-12" />

          {/* Hero Section - Apple Style */}
          <section className="text-center">
            <div className="max-w-5xl mx-auto space-y-8">
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95]">
                <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                  Your
                </span>
                <span className="block bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  Performance
                </span>
              </h1>
              <p className={`text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Track your progress and master Security+
              </p>
            </div>
          </section>
        </header>

        {/* Predicted Score Card */}
        <div className={`relative p-12 md:p-16 mb-12 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl' : 'bg-black border border-zinc-800 rounded-md'} transition-all duration-700`}>
          {/* Light reflection */}
          {liquidGlass && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
          )}

          <div className="relative text-center mb-10">
            <h2 className={`text-3xl md:text-4xl text-white mb-2 tracking-tight font-bold ${liquidGlass ? '' : 'font-mono'}`}>Predicted Exam Score</h2>
            <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-600' : 'text-zinc-700 font-mono'} mb-8 flex items-center justify-center gap-2 flex-wrap`}>
              <span>Based on {totalAnswered} question{totalAnswered !== 1 ? 's' : ''}</span>
              <span className="text-zinc-700">•</span>
              <span
                className={`relative text-xs font-semibold cursor-help ${
                  reliabilityInfo.color === 'emerald' ? 'text-emerald-500' :
                  reliabilityInfo.color === 'cyan' ? 'text-cyan-500' :
                  reliabilityInfo.color === 'yellow' ? 'text-yellow-500' :
                  'text-orange-500'
                }`}
                onMouseEnter={handleReliabilityHover}
                onMouseLeave={handleReliabilityLeave}
              >
                {reliabilityInfo.label}

                {/* Tooltip */}
                {showReliabilityTooltip && (
                  <div className={`absolute left-1/2 transform -translate-x-1/2 bottom-full mb-3 w-80 ${liquidGlass ? 'bg-zinc-950/95 backdrop-blur-2xl rounded-[32px] border-white/20 shadow-2xl' : 'bg-zinc-900 rounded-2xl border-zinc-800'} border p-6 z-50 transition-all duration-700`}>
                    {/* Light reflection overlay */}
                    {liquidGlass && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] pointer-events-none" />
                    )}

                    <div className="relative">
                      <h4 className={`text-base font-bold text-white mb-4 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>
                        Prediction Reliability Tiers
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <span className="text-emerald-400 font-bold min-w-[90px]">50+ questions:</span>
                          <span className={`${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed ${liquidGlass ? '' : 'font-mono'}`}>High reliability - Very stable predictions</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-cyan-400 font-bold min-w-[90px]">30-50 questions:</span>
                          <span className={`${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed ${liquidGlass ? '' : 'font-mono'}`}>Good reliability - Stable estimates</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-yellow-400 font-bold min-w-[90px]">20-30 questions:</span>
                          <span className={`${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed ${liquidGlass ? '' : 'font-mono'}`}>Moderate reliability - Reasonable confidence</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-orange-400 font-bold min-w-[90px]">10-19 questions:</span>
                          <span className={`${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed ${liquidGlass ? '' : 'font-mono'}`}>Basic estimate - High uncertainty</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </span>
            </p>

            {hasEnoughQuestions ? (
              <>
                <div className="relative group cursor-help inline-block">
                  <div className={`text-8xl md:text-9xl font-bold mb-6 transition-all duration-700 ${
                    totalAnswered === 0 ? 'text-zinc-400' :
                    isGoodPerformance ? 'text-emerald-400' :
                    isNeedsWork ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {predictedScore}
                  </div>
                  {/* Hover tooltip */}
                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 ${liquidGlass ? 'bg-zinc-950/95 backdrop-blur-2xl rounded-[32px] border-white/20 shadow-2xl' : 'bg-zinc-900 rounded-2xl border-zinc-800'} border p-6 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-700`}>
                    {/* Light reflection overlay */}
                    {liquidGlass && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] pointer-events-none" />
                    )}

                    <div className="relative">
                      <h4 className={`text-base font-bold text-white mb-4 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>
                        Score Color Ranges
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 font-bold">Green</span>
                          <span className={`${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} ${liquidGlass ? '' : 'font-mono'}`}>750 - 900</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-400 font-bold">Yellow</span>
                          <span className={`${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} ${liquidGlass ? '' : 'font-mono'}`}>600 - 749</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-red-400 font-bold">Red</span>
                          <span className={`${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} ${liquidGlass ? '' : 'font-mono'}`}>100 - 599</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`text-xl md:text-2xl text-zinc-500 mb-8 ${liquidGlass ? '' : 'font-mono'}`}>out of 900</div>
                <div>
                  {totalAnswered > 0 ? (
                    <div className={`inline-block px-10 py-4 text-xl md:text-2xl font-bold transition-all duration-700 ${
                      isGoodPerformance
                        ? liquidGlass
                          ? 'bg-emerald-500/20 backdrop-blur-xl text-emerald-300 border border-emerald-500/50 rounded-3xl'
                          : 'bg-black text-emerald-400 border border-emerald-500/50 rounded-md font-mono'
                        : isNeedsWork
                          ? liquidGlass
                            ? 'bg-red-500/20 backdrop-blur-xl text-red-300 border border-red-500/50 rounded-3xl'
                            : 'bg-black text-red-400 border border-red-500/50 rounded-md font-mono'
                          : liquidGlass
                            ? 'bg-yellow-500/20 backdrop-blur-xl text-yellow-300 border border-yellow-500/50 rounded-3xl'
                            : 'bg-black text-yellow-400 border border-yellow-500/50 rounded-md font-mono'
                    }`}>
                      {isGoodPerformance ? 'On track to pass' :
                       isNeedsWork ? 'Needs significant improvement' :
                       'More practice needed'}
                    </div>
                  ) : (
                    <div className={`text-zinc-500 text-xl ${liquidGlass ? '' : 'font-mono'}`}>Start answering questions to see your prediction</div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className={`relative p-8 ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-900 rounded-2xl border border-zinc-800'}`}>
                  {liquidGlass && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                  )}
                  <div className="relative">
                    <svg className="w-16 h-16 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                    <h3 className={`text-2xl md:text-3xl font-bold text-white mb-3 ${liquidGlass ? '' : 'font-mono'}`}>
                      Insufficient Data
                    </h3>
                    <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'} mb-4`}>
                      {totalAnswered === 0 ? (
                        <>Start answering questions to generate your predicted score</>
                      ) : (
                        <>Answer <span className="text-cyan-400 font-bold">{questionsNeeded} more</span> {questionsNeeded === 1 ? 'question' : 'questions'} for a reliable IRT prediction</>
                      )}
                    </p>
                    <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-600' : 'text-zinc-700 font-mono'}`}>
                      Minimum {MIN_QUESTIONS_FOR_PREDICTION} questions required for accurate analysis
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative mt-12">
            <div className={`w-full h-6 relative overflow-hidden ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl' : 'bg-zinc-900 border border-zinc-800 rounded-md'}`}>
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl" />}
              {/* Progress bar fill - only show if enough questions answered */}
              {hasEnoughQuestions && (
                <div
                  className={`h-6 relative transition-all duration-700 ${
                    isGoodPerformance
                      ? liquidGlass
                        ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 rounded-2xl'
                        : 'bg-emerald-500 rounded-md'
                    : isNeedsWork
                      ? liquidGlass
                        ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-600 rounded-2xl'
                        : 'bg-red-500 rounded-md'
                    : liquidGlass
                      ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 rounded-2xl'
                      : 'bg-yellow-500 rounded-md'
                  }`}
                  style={{ width: `${Math.min(((predictedScore - 100) / 800) * 100, 100)}%` }}
                >
                  {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" />}
                </div>
              )}

              {/* Passing line marker at 750 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white opacity-50"
                style={{ left: `${((750 - 100) / 800) * 100}%` }}
              ></div>
            </div>

            {/* Scale labels */}
            <div className={`flex justify-between text-sm text-zinc-400 mt-2 relative ${liquidGlass ? '' : 'font-mono'}`}>
              <span>100</span>
              <span
                className="absolute text-white font-medium"
                style={{ left: `${((750 - 100) / 800) * 100}%`, transform: 'translateX(-50%)' }}
              >
                750
              </span>
              <span>900</span>
            </div>

            {/* Current score indicator - only show if enough questions answered */}
            {hasEnoughQuestions && predictedScore >= 100 && predictedScore <= 900 && (
              <div className="relative mt-2">
                <div
                  className={`absolute px-3 py-1 ${liquidGlass ? 'rounded-2xl' : 'rounded-md'} text-sm font-medium ${liquidGlass ? 'transition-all duration-500' : 'transition-all duration-150 font-mono'} ${
                    isGoodPerformance ? 'bg-black text-emerald-400 border border-emerald-500/50' :
                    isNeedsWork ? 'bg-black text-red-400 border border-red-500/50' :
                    'bg-black text-yellow-400 border border-yellow-500/50'
                  }`}
                  style={{ left: `${((predictedScore - 100) / 800) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {predictedScore}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className={`relative p-10 md:p-12 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-white/30 rounded-[40px] hover:shadow-2xl hover:shadow-white/10' : 'bg-black border border-zinc-800 hover:border-zinc-700 rounded-md'}`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative">
              <div className={`text-zinc-400 text-xl md:text-2xl mb-4 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Questions Attempted</div>
              <div className={`text-5xl md:text-6xl font-bold transition-all duration-700 ${totalAnswered === 0 ? 'text-zinc-400' : 'text-white'}`}>{totalAnswered}</div>
            </div>
          </div>
          <div className={`relative p-10 md:p-12 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-white/30 rounded-[40px] hover:shadow-2xl hover:shadow-white/10' : 'bg-black border border-zinc-800 hover:border-zinc-700 rounded-md'}`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative">
              <div className={`text-zinc-400 text-xl md:text-2xl mb-4 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Correct Answers</div>
              <div className={`text-5xl md:text-6xl font-bold transition-all duration-700 ${
                totalAnswered === 0 ? 'text-zinc-400' :
                isGoodPerformance ? 'text-emerald-400' :
                isNeedsWork ? 'text-red-400' :
                'text-yellow-400'
              }`}>{correctAnswers}</div>
            </div>
          </div>
          <div className={`relative p-10 md:p-12 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-white/30 rounded-[40px] hover:shadow-2xl hover:shadow-white/10' : 'bg-black border border-zinc-800 hover:border-zinc-700 rounded-md'}`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative">
              <div className={`text-zinc-400 text-xl md:text-2xl mb-4 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Accuracy</div>
              <div className={`text-5xl md:text-6xl font-bold transition-all duration-700 ${
                totalAnswered === 0 ? 'text-zinc-400' :
                isGoodPerformance ? 'text-emerald-400' :
                isNeedsWork ? 'text-red-400' :
                'text-yellow-400'
              }`}>{accuracy}%</div>
            </div>
          </div>
        </div>

        {/* IRT Score Analysis - Collapsible */}
        {totalAnswered > 0 && (
          <div className={`relative p-10 md:p-12 mb-12 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl' : 'bg-black border border-zinc-800 rounded-md'}`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative flex items-center justify-between">
              <h3 className={`text-3xl md:text-4xl font-bold text-white tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>IRT Performance Analysis</h3>
              <button
                id="toggle-irt"
                onClick={() => setIrtExpanded(!irtExpanded)}
                className={`p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-700 ${liquidGlass ? 'rounded-3xl' : 'rounded-md'}`}
                aria-label="Toggle IRT Performance Analysis"
              >
                <svg
                  className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${irtExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {irtExpanded ? (
              <>
                <div className={`relative p-8 md:p-10 mb-8 mt-8 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl' : 'bg-black border border-zinc-800 rounded-md'}`}>
                  {liquidGlass && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
                  )}
                  <div className="relative flex items-center justify-between mb-6">
                    <div className="relative group cursor-help">
                      <h4 className={`text-2xl md:text-3xl font-bold text-white tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Ability Level</h4>
                      {/* Hover tooltip */}
                      <div className={`absolute bottom-full left-0 mb-2 w-80 transition-opacity duration-700 ${liquidGlass ? 'bg-black/80 backdrop-blur-xl border-white/20 rounded-3xl' : 'bg-black border-zinc-800 rounded-md'} border p-4 z-50 pointer-events-none opacity-0 group-hover:opacity-100`}>
                        <p className={`text-base text-zinc-300 leading-relaxed ${liquidGlass ? '' : 'font-mono'}`}>Your skill level adjusted for question difficulty. Higher scores mean you answered harder questions correctly. Range: -3 (beginner) to +3 (expert).</p>
                      </div>
                    </div>
                    <div className={`text-6xl md:text-7xl font-bold transition-all duration-700 ${
                      estimatedAbility >= 1.0 ? 'text-emerald-400' :
                      estimatedAbility >= -1.0 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {estimatedAbility.toFixed(2)}
                    </div>
                  </div>
                  <div className="relative mt-6">
                    <div className={`h-6 relative overflow-hidden ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl' : 'bg-zinc-900 border border-zinc-800 rounded-md'}`}>
                      {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl" />}
                      <div
                        className={`h-6 relative transition-all duration-700 ${
                          estimatedAbility >= 1.0
                            ? liquidGlass
                              ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 rounded-2xl'
                              : 'bg-emerald-500 rounded-md'
                            : estimatedAbility >= -1.0
                              ? liquidGlass
                                ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 rounded-2xl'
                                : 'bg-yellow-500 rounded-md'
                              : liquidGlass
                                ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-600 rounded-2xl'
                                : 'bg-red-500 rounded-md'
                        }`}
                        style={{ width: `${((estimatedAbility + 3) / 6) * 100}%` }}
                      >
                        {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" />}
                      </div>
                    </div>
                    <div className={`flex justify-between text-lg text-zinc-500 mt-3 ${liquidGlass ? '' : 'font-mono'}`}>
                      <span>Beginner</span>
                      <span>Average</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>

                <div className={`relative p-8 md:p-10 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl' : 'bg-black border border-zinc-800 rounded-md'}`}>
                  {liquidGlass && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
                  )}
                  <div className={`relative text-xl text-zinc-300 leading-relaxed ${liquidGlass ? '' : 'font-mono'}`}>
                    <p className={`font-bold mb-6 flex items-center gap-2 text-2xl md:text-3xl ${liquidGlass ? '' : 'font-mono'} ${
                      estimatedAbility >= 1.5 ? 'text-emerald-400' :
                      estimatedAbility >= 1.0 ? 'text-emerald-400' :
                      estimatedAbility >= 0 ? 'text-yellow-400' :
                      estimatedAbility >= -1 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {estimatedAbility >= 1.5 ? 'Excellent Performance!' :
                       estimatedAbility >= 1.0 ? 'Good Performance' :
                       estimatedAbility >= 0 ? 'Average Performance' :
                       estimatedAbility >= -1 ? 'Below Average' :
                       'Needs Improvement'}
                    </p>
                    <ul className="space-y-4 text-lg md:text-xl">
                      {generatePerformanceInsights(userProgress, estimatedAbility).map((insight, index) => (
                        <li key={index} className="flex items-start gap-4">
                          <svg className={`w-5 h-5 mt-1 flex-shrink-0 ${
                            estimatedAbility >= 1.0 ? 'text-cyan-400' :
                            estimatedAbility >= -1 ? 'text-yellow-400' :
                            'text-red-400'
                          }`} fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="3" />
                          </svg>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className={`relative mt-8 text-xl text-zinc-400 ${liquidGlass ? '' : 'font-mono'}`}>
                Click to view detailed IRT analysis
              </div>
            )}
          </div>
        )}

        {/* Performance Graphs Section */}
        {userProgress && userProgress.quizHistory.length > 0 && (
          <div className="mt-16">
            <h2 className={`text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Progress Charts</h2>
            <PerformanceGraphs userProgress={userProgress} />
          </div>
        )}

        {/* Recent Activity - Collapsible */}
        {userProgress && userProgress.quizHistory.length > 0 && (
          <div className={`relative mt-16 p-10 md:p-12 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl' : 'bg-black border border-zinc-800 rounded-md'}`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative flex items-center justify-between">
              <h3 className={`text-3xl md:text-4xl font-bold tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Recent Quizzes ({userProgress.quizHistory.length})</h3>
              <button
                id="toggle-recent-quizzes"
                onClick={() => setRecentQuizzesExpanded(!recentQuizzesExpanded)}
                className={`p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-700 ${liquidGlass ? 'rounded-3xl' : 'rounded-md'}`}
                aria-label="Toggle Recent Quizzes"
              >
                <svg
                  className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${recentQuizzesExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {recentQuizzesExpanded ? (
              <div className="space-y-4 mt-6">
                {userProgress.quizHistory.slice(-5).reverse().map((quiz) => {
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
                    <button
                      key={quiz.id}
                      id={`quiz-review-${quiz.id}`}
                      onClick={() => router.push(`/cybersecurity/quiz/review/${quiz.id}`)}
                      className={`relative w-full p-8 md:p-10 transition-all duration-700 hover:scale-[1.01] cursor-pointer text-left ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-3xl hover:shadow-xl hover:shadow-white/10' : 'bg-black border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-md'}`}
                    >
                      {liquidGlass && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
                      )}
                      <div className="relative flex justify-between items-center">
                        <div>
                          <div className={`text-lg md:text-xl text-zinc-400 ${liquidGlass ? '' : 'font-mono'}`}>
                            {formattedDate} • {formattedTime}
                          </div>
                          <div className="text-lg md:text-xl mt-4 space-y-3">
                            <div>
                              <span className={`text-zinc-300 font-medium ${liquidGlass ? '' : 'font-mono'}`}>{quiz.questions.length} questions</span>
                              {isIncomplete && (
                                <span className={`ml-4 text-base px-4 py-2 transition-all duration-700 ${liquidGlass ? 'rounded-2xl' : 'rounded-md'} bg-black text-yellow-400 border border-yellow-500/50 ${liquidGlass ? '' : 'font-mono'}`}>
                                  Incomplete
                                </span>
                              )}
                            </div>
                            <div className={`text-zinc-400 ${liquidGlass ? '' : 'font-mono'}`}>
                              Time: {timeDisplay}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl md:text-5xl font-bold text-cyan-400 ${liquidGlass ? '' : 'font-mono'}`}>
                            {quiz.score}/{quiz.questions.length}
                          </div>
                          <div className={`text-xl text-zinc-400 mt-2 ${liquidGlass ? '' : 'font-mono'}`}>
                            {((quiz.score / quiz.questions.length) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={`relative mt-8 text-xl text-zinc-400 ${liquidGlass ? '' : 'font-mono'}`}>
                Click to view your last 5 quizzes
              </div>
            )}
          </div>
        )}

        {/* Reset Progress - Destructive Action */}
        {totalAnswered > 0 && (
          <div className="mt-20 text-center pb-20">
            <button
              id="reset-progress"
              onClick={handleResetProgress}
              className={`relative px-12 md:px-16 py-5 md:py-6 text-xl md:text-2xl font-bold transition-all duration-700 ${liquidGlass ? 'bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/50 hover:border-red-500/80 text-red-300 hover:text-red-200 rounded-3xl hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-red-500/30' : 'bg-black hover:bg-zinc-900 text-red-400 border border-red-500/30 hover:border-red-500 rounded-md font-mono'}`}
            >
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-700" />}
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />}
              <span className="relative">Reset Progress</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
