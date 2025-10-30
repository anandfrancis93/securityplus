'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import PerformanceGraphs from './PerformanceGraphs';
import TopicReviewSchedule from './TopicReviewSchedule';
import { UserProgress } from '@/lib/types';
import Header from './Header';
import { authenticatedPost } from '@/lib/apiClient';
import {
  calculateIRTConfidenceInterval,
  calculateScoreConfidenceInterval,
  wilsonScoreInterval,
  formatConfidenceInterval,
} from '@/lib/confidenceIntervals';

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

  // 2. Weakness by Difficulty
  if (byDifficulty.easy.total >= 3 && byDifficulty.easy.correct / byDifficulty.easy.total < 0.7) {
    insights.push('Struggling with easy questions - review fundamental concepts');
  }
  if (byDifficulty.medium.total >= 5 && byDifficulty.medium.correct / byDifficulty.medium.total < 0.7) {
    insights.push('Medium difficulty questions need more practice');
  }
  if (byDifficulty.hard.total >= 3 && byDifficulty.hard.correct / byDifficulty.hard.total < 0.6) {
    insights.push('Hard questions require deeper understanding - review advanced topics');
  }

  // 3. Category Performance - Areas for Improvement
  const multiDomain = byCategory['multiple-domains-multiple-topics'];
  if (multiDomain.total >= 3) {
    const acc = (multiDomain.correct / multiDomain.total) * 100;
    if (acc < 70) {
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

  // 5. Recent Performance Trend - Areas for Improvement
  if (userProgress.quizHistory.length >= 3) {
    const recentQuizzes = userProgress.quizHistory.slice(-3);
    const recentAccuracies = recentQuizzes.map(quiz =>
      quiz.questions.length > 0 ? (quiz.questions.filter(q => q.isCorrect).length / quiz.questions.length) * 100 : 0
    );
    const avgRecent = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;

    if (recentAccuracies.length === 3) {
      if (recentAccuracies[2] < recentAccuracies[0] - 10) {
        insights.push('Recent dip in performance - consider reviewing recent topics');
      }
    }
  }

  // 6. Recommendations based on ability
  if (estimatedAbility < 1.0 && estimatedAbility >= 0) {
    insights.push('Moderate understanding - increase practice volume');
  } else if (estimatedAbility < 0) {
    insights.push('Focus on fundamentals - start with easier questions');
  }

  return insights.length > 0 ? insights : ['Continue taking quizzes for more detailed insights'];
}

export default function QuizPerformance() {
  const { user, userProgress, predictedScore, loading, resetProgress, liquidGlass, refreshProgress } = useApp();
  const router = useRouter();
  const [irtExpanded, setIrtExpanded] = useState(false);
  const [recentQuizzesExpanded, setRecentQuizzesExpanded] = useState(false);
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
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative">
          {/* Liquid glass card */}
          <div className={`${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl'} p-16 md:p-20 shadow-2xl`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
            )}
            <div className="relative text-center">
              {/* Animated icon */}
              <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-8">
                {/* Outer ring */}
                <div className={`absolute inset-0 ${liquidGlass ? 'border-4 border-white/20 rounded-full' : 'border-4 border-slate-700 rounded-full'}`}></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 animate-spin">
                  <div className={`w-full h-full rounded-full ${liquidGlass ? 'border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50' : 'border-4 border-transparent border-t-cyan-500 border-r-cyan-500/50'}`}></div>
                </div>
                {/* Center icon - graduation cap */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className={`w-16 h-16 md:w-20 md:h-20 ${liquidGlass ? 'text-cyan-400' : 'text-cyan-500'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p className={`text-2xl md:text-3xl font-bold tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>
                Loading performance data...
              </p>
              <p className={`text-base md:text-lg mt-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                Please wait
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalAnswered = userProgress?.totalQuestions || 0;
  const correctAnswers = userProgress?.correctAnswers || 0;
  const totalPoints = userProgress?.totalPoints || 0;
  const maxPossiblePoints = userProgress?.maxPossiblePoints || 0;
  const estimatedAbility = userProgress?.estimatedAbility || 0;
  const abilityStandardError = userProgress?.abilityStandardError || Infinity;
  // Calculate accuracy based on points earned (accounts for partial credit)
  const accuracy = maxPossiblePoints > 0 ? ((totalPoints / maxPossiblePoints) * 100).toFixed(1) : 0;

  // Calculate confidence intervals
  const abilityCI = calculateIRTConfidenceInterval(estimatedAbility, abilityStandardError);
  const scoreCI = calculateScoreConfidenceInterval(abilityCI.lower, abilityCI.upper);
  const accuracyCI = wilsonScoreInterval(correctAnswers, totalAnswered);

  // Debug logging
  console.log('[Performance Page] IRT Data:', {
    totalAnswered,
    estimatedAbility,
    abilityStandardError,
    isFinite: isFinite(abilityStandardError),
    scoreCI,
    showRange: isFinite(abilityStandardError) && totalAnswered >= 1
  });

  // Minimum questions needed for reliable IRT prediction
  const MIN_QUESTIONS_FOR_PREDICTION = 10;
  const hasEnoughQuestions = totalAnswered >= MIN_QUESTIONS_FOR_PREDICTION;
  const questionsNeeded = MIN_QUESTIONS_FOR_PREDICTION - totalAnswered;

  // Confidence level based on CI width
  const getConfidenceInfo = () => {
    if (!isFinite(abilityStandardError) || totalAnswered < 1) {
      return {
        label: 'Insufficient data',
        margin: 0,
        color: 'zinc',
        tooltip: 'Not enough data to calculate confidence interval. Answer more questions for a reliable prediction.'
      };
    }

    const ciWidth = scoreCI.upper - scoreCI.lower;
    const margin = Math.round(ciWidth / 2);

    if (ciWidth <= 50) {
      return { label: 'High confidence', margin, color: 'emerald' };
    } else if (ciWidth <= 100) {
      return { label: 'Medium confidence', margin, color: 'yellow' };
    } else if (ciWidth <= 150) {
      return { label: 'Low confidence', margin, color: 'orange' };
    } else {
      return { label: 'Very low confidence', margin, color: 'red' };
    }
  };
  const confidenceInfo = getConfidenceInfo();

  // Color logic based on predicted score ranges
  // Green: 750-900 (passing), Yellow: 600-749, Red: 100-599
  const isGoodPerformance = predictedScore >= 750;
  const isNeedsWork = predictedScore < 600;

  // Helper function to get color for a specific score
  const getScoreColor = (score: number) => {
    if (score >= 750) return 'emerald';
    if (score >= 600) return 'yellow';
    return 'red';
  };

  const lowerColor = getScoreColor(scoreCI.lower);
  const upperColor = getScoreColor(scoreCI.upper);

  // Helper function to get color for ability level
  const getAbilityColor = (ability: number) => {
    if (ability >= 1.0) return 'emerald';
    if (ability >= -1.0) return 'yellow';
    return 'red';
  };

  const lowerAbilityColor = getAbilityColor(abilityCI.lower);
  const upperAbilityColor = getAbilityColor(abilityCI.upper);

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

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        {/* Hero Section - Apple Style */}
        <section className="text-center mb-8">
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

        {/* Predicted Score Card */}
        <div className={`relative p-12 md:p-16 mb-12 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl' : 'bg-black border border-zinc-800 rounded-md'} transition-all duration-700`}>
          {/* Light reflection */}
          {liquidGlass && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
          )}

          <div className="relative text-center mb-10">
            <h2 className={`text-3xl md:text-4xl text-white mb-2 tracking-tight font-bold ${liquidGlass ? '' : 'font-mono'}`}>Predicted Exam Score</h2>
            <p className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-600' : 'text-zinc-700 font-mono'} mb-8`}>
              Based on {totalAnswered} question{totalAnswered !== 1 ? 's' : ''}
            </p>

            {hasEnoughQuestions ? (
              <>
                <div className="relative group cursor-help">
                  {/* Score Range Display */}
                  {isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                    <>
                      <div className={`text-7xl md:text-8xl font-bold transition-all duration-700 flex items-center justify-center gap-2 sm:gap-4`}>
                        <span className={
                          lowerColor === 'emerald' ? 'text-emerald-400' :
                          lowerColor === 'yellow' ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {scoreCI.lower}
                        </span>
                        <span className="text-zinc-500">-</span>
                        <span className={
                          upperColor === 'emerald' ? 'text-emerald-400' :
                          upperColor === 'yellow' ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {scoreCI.upper}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`text-8xl md:text-9xl font-bold mb-2 transition-all duration-700 ${
                        totalAnswered === 0 ? 'text-zinc-400' :
                        isGoodPerformance ? 'text-emerald-400' :
                        isNeedsWork ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {predictedScore}
                      </div>
                      <div className={`text-xl md:text-2xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'} mb-6`}>
                        Point Estimate (need more data for CI)
                      </div>
                    </>
                  )}
                  {/* Hover tooltip */}
                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 max-w-[90vw] ${liquidGlass ? 'bg-zinc-950/95 backdrop-blur-2xl rounded-[32px] border-white/20 shadow-2xl' : 'bg-zinc-900 rounded-2xl border-zinc-800'} border p-5 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-700`}>
                    {/* Light reflection overlay */}
                    {liquidGlass && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] pointer-events-none" />
                    )}

                    <div className="relative">
                      <p className={`text-sm leading-relaxed ${liquidGlass ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        We are 95% confident your exam score will fall between <strong className="text-white">{scoreCI.lower}</strong> and <strong className="text-white">{scoreCI.upper}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`text-xl md:text-2xl text-zinc-500 ${liquidGlass ? '' : 'font-mono'}`}>out of 900</div>
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
                      Minimum {MIN_QUESTIONS_FOR_PREDICTION} questions required for analysis
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative mt-12">
            <div className={`w-full h-6 relative overflow-hidden ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl' : 'bg-zinc-900 border border-zinc-800 rounded-md'}`}>
              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl" />}
              {/* Progress bar fill - show range if CI available, otherwise point estimate */}
              {hasEnoughQuestions && (
                isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                  // Show range (confidence interval) with multiple color segments
                  <>
                    {/* Red segment: 100-599 */}
                    {scoreCI.lower < 600 && (
                      <div
                        className={`h-6 absolute transition-all duration-700 ${
                          liquidGlass
                            ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-600'
                            : 'bg-red-500'
                        }`}
                        style={{
                          left: `${Math.max(0, ((scoreCI.lower - 100) / 800) * 100)}%`,
                          width: `${((Math.min(scoreCI.upper, 599) - scoreCI.lower) / 800) * 100}%`,
                          borderTopLeftRadius: liquidGlass ? '1rem' : '0.375rem',
                          borderBottomLeftRadius: liquidGlass ? '1rem' : '0.375rem',
                          borderTopRightRadius: scoreCI.upper < 600 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                          borderBottomRightRadius: scoreCI.upper < 600 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                        }}
                      >
                        {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" style={{ borderTopLeftRadius: '1rem', borderBottomLeftRadius: '1rem', borderTopRightRadius: scoreCI.upper < 600 ? '1rem' : '0', borderBottomRightRadius: scoreCI.upper < 600 ? '1rem' : '0' }} />}
                      </div>
                    )}

                    {/* Yellow segment: 600-749 */}
                    {scoreCI.lower < 750 && scoreCI.upper >= 600 && (
                      <div
                        className={`h-6 absolute transition-all duration-700 ${
                          liquidGlass
                            ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          left: `${((Math.max(scoreCI.lower, 600) - 100) / 800) * 100}%`,
                          width: `${((Math.min(scoreCI.upper, 749) - Math.max(scoreCI.lower, 600)) / 800) * 100}%`,
                          borderTopLeftRadius: scoreCI.lower >= 600 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                          borderBottomLeftRadius: scoreCI.lower >= 600 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                          borderTopRightRadius: scoreCI.upper < 750 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                          borderBottomRightRadius: scoreCI.upper < 750 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                        }}
                      >
                        {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" style={{ borderTopLeftRadius: scoreCI.lower >= 600 ? '1rem' : '0', borderBottomLeftRadius: scoreCI.lower >= 600 ? '1rem' : '0', borderTopRightRadius: scoreCI.upper < 750 ? '1rem' : '0', borderBottomRightRadius: scoreCI.upper < 750 ? '1rem' : '0' }} />}
                      </div>
                    )}

                    {/* Green segment: 750-900 */}
                    {scoreCI.upper >= 750 && (
                      <div
                        className={`h-6 absolute transition-all duration-700 ${
                          liquidGlass
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          left: `${((Math.max(scoreCI.lower, 750) - 100) / 800) * 100}%`,
                          width: `${((scoreCI.upper - Math.max(scoreCI.lower, 750)) / 800) * 100}%`,
                          borderTopLeftRadius: scoreCI.lower >= 750 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                          borderBottomLeftRadius: scoreCI.lower >= 750 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                          borderTopRightRadius: liquidGlass ? '1rem' : '0.375rem',
                          borderBottomRightRadius: liquidGlass ? '1rem' : '0.375rem',
                        }}
                      >
                        {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" style={{ borderTopLeftRadius: scoreCI.lower >= 750 ? '1rem' : '0', borderBottomLeftRadius: scoreCI.lower >= 750 ? '1rem' : '0', borderTopRightRadius: '1rem', borderBottomRightRadius: '1rem' }} />}
                      </div>
                    )}
                  </>
                ) : (
                  // Show point estimate
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
                )
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
          </div>
        </div>

        {/* Combined Stats Box */}
        <div className={`relative p-10 md:p-12 transition-all duration-700 mb-12 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-white/30 rounded-[40px] hover:shadow-2xl hover:shadow-white/10' : 'bg-black border border-zinc-800 hover:border-zinc-700 rounded-md'}`}>
          {liquidGlass && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
          )}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="text-center">
              <div className={`text-zinc-400 text-xl md:text-2xl mb-4 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Questions Attempted</div>
              <div className={`text-5xl md:text-6xl font-bold transition-all duration-700 ${totalAnswered === 0 ? 'text-zinc-400' : 'text-white'}`}>{totalAnswered}</div>
            </div>
            <div className="text-center">
              <div className={`text-zinc-400 text-xl md:text-2xl mb-4 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Accuracy</div>
              <div className="relative group inline-block cursor-help">
                <div className={`text-5xl md:text-6xl font-bold transition-all duration-700 ${
                  totalAnswered === 0 ? 'text-zinc-400' :
                  parseFloat(accuracy.toString()) >= 83.3 ? 'text-emerald-400' :
                  parseFloat(accuracy.toString()) >= 66.7 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>{accuracy}%</div>
                {/* Tooltip */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 transition-opacity duration-700 ${liquidGlass ? 'bg-black/95 backdrop-blur-xl border-white/20 rounded-3xl' : 'bg-black border-zinc-800 rounded-md'} border p-6 z-50 pointer-events-none opacity-0 group-hover:opacity-100`}>
                  <div className={`text-sm ${liquidGlass ? '' : 'font-mono'}`}>
                    <div className="mb-3 pb-3 border-b border-zinc-700">
                      <div className="text-zinc-400 font-semibold mb-1">Accuracy Levels</div>
                      <div className="text-xs text-zinc-500">Maps to exam scores (100-900 scale)</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">≥83.3%</span>
                        <span className="text-zinc-300">Passing (≥750)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-400 font-semibold">66.7-83.2%</span>
                        <span className="text-zinc-300">Close (600-749)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-semibold">&lt;66.7%</span>
                        <span className="text-zinc-300">Needs Work (&lt;600)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              <h3 className={`text-3xl md:text-4xl font-bold text-white tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Performance Analysis</h3>
              <button
                id="toggle-irt"
                onClick={() => setIrtExpanded(!irtExpanded)}
                className={`p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-700 ${liquidGlass ? 'rounded-3xl' : 'rounded-md'}`}
                aria-label="Toggle Performance Analysis"
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
                    <h4 className={`text-2xl md:text-3xl font-bold text-white tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Ability Level</h4>
                    <div className="relative group cursor-help">
                      {isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                        <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold transition-all duration-700 flex items-center justify-center gap-2`}>
                          <span className={
                            lowerAbilityColor === 'emerald' ? 'text-emerald-400' :
                            lowerAbilityColor === 'yellow' ? 'text-yellow-400' :
                            'text-red-400'
                          }>
                            {abilityCI.lower.toFixed(2)}
                          </span>
                          <span className="text-zinc-500">-</span>
                          <span className={
                            upperAbilityColor === 'emerald' ? 'text-emerald-400' :
                            upperAbilityColor === 'yellow' ? 'text-yellow-400' :
                            'text-red-400'
                          }>
                            {abilityCI.upper.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold transition-all duration-700 ${
                          estimatedAbility >= 1.0 ? 'text-emerald-400' :
                          estimatedAbility >= -1.0 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {estimatedAbility.toFixed(2)}
                        </div>
                      )}
                      {/* Tooltip */}
                      <div className={`absolute bottom-full right-0 mb-2 w-80 transition-opacity duration-700 ${liquidGlass ? 'bg-black/95 backdrop-blur-xl border-white/20 rounded-3xl' : 'bg-black border-zinc-800 rounded-md'} border p-6 z-50 pointer-events-none opacity-0 group-hover:opacity-100`}>
                        <div className={`text-sm ${liquidGlass ? '' : 'font-mono'}`}>
                          <div className="mb-3 pb-3 border-b border-zinc-700">
                            <div className="text-zinc-400 font-semibold mb-1">Ability Level (θ)</div>
                            <div className="text-xs text-zinc-500">IRT measure adjusted for question difficulty</div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-semibold">≥1.0</span>
                              <span className="text-zinc-300">Passing (~680+)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-yellow-400 font-semibold">-1.0 to 1.0</span>
                              <span className="text-zinc-300">Average (420-680)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-red-400 font-semibold">&lt;-1.0</span>
                              <span className="text-zinc-300">Below Average (&lt;420)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-6">
                    <div className={`h-6 relative overflow-hidden ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl' : 'bg-zinc-900 border border-zinc-800 rounded-md'}`}>
                      {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl" />}
                      {/* Show range if CI available, otherwise point estimate */}
                      {isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                        // Show range (confidence interval) with multiple color segments
                        <>
                          {/* Red segment: -3 to -1 */}
                          {abilityCI.lower < -1.0 && (
                            <div
                              className={`h-6 absolute transition-all duration-700 ${
                                liquidGlass
                                  ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-600'
                                  : 'bg-red-500'
                              }`}
                              style={{
                                left: `${Math.max(0, ((abilityCI.lower + 3) / 6) * 100)}%`,
                                width: `${((Math.min(abilityCI.upper, -1.0) - abilityCI.lower) / 6) * 100}%`,
                                borderTopLeftRadius: liquidGlass ? '1rem' : '0.375rem',
                                borderBottomLeftRadius: liquidGlass ? '1rem' : '0.375rem',
                                borderTopRightRadius: abilityCI.upper < -1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                                borderBottomRightRadius: abilityCI.upper < -1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                              }}
                            >
                              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" style={{ borderTopLeftRadius: '1rem', borderBottomLeftRadius: '1rem', borderTopRightRadius: abilityCI.upper < -1.0 ? '1rem' : '0', borderBottomRightRadius: abilityCI.upper < -1.0 ? '1rem' : '0' }} />}
                            </div>
                          )}

                          {/* Yellow segment: -1 to 1 */}
                          {abilityCI.lower < 1.0 && abilityCI.upper >= -1.0 && (
                            <div
                              className={`h-6 absolute transition-all duration-700 ${
                                liquidGlass
                                  ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600'
                                  : 'bg-yellow-500'
                              }`}
                              style={{
                                left: `${((Math.max(abilityCI.lower, -1.0) + 3) / 6) * 100}%`,
                                width: `${((Math.min(abilityCI.upper, 1.0) - Math.max(abilityCI.lower, -1.0)) / 6) * 100}%`,
                                borderTopLeftRadius: abilityCI.lower >= -1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                                borderBottomLeftRadius: abilityCI.lower >= -1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                                borderTopRightRadius: abilityCI.upper < 1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                                borderBottomRightRadius: abilityCI.upper < 1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                              }}
                            >
                              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" style={{ borderTopLeftRadius: abilityCI.lower >= -1.0 ? '1rem' : '0', borderBottomLeftRadius: abilityCI.lower >= -1.0 ? '1rem' : '0', borderTopRightRadius: abilityCI.upper < 1.0 ? '1rem' : '0', borderBottomRightRadius: abilityCI.upper < 1.0 ? '1rem' : '0' }} />}
                            </div>
                          )}

                          {/* Green segment: 1 to 3 */}
                          {abilityCI.upper >= 1.0 && (
                            <div
                              className={`h-6 absolute transition-all duration-700 ${
                                liquidGlass
                                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                left: `${((Math.max(abilityCI.lower, 1.0) + 3) / 6) * 100}%`,
                                width: `${((abilityCI.upper - Math.max(abilityCI.lower, 1.0)) / 6) * 100}%`,
                                borderTopLeftRadius: abilityCI.lower >= 1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                                borderBottomLeftRadius: abilityCI.lower >= 1.0 ? (liquidGlass ? '1rem' : '0.375rem') : '0',
                                borderTopRightRadius: liquidGlass ? '1rem' : '0.375rem',
                                borderBottomRightRadius: liquidGlass ? '1rem' : '0.375rem',
                              }}
                            >
                              {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" style={{ borderTopLeftRadius: abilityCI.lower >= 1.0 ? '1rem' : '0', borderBottomLeftRadius: abilityCI.lower >= 1.0 ? '1rem' : '0', borderTopRightRadius: '1rem', borderBottomRightRadius: '1rem' }} />}
                            </div>
                          )}
                        </>
                      ) : (
                        // Show point estimate
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
                      )}
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
                Click to view detailed performance analysis
              </div>
            )}
          </div>
        )}

        {/* Topic Review Schedule - Verification Tool */}
        {userProgress && (
          <div className="mt-16">
            <TopicReviewSchedule userProgress={userProgress} liquidGlass={liquidGlass} />
          </div>
        )}

        {/* Performance Graphs Section */}
        {userProgress && (
          <div className="mt-16">
            <h2 className={`text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Progress Charts</h2>
            <PerformanceGraphs userProgress={userProgress} />
          </div>
        )}

        {/* Past Activity - Collapsible */}
        {userProgress && (
          <div className={`relative mt-16 mb-16 p-10 md:p-12 transition-all duration-700 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl' : 'bg-black border border-zinc-800 rounded-md'}`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
            )}
            <div className="relative flex items-center justify-between">
              <h3 className={`text-3xl md:text-4xl font-bold tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>Past Quizzes ({userProgress.quizHistory.length})</h3>
              {userProgress.quizHistory.length > 0 && (
                <button
                  id="toggle-past-quizzes"
                  onClick={() => setRecentQuizzesExpanded(!recentQuizzesExpanded)}
                  className={`p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-700 ${liquidGlass ? 'rounded-3xl' : 'rounded-md'}`}
                  aria-label="Toggle Past Quizzes"
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
              )}
            </div>

            {userProgress.quizHistory.length === 0 ? (
              <div className={`relative text-center py-12 mt-6 text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
                No quizzes taken yet. Take a quiz to see your history here.
              </div>
            ) : recentQuizzesExpanded ? (
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
                    <div
                      key={quiz.id}
                      className="relative"
                    >
                      <div
                        id={`quiz-review-${quiz.id}`}
                        onClick={() => router.push(`/cybersecurity/quiz/review/${quiz.id}`)}
                        className={`relative w-full p-8 md:p-10 transition-all duration-700 hover:scale-[1.01] cursor-pointer ${liquidGlass ? 'bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-3xl hover:shadow-xl hover:shadow-white/10' : 'bg-black border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-md'}`}
                      >
                        {liquidGlass && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(quiz.id);
                          }}
                          className={`absolute top-4 right-4 z-10 p-3 transition-all duration-700 group ${liquidGlass ? 'bg-red-500/10 hover:bg-red-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 hover:border-red-500/50' : 'bg-red-900/20 hover:bg-red-900/30 rounded-md border border-red-500/30 hover:border-red-500/50'}`}
                          title="Delete quiz"
                        >
                          <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <div className="relative flex justify-between items-center pr-12">
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
                      </div>

                      {/* Delete Confirmation Dialog */}
                      {deleteConfirmId === quiz.id && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                          <div className={`relative w-full max-w-md p-8 md:p-10 transition-all duration-700 ${liquidGlass ? 'bg-white/10 backdrop-blur-2xl rounded-[40px] border border-white/20' : 'bg-zinc-900 rounded-md border border-zinc-700'}`}>
                            {liquidGlass && (
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
                            )}
                            <div className="relative">
                              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Delete Quiz?</h3>
                              <p className="text-lg text-zinc-300 mb-8">
                                Are you sure you want to delete this quiz? This will remove all associated data and recalculate your performance metrics. This action cannot be undone.
                              </p>
                              <div className="flex gap-4">
                                <button
                                  onClick={() => handleDeleteQuiz(quiz.id)}
                                  disabled={isDeleting}
                                  className={`flex-1 py-4 px-6 font-bold text-lg transition-all duration-700 ${liquidGlass ? 'bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl rounded-2xl border border-red-500/50 hover:border-red-500/70' : 'bg-red-900/30 hover:bg-red-900/40 rounded-md border border-red-500/50'} text-red-300 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  disabled={isDeleting}
                                  className={`flex-1 py-4 px-6 font-bold text-lg transition-all duration-700 ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30' : 'bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
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

                {/* Show More button if there are more than 5 quizzes */}
                {userProgress.quizHistory.length > 5 && (
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/cybersecurity/quiz/history')}
                      className={`w-full py-5 md:py-6 text-xl md:text-2xl font-bold transition-all duration-700 ${liquidGlass ? 'bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-3xl border border-white/20 hover:border-white/30 hover:scale-[1.01]' : 'bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700'} text-white`}
                    >
                      Show More ({userProgress.quizHistory.length - 5} older quizzes)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`relative mt-8 text-xl text-zinc-400 ${liquidGlass ? '' : 'font-mono'}`}>
                {userProgress.quizHistory.length === 0
                  ? 'No quizzes taken yet'
                  : `Click to view your last ${Math.min(5, userProgress.quizHistory.length)} quiz${userProgress.quizHistory.length === 1 ? '' : 'es'}`
                }
              </div>
            )}
          </div>
        )}

        {/* Reset Progress - Destructive Action (Always visible, disabled when no data) */}
        <div className="mt-12 text-center pb-8">
          <button
            id="reset-progress"
            onClick={handleResetProgress}
            disabled={totalAnswered === 0}
            className={`relative px-12 md:px-16 py-5 md:py-6 text-xl md:text-2xl font-bold transition-all duration-700 ${
              totalAnswered === 0
                ? liquidGlass
                  ? 'bg-zinc-800/30 backdrop-blur-xl border border-zinc-700/30 text-zinc-600 rounded-3xl cursor-not-allowed opacity-50'
                  : 'bg-zinc-900 text-zinc-700 border border-zinc-800 rounded-md font-mono cursor-not-allowed opacity-50'
                : liquidGlass
                ? 'bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/50 hover:border-red-500/80 text-red-300 hover:text-red-200 rounded-3xl hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-red-500/30'
                : 'bg-black hover:bg-zinc-900 text-red-400 border border-red-500/30 hover:border-red-500 rounded-md font-mono'
            }`}
          >
            {liquidGlass && totalAnswered > 0 && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-700" />}
            {liquidGlass && totalAnswered > 0 && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />}
            <span className="relative">Reset Progress</span>
          </button>
        </div>
      </div>
    </div>
  );
}
