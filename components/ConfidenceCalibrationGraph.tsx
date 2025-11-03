'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { QuestionAttempt } from '@/lib/types';

interface ConfidenceCalibrationGraphProps {
  attempts: QuestionAttempt[];
}

interface CalibrationDataPoint {
  confidence: number;
  actualAccuracy: number;
  count: number;
  reflection: {
    knew: number;
    recognized: number;
    narrowed: number;
    guessed: number;
  };
}

/**
 * Get confidence level label
 */
function getConfidenceLabel(confidence: number): string {
  switch (confidence) {
    case 20: return 'Not confident (guessing)';
    case 40: return 'Somewhat unsure';
    case 60: return 'Moderately confident';
    case 80: return 'Very confident';
    case 95: return 'Extremely confident';
    default: return `${confidence}% confident`;
  }
}

/**
 * Aggregates question attempts by confidence level
 * Calculates actual accuracy for each confidence level
 * Includes breakdown by reflection type
 */
function aggregateCalibrationData(attempts: QuestionAttempt[]): CalibrationDataPoint[] {
  // Filter attempts with confidence data
  const attemptsWithConfidence = attempts.filter(a => a.confidence !== undefined);

  if (attemptsWithConfidence.length === 0) {
    return [];
  }

  // Group by confidence level
  const confidenceLevels = [20, 40, 60, 80, 95];
  const grouped: Record<number, QuestionAttempt[]> = {};

  confidenceLevels.forEach(level => {
    grouped[level] = attemptsWithConfidence.filter(a => a.confidence === level);
  });

  // Calculate calibration data for each confidence level
  return confidenceLevels.map(confidenceLevel => {
    const levelAttempts = grouped[confidenceLevel];
    const correct = levelAttempts.filter(a => a.isCorrect).length;
    const total = levelAttempts.length;
    const actualAccuracy = total > 0 ? (correct / total) * 100 : 0;

    // Breakdown by reflection
    const reflection = {
      knew: levelAttempts.filter(a => a.reflection === 'knew').length,
      recognized: levelAttempts.filter(a => a.reflection === 'recognized').length,
      narrowed: levelAttempts.filter(a => a.reflection === 'narrowed').length,
      guessed: levelAttempts.filter(a => a.reflection === 'guessed').length,
    };

    return {
      confidence: confidenceLevel,
      actualAccuracy,
      count: total,
      reflection,
    };
  }).filter(d => d.count > 0); // Only include confidence levels with data
}

export default function ConfidenceCalibrationGraph({ attempts }: ConfidenceCalibrationGraphProps) {
  const calibrationData = aggregateCalibrationData(attempts);

  if (calibrationData.length === 0) {
    return null; // Don't show anything if there's no data
  }

  // Calculate calibration score (how well confidence matches performance)
  const calibrationScore = calibrationData.reduce((sum, d) => {
    const diff = Math.abs(d.confidence - d.actualAccuracy);
    return sum + diff * d.count;
  }, 0) / calibrationData.reduce((sum, d) => sum + d.count, 0);

  const isWellCalibrated = calibrationScore < 15; // Within 15% is considered well-calibrated

  // Find the biggest issue (largest confidence-accuracy gap)
  const biggestIssue = calibrationData.reduce((max, d) => {
    const diff = d.confidence - d.actualAccuracy;
    const absDiff = Math.abs(diff);
    const maxAbsDiff = Math.abs(max.confidence - max.actualAccuracy);
    return absDiff > maxAbsDiff ? d : max;
  });

  const isOverconfident = biggestIssue.confidence > biggestIssue.actualAccuracy + 5;
  const isUnderconfident = biggestIssue.actualAccuracy > biggestIssue.confidence + 5;

  // Find main problem (most common wrong reflection type)
  let mainProblem = '';
  const allAttempts = attempts.filter(a => a.confidence !== undefined && !a.isCorrect);

  if (allAttempts.length > 0) {
    const wrongReflectionCounts = {
      knew: allAttempts.filter(a => a.reflection === 'knew').length,
      recognized: allAttempts.filter(a => a.reflection === 'recognized').length,
      narrowed: allAttempts.filter(a => a.reflection === 'narrowed').length,
      guessed: allAttempts.filter(a => a.reflection === 'guessed').length,
    };

    const maxWrongType = Object.entries(wrongReflectionCounts).reduce((max, [type, count]) =>
      count > max.count ? { type, count } : max
    , { type: 'guessed', count: 0 });

    if (maxWrongType.count > 0) {
      switch (maxWrongType.type) {
        case 'knew':
          mainProblem = `False memory (recalled ${maxWrongType.count} wrong ${maxWrongType.count === 1 ? 'answer' : 'answers'})`;
          break;
        case 'recognized':
          mainProblem = `Misleading familiarity (${maxWrongType.count} wrong ${maxWrongType.count === 1 ? 'recognition' : 'recognitions'})`;
          break;
        case 'narrowed':
          mainProblem = `Faulty logic (${maxWrongType.count} wrong ${maxWrongType.count === 1 ? 'elimination' : 'eliminations'})`;
          break;
        case 'guessed':
          mainProblem = `Need more study (${maxWrongType.count} wrong ${maxWrongType.count === 1 ? 'guess' : 'guesses'})`;
          break;
      }
    }
  }

  // Calculate reliance on non-recall methods (correct answers only)
  const correctAttempts = attempts.filter(a => a.confidence !== undefined && a.isCorrect);
  const totalCorrect = correctAttempts.length;

  const correctReflectionCounts = {
    knew: correctAttempts.filter(a => a.reflection === 'knew').length,
    recognized: correctAttempts.filter(a => a.reflection === 'recognized').length,
    narrowed: correctAttempts.filter(a => a.reflection === 'narrowed').length,
    guessed: correctAttempts.filter(a => a.reflection === 'guessed').length,
  };

  // Generate warnings for reliance on weaker memory strategies
  const warnings: string[] = [];

  if (totalCorrect > 0) {
    const recallPercentage = (correctReflectionCounts.knew / totalCorrect) * 100;
    const recognitionPercentage = (correctReflectionCounts.recognized / totalCorrect) * 100;
    const narrowedPercentage = (correctReflectionCounts.narrowed / totalCorrect) * 100;
    const guessedPercentage = (correctReflectionCounts.guessed / totalCorrect) * 100;

    // Warning if too much recognition memory (should be recall for mastery)
    if (recognitionPercentage > 40 && correctReflectionCounts.recognized >= 3) {
      warnings.push(`⚠️ ${recognitionPercentage.toFixed(0)}% of correct answers relied on recognition after seeing options - work on pure recall`);
    }

    // Warning if too many educated guesses
    if (narrowedPercentage > 30 && correctReflectionCounts.narrowed >= 3) {
      warnings.push(`⚠️ ${narrowedPercentage.toFixed(0)}% of correct answers were educated guesses - strengthen foundational knowledge`);
    }

    // Warning if any random guesses succeeded
    if (guessedPercentage > 15 && correctReflectionCounts.guessed >= 2) {
      warnings.push(`⚠️ ${guessedPercentage.toFixed(0)}% of correct answers were random guesses - got lucky, not mastery`);
    }

    // Positive reinforcement if high recall
    if (recallPercentage >= 60 && correctReflectionCounts.knew >= 5) {
      warnings.push(`✓ ${recallPercentage.toFixed(0)}% of correct answers from pure recall - strong memory foundation!`);
    }
  }

  // Add perfect calibration line data
  const perfectCalibrationLine = [
    { confidence: 0, actualAccuracy: 0 },
    { confidence: 100, actualAccuracy: 100 },
  ];

  return (
    <div className="calibration-container">
      {/* Header */}
      <div className="calibration-header">
        <h2 className="calibration-title">How accurate is your confidence?</h2>
      </div>

      {/* Hero Insight */}
      <div className={`calibration-hero ${isOverconfident ? 'overconfident' : isUnderconfident ? 'underconfident' : 'calibrated'}`}>
        <div className="calibration-hero-icon">
          {isOverconfident ? '⚠️' : isUnderconfident ? 'ℹ️' : '✓'}
        </div>
        <div className="calibration-hero-content">
          <div className="calibration-hero-status">
            {isOverconfident && `You're overconfident by ${(biggestIssue.confidence - biggestIssue.actualAccuracy).toFixed(0)}%`}
            {isUnderconfident && `You're underconfident by ${(biggestIssue.actualAccuracy - biggestIssue.confidence).toFixed(0)}%`}
            {!isOverconfident && !isUnderconfident && 'Well calibrated!'}
          </div>
          <div className="calibration-hero-detail">
            When you felt {biggestIssue.confidence}% confident → You got {biggestIssue.actualAccuracy.toFixed(0)}% correct
          </div>
          {mainProblem && (
            <div className="calibration-hero-problem">
              Main problem: {mainProblem}
            </div>
          )}
        </div>
      </div>

      {/* Memory Strategy Breakdown */}
      {totalCorrect > 0 && (
        <div className="calibration-strategy-breakdown">
          <div className="calibration-strategy-title">How you got correct answers:</div>
          {(() => {
            const strategies = [
              {
                type: 'recall',
                label: 'by recalling from memory',
                percentage: (correctReflectionCounts.knew / totalCorrect) * 100,
                count: correctReflectionCounts.knew,
                quality: 'best' // green
              },
              {
                type: 'narrowed',
                label: 'by educated guess',
                percentage: (correctReflectionCounts.narrowed / totalCorrect) * 100,
                count: correctReflectionCounts.narrowed,
                quality: 'good' // yellow
              },
              {
                type: 'recognized',
                label: 'by recognizing from options',
                percentage: (correctReflectionCounts.recognized / totalCorrect) * 100,
                count: correctReflectionCounts.recognized,
                quality: 'okay' // yellow
              },
              {
                type: 'guessed',
                label: 'by random guess',
                percentage: (correctReflectionCounts.guessed / totalCorrect) * 100,
                count: correctReflectionCounts.guessed,
                quality: 'worst' // red
              }
            ];

            // Sort by percentage descending
            const sortedStrategies = strategies
              .filter(s => s.count > 0)
              .sort((a, b) => b.percentage - a.percentage);

            return sortedStrategies.map(strategy => (
              <div key={strategy.type} className={`calibration-strategy-item ${strategy.quality}`}>
                <div className="calibration-strategy-bar" style={{ width: `${strategy.percentage}%` }}>
                  <span className="calibration-strategy-percentage">{strategy.percentage.toFixed(0)}%</span>
                </div>
                <div className="calibration-strategy-label">
                  You got {strategy.percentage.toFixed(0)}% correct {strategy.label}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Visual Comparison - Bar Chart */}
      <div className="calibration-bars">
        <div className="calibration-bars-title">Your Confidence vs Actual Performance</div>
        {calibrationData.map(d => (
          <div key={d.confidence} className="calibration-bar-row">
            <div className="calibration-bar-label">{getConfidenceLabel(d.confidence)}</div>
            <div className="calibration-bar-container">
              <div className="calibration-bar-group">
                <div className="calibration-bar confidence" style={{ width: `${d.confidence}%` }}>
                  {d.confidence}%
                </div>
                <div
                  className={`calibration-bar actual ${d.actualAccuracy < d.confidence - 5 ? 'lower' : d.actualAccuracy > d.confidence + 5 ? 'higher' : 'matched'}`}
                  style={{ width: `${d.actualAccuracy}%` }}
                >
                  {d.actualAccuracy.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .calibration-container {
          background: #0f0f0f;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          margin-bottom: 48px;
        }

        .calibration-header {
          padding: 40px 40px 20px;
        }

        .calibration-title {
          font-size: 36px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0;
          letter-spacing: -0.025em;
        }

        /* Hero Insight Section */
        .calibration-hero {
          margin: 0 40px 32px;
          padding: 32px;
          border-radius: 16px;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .calibration-hero.overconfident {
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid rgba(239, 68, 68, 0.3);
        }

        .calibration-hero.underconfident {
          background: rgba(59, 130, 246, 0.1);
          border: 2px solid rgba(59, 130, 246, 0.3);
        }

        .calibration-hero.calibrated {
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid rgba(16, 185, 129, 0.3);
        }

        .calibration-hero-icon {
          font-size: 48px;
          flex-shrink: 0;
        }

        .calibration-hero-content {
          flex: 1;
        }

        .calibration-hero-status {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .calibration-hero.overconfident .calibration-hero-status {
          color: #ef4444;
        }

        .calibration-hero.underconfident .calibration-hero-status {
          color: #3b82f6;
        }

        .calibration-hero.calibrated .calibration-hero-status {
          color: #10b981;
        }

        .calibration-hero-detail {
          font-size: 18px;
          color: #e5e5e5;
          margin-bottom: 8px;
        }

        .calibration-hero-problem {
          font-size: 16px;
          color: #a8a8a8;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Memory Strategy Breakdown */
        .calibration-strategy-breakdown {
          margin: 0 40px 32px;
          padding: 24px;
          background: #0a0a0a;
          border-radius: 16px;
        }

        .calibration-strategy-title {
          font-size: 18px;
          font-weight: 600;
          color: #8b5cf6;
          margin-bottom: 20px;
        }

        .calibration-strategy-item {
          margin-bottom: 16px;
        }

        .calibration-strategy-item:last-child {
          margin-bottom: 0;
        }

        .calibration-strategy-bar {
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 16px;
          margin-bottom: 8px;
          min-width: 80px;
          transition: all 0.3s ease;
        }

        .calibration-strategy-percentage {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }

        .calibration-strategy-item.best .calibration-strategy-bar {
          background: #10b981;
        }

        .calibration-strategy-item.good .calibration-strategy-bar {
          background: #f59e0b;
        }

        .calibration-strategy-item.okay .calibration-strategy-bar {
          background: #f59e0b;
        }

        .calibration-strategy-item.worst .calibration-strategy-bar {
          background: #ef4444;
        }

        .calibration-strategy-label {
          font-size: 15px;
          color: #e5e5e5;
          padding-left: 4px;
        }

        /* Bar Chart Section */
        .calibration-bars {
          margin: 0 40px 32px;
          padding: 24px;
          background: #0a0a0a;
          border-radius: 16px;
        }

        .calibration-bars-title {
          font-size: 18px;
          font-weight: 600;
          color: #8b5cf6;
          margin-bottom: 24px;
        }

        .calibration-bar-row {
          margin-bottom: 24px;
        }

        .calibration-bar-row:last-child {
          margin-bottom: 0;
        }

        .calibration-bar-label {
          font-size: 14px;
          color: #a8a8a8;
          margin-bottom: 8px;
        }

        .calibration-bar-container {
          position: relative;
        }

        .calibration-bar-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .calibration-bar {
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          min-width: 60px;
        }

        .calibration-bar.confidence {
          background: rgba(139, 92, 246, 0.3);
          color: #8b5cf6;
        }

        .calibration-bar.actual {
          color: #fff;
        }

        .calibration-bar.actual.lower {
          background: #ef4444;
        }

        .calibration-bar.actual.higher {
          background: #3b82f6;
        }

        .calibration-bar.actual.matched {
          background: #10b981;
        }

      `}</style>
    </div>
  );
}
