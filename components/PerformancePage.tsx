'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppProvider';
import { useRouter } from 'next/navigation';
import PerformanceGraphs from './PerformanceGraphs';
import TopicReviewSchedule from './TopicReviewSchedule';
import { UserProgress } from '@/lib/types';
import { formatQuizSummary, formatQuizDateShort } from '@/lib/quizFormatting';
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

  // 1. Difficulty Performance Insight (using points for partial credit)
  const difficultyInsight = [];
  for (const [diff, stats] of Object.entries(byDifficulty)) {
    if (stats.total > 0) {
      const acc = stats.maxPoints > 0 ? ((stats.points / stats.maxPoints) * 100).toFixed(0) : '0';
      difficultyInsight.push(`${diff}: ${acc}%`);
    }
  }
  if (difficultyInsight.length > 0) {
    insights.push(`Accuracy by difficulty: ${difficultyInsight.join(', ')}`);
  }

  // 2. Weakness by Difficulty (using points for partial credit)
  const easyAcc = byDifficulty.easy.maxPoints > 0 ? byDifficulty.easy.points / byDifficulty.easy.maxPoints : 0;
  const mediumAcc = byDifficulty.medium.maxPoints > 0 ? byDifficulty.medium.points / byDifficulty.medium.maxPoints : 0;
  const hardAcc = byDifficulty.hard.maxPoints > 0 ? byDifficulty.hard.points / byDifficulty.hard.maxPoints : 0;

  if (byDifficulty.easy.total >= 3 && easyAcc < 0.7) {
    insights.push('Struggling with easy questions - review fundamental concepts');
  }
  if (byDifficulty.medium.total >= 5 && mediumAcc < 0.7) {
    insights.push('Medium difficulty questions need more practice');
  }
  if (byDifficulty.hard.total >= 3 && hardAcc < 0.6) {
    insights.push('Hard questions require deeper understanding - review advanced topics');
  }

  // 3. Category Performance - Areas for Improvement (using points for partial credit)
  const multiDomain = byCategory['multiple-domains-multiple-topics'];
  if (multiDomain.total >= 3) {
    const acc = multiDomain.maxPoints > 0 ? (multiDomain.points / multiDomain.maxPoints) * 100 : 0;
    if (acc < 70) {
      insights.push(`Improve cross-domain integration (currently ${acc.toFixed(0)}%)`);
    }
  }

  const multiTopic = byCategory['single-domain-multiple-topics'];
  if (multiTopic.total >= 3) {
    const acc = multiTopic.maxPoints > 0 ? (multiTopic.points / multiTopic.maxPoints) * 100 : 0;
    if (acc < 60) {
      insights.push(`Focus on connecting multiple concepts within domains (${acc.toFixed(0)}%)`);
    }
  }

  // 4. Question Type Performance (using points for partial credit)
  if (byType.multiple.total >= 3) {
    // For multiple-choice, we need to track points too
    let multiPoints = 0;
    let multiMaxPoints = 0;
    allAttempts.forEach(attempt => {
      if (attempt.question.questionType === 'multiple') {
        multiPoints += attempt.pointsEarned;
        multiMaxPoints += attempt.maxPoints;
      }
    });
    const multiAcc = multiMaxPoints > 0 ? ((multiPoints / multiMaxPoints) * 100).toFixed(0) : '0';
    if (byType.multiple.partialCredit > 0) {
      insights.push(`Partial credit earned on ${byType.multiple.partialCredit} multi-select questions - review all correct options`);
    }
    const multiAccNum = multiMaxPoints > 0 ? multiPoints / multiMaxPoints : 0;
    if (multiAccNum < 0.6) {
      insights.push(`Multi-select questions need work (${multiAcc}%) - practice "select all that apply"`);
    }
  }

  // 5. Recent Performance Trend - Areas for Improvement (using points for partial credit)
  if (userProgress.quizHistory.length >= 3) {
    const recentQuizzes = userProgress.quizHistory.slice(-3);
    const recentAccuracies = recentQuizzes.map(quiz =>
      quiz.maxPoints > 0 ? (quiz.totalPoints / quiz.maxPoints) * 100 : 0
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
  const { user, userProgress, predictedScore, loading, resetProgress } = useApp();
  const router = useRouter();
  const [irtExpanded, setIrtExpanded] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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

  const handleExportData = async () => {
    if (!userProgress || !user) {
      alert('No data to export');
      return;
    }

    try {
      // Call API to get complete export data (including subcollection)
      const response = await authenticatedPost('/api/export-progress', {
        userId: user.uid,
      });

      if (!response.success) {
        throw new Error('Export failed');
      }

      // Add user email to export data
      const exportData = {
        ...response.data,
        userEmail: user.email,
      };

      // Convert to JSON string
      const dataStr = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-plus-performance-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[EXPORT] Data exported successfully');
    } catch (error) {
      console.error('[EXPORT] Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleRecalculateProgress = async () => {
    if (!user) {
      alert('User not authenticated');
      return;
    }

    if (!confirm('This will recalculate all performance metrics and fix any incorrect partial credit scores from past quizzes. Continue?')) {
      return;
    }

    try {
      const response = await authenticatedPost('/api/recalculate-progress', {
        userId: user.uid,
      });

      if (response.success) {
        alert(
          `${response.message}\n\n` +
          `Total questions: ${response.stats.totalQuestions}\n` +
          `Correct answers: ${response.stats.correctAnswers}\n` +
          `Ability estimate: ${response.stats.estimatedAbility.toFixed(3)}\n` +
          `Partial credits updated: ${response.stats.partialCreditsUpdated || 0}\n\n` +
          `The page will now reload.`
        );
        window.location.reload();
      } else {
        throw new Error('Recalculation failed');
      }
    } catch (error) {
      console.error('[RECALCULATE] Failed:', error);
      alert(`Failed to recalculate progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validate imported data (support both old and new formats)
        const isValidOldFormat = importedData.userData && importedData.userId;
        const isValidNewFormat = importedData.mainDocument && importedData.userId;

        if (!isValidOldFormat && !isValidNewFormat) {
          throw new Error('Invalid backup file format');
        }

        // Show info about what will be imported
        let quizCount = 0;
        if (importedData.quizHistory && Array.isArray(importedData.quizHistory)) {
          quizCount = importedData.quizHistory.length;
        } else if (importedData.userData?.quizHistory && Array.isArray(importedData.userData.quizHistory)) {
          quizCount = importedData.userData.quizHistory.length;
        }

        // Ask user if they want to merge or replace
        const currentQuizCount = userProgress?.totalQuestions || 0;
        const importChoice = confirm(
          `Import performance data from ${new Date(importedData.exportDate).toLocaleDateString()}?\n\n` +
          `This backup contains ${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}.\n` +
          `You currently have ${currentQuizCount} quiz${currentQuizCount !== 1 ? 'zes' : ''} in your account.\n\n` +
          `Click OK to MERGE (add backup data to your existing data)\n` +
          `Click Cancel to choose REPLACE instead`
        );

        let replaceChoice = false;
        if (!importChoice) {
          // User clicked Cancel, ask if they want to replace instead
          replaceChoice = confirm(
            `Do you want to REPLACE your current data with the backup?\n\n` +
            `WARNING: This will delete your current ${currentQuizCount} quiz${currentQuizCount !== 1 ? 'zes' : ''} ` +
            `and replace with ${quizCount} quiz${quizCount !== 1 ? 'zes' : ''} from the backup.\n\n` +
            `This action cannot be undone.\n\n` +
            `Click OK to REPLACE\n` +
            `Click Cancel to abort import`
          );

          if (!replaceChoice) {
            console.log('[IMPORT] Import cancelled by user');
            return;
          }
        }

        const mergeData = importChoice; // true for merge, false for replace

        // Import data via API
        if (!user) {
          throw new Error('User not authenticated');
        }

        const response = await authenticatedPost('/api/import-progress', {
          userId: user.uid,
          importData: importedData,
          mergeData: mergeData,
        });

        console.log('[IMPORT] Data imported, now recalculating performance metrics...');

        // Recalculate all performance metrics based on the combined quiz history
        try {
          await authenticatedPost('/api/recalculate-progress', {
            userId: user.uid,
          });
          console.log('[IMPORT] Performance metrics recalculated successfully');
        } catch (recalcError) {
          console.error('[IMPORT] Failed to recalculate metrics:', recalcError);
          // Continue anyway - the data is imported, just metrics might be off
        }

        if (mergeData) {
          alert(
            `Performance data merged successfully!\n\n` +
            `${response.quizzesImported || 0} quizzes added to your existing data.\n` +
            `All performance metrics have been recalculated.\n\n` +
            `The page will now reload.`
          );
        } else {
          alert(
            `Performance data replaced successfully!\n\n` +
            `${response.quizzesImported || 0} quizzes restored from backup.\n` +
            `All performance metrics have been recalculated.\n\n` +
            `The page will now reload.`
          );
        }

        window.location.reload();
      } catch (error) {
        console.error('[IMPORT] Failed to import data:', error);
        alert(`Failed to import data: ${error instanceof Error ? error.message : 'Invalid file format'}`);
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            background: '#0f0f0f',
            borderRadius: '1.5rem',
            padding: '4rem 5rem',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
          }}>
            <div style={{ textAlign: 'center' }}>
              {/* Animated icon */}
              <div style={{
                position: 'relative',
                margin: '0 auto 2rem',
                width: '10rem',
                height: '10rem'
              }}>
                {/* Outer ring */}
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  border: '4px solid #1a1a1a',
                  borderRadius: '50%'
                }}></div>
                {/* Spinning gradient ring */}
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  animation: 'spin 1s linear infinite'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '4px solid transparent',
                    borderTopColor: '#06b6d4',
                    borderRightColor: 'rgba(6, 182, 212, 0.5)'
                  }}></div>
                </div>
                {/* Center icon - graduation cap */}
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '5rem', height: '5rem', color: '#06b6d4' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                letterSpacing: '-0.025em',
                color: '#e5e5e5'
              }}>
                Loading performance data...
              </p>
              <p style={{
                fontSize: '1.125rem',
                marginTop: '1rem',
                color: '#a8a8a8'
              }}>
                Please wait
              </p>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
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
  // Maps theta to exam score thresholds: 750 (passing), 600 (close)
  // Formula: Score = 550 + (theta × 130)
  // theta = 1.54 → 750, theta = 0.38 → 600
  const getAbilityColor = (ability: number) => {
    if (ability >= 1.54) return 'emerald';  // Passing (≥750)
    if (ability >= 0.38) return 'yellow';   // Close (600-749)
    return 'red';                            // Needs Work (<600)
  };

  const lowerAbilityColor = getAbilityColor(abilityCI.lower);
  const upperAbilityColor = getAbilityColor(abilityCI.upper);

  return (
    <div style={{
      minHeight: '100vh',
      color: '#e5e5e5',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#0f0f0f'
    }}>
      {/* Header - Full width */}
      <div style={{ position: 'relative', paddingTop: '2rem', paddingBottom: '1.5rem' }}>
        <Header
          onExportData={handleExportData}
          onImportData={handleImportData}
          onRecalculateProgress={handleRecalculateProgress}
          hasData={!!userProgress && userProgress.totalQuestions > 0}
        />
      </div>

      <div style={{
        position: 'relative',
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 3rem'
      }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <h1 style={{
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              fontWeight: 'bold',
              letterSpacing: '-0.05em',
              lineHeight: '0.95',
              marginBottom: '2rem'
            }}>
              <span style={{ display: 'block', color: '#e5e5e5' }}>
                Your
              </span>
              <span style={{ display: 'block', color: '#8b5cf6' }}>
                Performance
              </span>
            </h1>
            <p style={{
              fontSize: 'clamp(1.25rem, 4vw, 2rem)',
              fontWeight: '300',
              maxWidth: '48rem',
              margin: '0 auto',
              lineHeight: '1.6',
              color: '#a8a8a8'
            }}>
              Track your progress and master Security+
            </p>
          </div>
        </section>

        {/* Predicted Score Card */}
        <div style={{
          position: 'relative',
          padding: 'clamp(2rem, 5vw, 4rem)',
          marginBottom: '3rem',
          background: '#0f0f0f',
          borderRadius: '1.5rem',
          boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ position: 'relative', textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 2.5rem)',
              color: '#e5e5e5',
              marginBottom: '0.5rem',
              letterSpacing: '-0.025em',
              fontWeight: 'bold'
            }}>Predicted Exam Score</h2>
            {totalAnswered >= MIN_QUESTIONS_FOR_PREDICTION && (
              <p style={{
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                color: '#666666',
                marginBottom: '2rem'
              }}>
                Based on {totalAnswered} question{totalAnswered !== 1 ? 's' : ''}
              </p>
            )}

            {hasEnoughQuestions ? (
              <>
                <div className="score-display group relative cursor-help">
                  {/* Score Range Display */}
                  {isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                    <>
                      <div style={{
                        fontSize: 'clamp(3rem, 10vw, 6rem)',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'clamp(0.5rem, 2vw, 1rem)',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          color: lowerColor === 'emerald' ? '#10b981' :
                                 lowerColor === 'yellow' ? '#f59e0b' :
                                 '#f43f5e'
                        }}>
                          {scoreCI.lower}
                        </span>
                        <span style={{ color: '#666666' }}>-</span>
                        <span style={{
                          color: upperColor === 'emerald' ? '#10b981' :
                                 upperColor === 'yellow' ? '#f59e0b' :
                                 '#f43f5e'
                        }}>
                          {scoreCI.upper}
                        </span>
                      </div>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_0.6s_ease-in-out_forwards]">
                        <div className="space-y-1 text-sm text-slate-300">
                          <div>
                            <span className="text-green-400 font-medium">Green:</span> 750 - 900
                          </div>
                          <div>
                            <span className="text-yellow-400 font-medium">Yellow:</span> 600 - 749
                          </div>
                          <div>
                            <span className="text-red-400 font-medium">Red:</span> 100 - 599
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        fontSize: 'clamp(4rem, 12vw, 7rem)',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        transition: 'all 0.3s ease',
                        color: totalAnswered === 0 ? '#666666' :
                               isGoodPerformance ? '#10b981' :
                               isNeedsWork ? '#f43f5e' :
                               '#f59e0b'
                      }}>
                        {predictedScore}
                      </div>
                      <div style={{
                        fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                        color: '#666666',
                        marginBottom: '1.5rem'
                      }}>
                        Point Estimate (need more data for CI)
                      </div>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_0.6s_ease-in-out_forwards]">
                        <div className="space-y-1 text-sm text-slate-300">
                          <div>
                            <span className="text-green-400 font-medium">Green:</span> 750 - 900
                          </div>
                          <div>
                            <span className="text-yellow-400 font-medium">Yellow:</span> 600 - 749
                          </div>
                          <div>
                            <span className="text-red-400 font-medium">Red:</span> 100 - 599
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{
                  fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                  color: '#666666'
                }}>out of 900</div>
              </>
            ) : (
              <div style={{ marginTop: '2rem' }}>
                <div style={{
                  position: 'relative',
                  padding: '2rem',
                  background: '#0f0f0f',
                  borderRadius: '1.5rem',
                  boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                }}>
                  <div style={{ position: 'relative' }}>
                    <svg style={{
                      width: '4rem',
                      height: '4rem',
                      margin: '0 auto 1rem',
                      color: '#666666',
                      display: 'block'
                    }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                    <h3 style={{
                      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                      fontWeight: 'bold',
                      color: '#e5e5e5',
                      marginBottom: '0.75rem'
                    }}>
                      Insufficient Data
                    </h3>
                    <p style={{
                      fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
                      color: '#a8a8a8',
                      marginBottom: '1rem'
                    }}>
                      {totalAnswered === 0 ? (
                        <>Start answering questions to generate your predicted score</>
                      ) : (
                        <>Answer <span style={{ color: '#e5e5e5', fontWeight: 'bold' }}>{questionsNeeded} more</span> {questionsNeeded === 1 ? 'question' : 'questions'} for a reliable IRT prediction</>
                      )}
                    </p>
                    <p style={{
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      color: '#666666'
                    }}>
                      Minimum {MIN_QUESTIONS_FOR_PREDICTION} questions required for analysis
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative', marginTop: '3rem' }}>
            <div style={{
              width: '100%',
              height: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              background: '#0f0f0f',
              boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
              borderRadius: '1.5rem'
            }}>
              {/* Progress bar fill - show range if CI available, otherwise point estimate */}
              {hasEnoughQuestions && (
                isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                  // Show range (confidence interval) with multiple color segments
                  <>
                    {/* Red segment: 100-599 */}
                    {scoreCI.lower < 600 && (
                      <div
                        style={{
                          height: '1.5rem',
                          position: 'absolute',
                          transition: 'all 0.3s ease',
                          background: '#f43f5e',
                          left: `${Math.max(0, ((scoreCI.lower - 100) / 800) * 100)}%`,
                          width: `${((Math.min(scoreCI.upper, 599) - scoreCI.lower) / 800) * 100}%`,
                          borderTopLeftRadius: '1rem',
                          borderBottomLeftRadius: '1rem',
                          borderTopRightRadius: scoreCI.upper < 600 ? '1rem' : '0',
                          borderBottomRightRadius: scoreCI.upper < 600 ? '1rem' : '0'
                        }}
                      />
                    )}

                    {/* Yellow segment: 600-749 */}
                    {scoreCI.lower < 750 && scoreCI.upper >= 600 && (
                      <div
                        style={{
                          height: '1.5rem',
                          position: 'absolute',
                          transition: 'all 0.3s ease',
                          background: '#f59e0b',
                          left: `${((Math.max(scoreCI.lower, 600) - 100) / 800) * 100}%`,
                          width: `${((Math.min(scoreCI.upper, 749) - Math.max(scoreCI.lower, 600)) / 800) * 100}%`,
                          borderTopLeftRadius: scoreCI.lower >= 600 ? '1rem' : '0',
                          borderBottomLeftRadius: scoreCI.lower >= 600 ? '1rem' : '0',
                          borderTopRightRadius: scoreCI.upper < 750 ? '1rem' : '0',
                          borderBottomRightRadius: scoreCI.upper < 750 ? '1rem' : '0'
                        }}
                      />
                    )}

                    {/* Green segment: 750-900 */}
                    {scoreCI.upper >= 750 && (
                      <div
                        style={{
                          height: '1.5rem',
                          position: 'absolute',
                          transition: 'all 0.3s ease',
                          background: '#10b981',
                          left: `${((Math.max(scoreCI.lower, 750) - 100) / 800) * 100}%`,
                          width: `${((scoreCI.upper - Math.max(scoreCI.lower, 750)) / 800) * 100}%`,
                          borderTopLeftRadius: scoreCI.lower >= 750 ? '1rem' : '0',
                          borderBottomLeftRadius: scoreCI.lower >= 750 ? '1rem' : '0',
                          borderTopRightRadius: '1rem',
                          borderBottomRightRadius: '1rem'
                        }}
                      />
                    )}
                  </>
                ) : (
                  // Show point estimate
                  <div
                    style={{
                      height: '1.5rem',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      background: isGoodPerformance ? '#10b981' :
                                  isNeedsWork ? '#f43f5e' : '#f59e0b',
                      borderRadius: '1.5rem',
                      width: `${Math.min(((predictedScore - 100) / 800) * 100, 100)}%`
                    }}
                  />
                )
              )}

              {/* Passing line marker at 750 */}
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  bottom: '0',
                  width: '2px',
                  background: '#e5e5e5',
                  opacity: '0.5',
                  left: `${((750 - 100) / 800) * 100}%`
                }}
              ></div>
            </div>

            {/* Scale labels */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              color: '#a8a8a8',
              marginTop: '0.5rem',
              position: 'relative'
            }}>
              <span>100</span>
              <span
                style={{
                  position: 'absolute',
                  color: '#e5e5e5',
                  fontWeight: '500',
                  left: `${((750 - 100) / 800) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                750
              </span>
              <span>900</span>
            </div>
          </div>
        </div>

        {/* Combined Stats Box */}
        <div style={{
          position: 'relative',
          padding: 'clamp(2rem, 4vw, 3rem)',
          transition: 'all 0.3s ease',
          marginBottom: '3rem',
          background: '#0f0f0f',
          borderRadius: '1.5rem',
          boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
        }}>
          <div style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'clamp(2rem, 4vw, 3rem)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#a8a8a8',
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                marginBottom: '1rem',
                letterSpacing: '-0.025em'
              }}>Questions Attempted</div>
              <div style={{
                fontSize: 'clamp(3rem, 8vw, 4rem)',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                color: totalAnswered === 0 ? '#666666' : '#e5e5e5'
              }}>{totalAnswered}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#a8a8a8',
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                marginBottom: '1rem',
                letterSpacing: '-0.025em'
              }}>Accuracy</div>
              <div className="accuracy-display">
                <div style={{
                  fontSize: 'clamp(3rem, 8vw, 4rem)',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  color: totalAnswered === 0 ? '#666666' :
                         parseFloat(accuracy.toString()) >= 81.25 ? '#10b981' :
                         parseFloat(accuracy.toString()) >= 62.5 ? '#f59e0b' :
                         '#f43f5e'
                }}>{accuracy}%</div>
                {/* Tooltip */}
                <div className="tooltip" style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '0.5rem',
                  width: '20rem',
                  transition: 'opacity 0.3s ease',
                  background: '#0f0f0f',
                  borderRadius: '1.5rem',
                  boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                  padding: '1.5rem',
                  zIndex: '50',
                  pointerEvents: 'none',
                  opacity: '0'
                }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div style={{
                      marginBottom: '0.75rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid #333333'
                    }}>
                      <div style={{
                        color: '#a8a8a8',
                        fontWeight: '600',
                        marginBottom: '0.25rem'
                      }}>Accuracy Levels</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#666666'
                      }}>Maps to exam scores (100-900 scale)</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>≥81.25%</span>
                        <span style={{ color: '#a8a8a8' }}>Passing (≥750)</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#f59e0b', fontWeight: '600' }}>62.5-81.24%</span>
                        <span style={{ color: '#a8a8a8' }}>Close (600-749)</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#f43f5e', fontWeight: '600' }}>&lt;62.5%</span>
                        <span style={{ color: '#a8a8a8' }}>Needs Work (&lt;600)</span>
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
          <div style={{
            position: 'relative',
            padding: 'clamp(2rem, 4vw, 3rem)',
            marginBottom: '3rem',
            transition: 'all 0.3s ease',
            background: '#0f0f0f',
            borderRadius: '1.5rem',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                fontSize: 'clamp(1.875rem, 5vw, 2.5rem)',
                fontWeight: 'bold',
                color: '#e5e5e5',
                letterSpacing: '-0.025em'
              }}>Performance Analysis</h3>
              <button
                id="toggle-irt"
                onClick={() => setIrtExpanded(!irtExpanded)}
                style={{
                  padding: '1rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '1.5rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                aria-label="Toggle Performance Analysis"
              >
                <svg
                  style={{
                    width: '2rem',
                    height: '2rem',
                    color: '#a8a8a8',
                    transition: 'transform 0.3s ease',
                    transform: irtExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
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
                {hasEnoughQuestions ? (
                  <>
                    <div style={{
                      position: 'relative',
                      padding: 'clamp(2rem, 4vw, 2.5rem)',
                      marginBottom: '2rem',
                      marginTop: '2rem',
                      transition: 'all 0.3s ease',
                      background: '#0f0f0f',
                      borderRadius: '1.5rem',
                      boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                    }}>
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <h4 style={{
                          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                          fontWeight: 'bold',
                          color: '#e5e5e5',
                          letterSpacing: '-0.025em'
                        }}>Ability Level</h4>
                        <div className="ability-display group relative cursor-help">
                          {isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                            <>
                              <div style={{
                                fontSize: 'clamp(1.5rem, 6vw, 3rem)',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                              }}>
                                <span style={{
                                  color: lowerAbilityColor === 'emerald' ? '#10b981' :
                                         lowerAbilityColor === 'yellow' ? '#f59e0b' :
                                         '#f43f5e'
                                }}>
                                  {abilityCI.lower.toFixed(2)}
                                </span>
                                <span style={{ color: '#666666' }}>-</span>
                                <span style={{
                                  color: upperAbilityColor === 'emerald' ? '#10b981' :
                                         upperAbilityColor === 'yellow' ? '#f59e0b' :
                                         '#f43f5e'
                                }}>
                                  {abilityCI.upper.toFixed(2)}
                                </span>
                              </div>
                              {/* Hover tooltip */}
                              <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_0.6s_ease-in-out_forwards]">
                                <p className="text-sm text-slate-300 leading-relaxed">Your skill level adjusted for question difficulty. Higher scores mean you answered harder questions correctly. Range: -3 (beginner) to +3 (expert).</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{
                                fontSize: 'clamp(1.5rem, 6vw, 3rem)',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                color: estimatedAbility >= 1.54 ? '#10b981' :
                                       estimatedAbility >= 0.38 ? '#f59e0b' :
                                       '#f43f5e'
                              }}>
                                {estimatedAbility.toFixed(2)}
                              </div>
                              {/* Hover tooltip */}
                              <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_0.6s_ease-in-out_forwards]">
                                <p className="text-sm text-slate-300 leading-relaxed">Your skill level adjusted for question difficulty. Higher scores mean you answered harder questions correctly. Range: -3 (beginner) to +3 (expert).</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ position: 'relative', marginTop: '1.5rem' }}>
                        <div style={{
                          height: '1.5rem',
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#0f0f0f',
                          boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                          borderRadius: '1.5rem'
                        }}>
                          {/* Show range if CI available, otherwise point estimate */}
                          {isFinite(abilityStandardError) && totalAnswered >= 1 ? (
                            // Show range (confidence interval) with multiple color segments
                            <>
                              {/* Red segment: -3 to 0.38 (Needs Work <600) */}
                              {abilityCI.lower < 0.38 && (
                                <div
                                  style={{
                                    height: '1.5rem',
                                    position: 'absolute',
                                    transition: 'all 0.3s ease',
                                    background: '#f43f5e',
                                    left: `${Math.max(0, ((abilityCI.lower + 3) / 6) * 100)}%`,
                                    width: `${((Math.min(abilityCI.upper, 0.38) - abilityCI.lower) / 6) * 100}%`,
                                    borderTopLeftRadius: '1rem',
                                    borderBottomLeftRadius: '1rem',
                                    borderTopRightRadius: abilityCI.upper < 0.38 ? '1rem' : '0',
                                    borderBottomRightRadius: abilityCI.upper < 0.38 ? '1rem' : '0'
                                  }}
                                />
                              )}

                              {/* Yellow segment: 0.38 to 1.54 (Close 600-749) */}
                              {abilityCI.lower < 1.54 && abilityCI.upper >= 0.38 && (
                                <div
                                  style={{
                                    height: '1.5rem',
                                    position: 'absolute',
                                    transition: 'all 0.3s ease',
                                    background: '#f59e0b',
                                    left: `${((Math.max(abilityCI.lower, 0.38) + 3) / 6) * 100}%`,
                                    width: `${((Math.min(abilityCI.upper, 1.54) - Math.max(abilityCI.lower, 0.38)) / 6) * 100}%`,
                                    borderTopLeftRadius: abilityCI.lower >= 0.38 ? '1rem' : '0',
                                    borderBottomLeftRadius: abilityCI.lower >= 0.38 ? '1rem' : '0',
                                    borderTopRightRadius: abilityCI.upper < 1.54 ? '1rem' : '0',
                                    borderBottomRightRadius: abilityCI.upper < 1.54 ? '1rem' : '0'
                                  }}
                                />
                              )}

                              {/* Green segment: 1.54 to 3 (Passing ≥750) */}
                              {abilityCI.upper >= 1.54 && (
                                <div
                                  style={{
                                    height: '1.5rem',
                                    position: 'absolute',
                                    transition: 'all 0.3s ease',
                                    background: '#10b981',
                                    left: `${((Math.max(abilityCI.lower, 1.54) + 3) / 6) * 100}%`,
                                    width: `${((abilityCI.upper - Math.max(abilityCI.lower, 1.54)) / 6) * 100}%`,
                                    borderTopLeftRadius: abilityCI.lower >= 1.54 ? '1rem' : '0',
                                    borderBottomLeftRadius: abilityCI.lower >= 1.54 ? '1rem' : '0',
                                    borderTopRightRadius: '1rem',
                                    borderBottomRightRadius: '1rem'
                                  }}
                                />
                              )}
                            </>
                          ) : (
                            // Show point estimate
                            <div
                              style={{
                                height: '1.5rem',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                background: estimatedAbility >= 1.0 ? '#10b981' :
                                            estimatedAbility >= -1.0 ? '#f59e0b' : '#f43f5e',
                                borderRadius: '1.5rem',
                                width: `${((estimatedAbility + 3) / 6) * 100}%`
                              }}
                            />
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '1.125rem',
                          color: '#666666',
                          marginTop: '0.75rem'
                        }}>
                          <span>Beginner</span>
                          <span>Average</span>
                          <span>Expert</span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      position: 'relative',
                      padding: 'clamp(2rem, 4vw, 2.5rem)',
                      transition: 'all 0.3s ease',
                      background: '#0f0f0f',
                      borderRadius: '1.5rem',
                      boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                    }}>
                      <div style={{
                        position: 'relative',
                        fontSize: '1.25rem',
                        color: '#a8a8a8',
                        lineHeight: '1.6'
                      }}>
                        <p style={{
                          fontWeight: 'bold',
                          marginBottom: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                          color: estimatedAbility >= 1.5 ? '#10b981' :
                                 estimatedAbility >= 1.0 ? '#10b981' :
                                 estimatedAbility >= 0 ? '#f59e0b' :
                                 estimatedAbility >= -1 ? '#f59e0b' :
                                 '#f43f5e'
                        }}>
                          {estimatedAbility >= 1.5 ? 'Excellent Performance!' :
                           estimatedAbility >= 1.0 ? 'Good Performance' :
                           estimatedAbility >= 0 ? 'Average Performance' :
                           estimatedAbility >= -1 ? 'Below Average' :
                           'Needs Improvement'}
                        </p>
                        <ul style={{
                          listStyle: 'none',
                          padding: '0',
                          margin: '0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          fontSize: 'clamp(1.125rem, 3vw, 1.25rem)'
                        }}>
                          {generatePerformanceInsights(userProgress, estimatedAbility).map((insight, index) => (
                            <li key={index} style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '1rem'
                            }}>
                              <svg style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                marginTop: '0.25rem',
                                flexShrink: '0',
                                color: estimatedAbility >= 1.0 ? '#06b6d4' :
                                       estimatedAbility >= -1 ? '#f59e0b' :
                                       '#f43f5e'
                              }} fill="currentColor" viewBox="0 0 20 20">
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
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{
                      position: 'relative',
                      padding: '2rem',
                      background: '#0f0f0f',
                      borderRadius: '1.5rem',
                      boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                    }}>
                      <div style={{ position: 'relative', textAlign: 'center' }}>
                        <svg style={{
                          width: '4rem',
                          height: '4rem',
                          margin: '0 auto 1rem',
                          color: '#666666',
                          display: 'block'
                        }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                        <h4 style={{
                          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                          fontWeight: 'bold',
                          color: '#e5e5e5',
                          marginBottom: '0.75rem'
                        }}>
                          Insufficient Data
                        </h4>
                        <p style={{
                          fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
                          color: '#a8a8a8'
                        }}>
                          Answer <span style={{ color: '#e5e5e5', fontWeight: 'bold' }}>{questionsNeeded} more</span> {questionsNeeded === 1 ? 'question' : 'questions'} for ability level analysis
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                position: 'relative',
                marginTop: '2rem',
                fontSize: '1.25rem',
                color: '#a8a8a8'
              }}>
                Click to view detailed performance analysis
              </div>
            )}
          </div>
        )}

        {/* Topic Review Schedule - Verification Tool */}
        {userProgress && (
          <div style={{ marginTop: '4rem' }}>
            <TopicReviewSchedule userProgress={userProgress} />
          </div>
        )}

        {/* Performance Graphs Section */}
        {userProgress && (
          <div style={{ marginTop: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 6vw, 3rem)',
              fontWeight: 'bold',
              color: '#e5e5e5',
              marginBottom: '3rem',
              letterSpacing: '-0.025em'
            }}>Progress Charts</h2>
            <PerformanceGraphs userProgress={userProgress} />
          </div>
        )}

        {/* Reset Progress - Destructive Action (Always clickable) */}
        <div style={{ marginTop: '3rem', textAlign: 'center', paddingBottom: '2rem' }}>
          <button
            id="reset-progress"
            onClick={handleResetProgress}
            style={{
              position: 'relative',
              padding: 'clamp(1.25rem, 3vw, 1.5rem) clamp(3rem, 6vw, 4rem)',
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              background: 'rgba(244, 63, 94, 0.2)',
              borderRadius: '1.5rem',
              border: '1px solid rgba(244, 63, 94, 0.5)',
              color: '#f43f5e',
              cursor: 'pointer',
              opacity: '1',
              boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
            }}
          >
            <span style={{ position: 'relative' }}>Reset Progress</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes tooltipFade {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .score-display:hover .tooltip,
        .accuracy-display:hover .tooltip,
        .ability-display:hover .tooltip {
          opacity: 1;
        }

        button:not(:disabled):hover {
          transform: scale(1.02);
          box-shadow: 8px 8px 16px #050505, -8px -8px 16px #191919;
        }

        button:not(:disabled):active {
          transform: scale(0.98);
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        @media (max-width: 768px) {
          .tooltip {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
