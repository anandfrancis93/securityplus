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
 * Generate insights for a confidence level
 */
function generateInsights(data: CalibrationDataPoint): Array<{ text: string; correct: boolean }> {
  const insights: Array<{ text: string; correct: boolean }> = [];

  // Analyze each reflection type
  if (data.reflection.knew > 0) {
    const knewCorrect = Math.round((data.reflection.knew / data.count) * data.actualAccuracy / 100 * data.count);
    const knewIncorrect = data.reflection.knew - knewCorrect;

    if (knewCorrect > 0) {
      insights.push({
        text: `Recalled from memory and got ${knewCorrect} correct`,
        correct: true
      });
    }
    if (knewIncorrect > 0) {
      insights.push({
        text: `Thought you recalled ${knewIncorrect} but they were wrong - possible false memory`,
        correct: false
      });
    }
  }

  if (data.reflection.recognized > 0) {
    const recognizedCorrect = Math.round((data.reflection.recognized / data.count) * data.actualAccuracy / 100 * data.count);
    const recognizedIncorrect = data.reflection.recognized - recognizedCorrect;

    if (recognizedCorrect > 0) {
      insights.push({
        text: `Recognized the answer after seeing options - ${recognizedCorrect} correct`,
        correct: true
      });
    }
    if (recognizedIncorrect > 0) {
      insights.push({
        text: `Recognized ${recognizedIncorrect} answers but they were wrong - misleading familiarity`,
        correct: false
      });
    }
  }

  if (data.reflection.narrowed > 0) {
    const narrowedCorrect = Math.round((data.reflection.narrowed / data.count) * data.actualAccuracy / 100 * data.count);
    const narrowedIncorrect = data.reflection.narrowed - narrowedCorrect;

    if (narrowedCorrect > 0) {
      insights.push({
        text: `Used logic to narrow down and got ${narrowedCorrect} correct - good reasoning`,
        correct: true
      });
    }
    if (narrowedIncorrect > 0) {
      insights.push({
        text: `Narrowed down ${narrowedIncorrect} but chose wrong - review elimination strategies`,
        correct: false
      });
    }
  }

  if (data.reflection.guessed > 0) {
    const guessedCorrect = Math.round((data.reflection.guessed / data.count) * data.actualAccuracy / 100 * data.count);
    const guessedIncorrect = data.reflection.guessed - guessedCorrect;

    if (guessedCorrect > 0) {
      insights.push({
        text: `Random guessed ${guessedCorrect} and got lucky`,
        correct: true
      });
    }
    if (guessedIncorrect > 0) {
      insights.push({
        text: `Random guessed ${guessedIncorrect} incorrectly - need to study this area`,
        correct: false
      });
    }
  }

  return insights;
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

  const [isExpanded, setIsExpanded] = React.useState(false);

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

      {/* Memory Strategy Warnings */}
      {warnings.length > 0 && (
        <div className="calibration-warnings">
          {warnings.map((warning, idx) => (
            <div
              key={idx}
              className={`calibration-warning-item ${warning.startsWith('✓') ? 'positive' : 'warning'}`}
            >
              {warning}
            </div>
          ))}
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

      {/* Detailed Breakdown - Collapsible */}
      <button
        className="calibration-toggle-details"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="calibration-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="calibration-toggle-text">
          {isExpanded ? 'Hide' : 'Show'} detailed breakdown
        </span>
      </button>

      {isExpanded && (
        <div className="calibration-content">

      <div className="calibration-insights">
        {calibrationData.map(d => {
          const insights = generateInsights(d);

          return (
            <div key={d.confidence} className="calibration-insight-card">
              <div className="calibration-insight-header">
                {getConfidenceLabel(d.confidence)}
              </div>
              <div className="calibration-insight-content">
                {insights.map((insight, idx) => (
                  <div key={idx} className={`calibration-insight-item ${insight.correct ? 'correct' : 'incorrect'}`}>
                    <span className="calibration-insight-icon">{insight.correct ? '✓' : '✗'}</span>
                    <span className="calibration-insight-text">{insight.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
        </div>
      )}

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

        /* Memory Strategy Warnings */
        .calibration-warnings {
          margin: 0 40px 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .calibration-warning-item {
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 15px;
          line-height: 1.6;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .calibration-warning-item.warning {
          background: rgba(245, 158, 11, 0.1);
          border: 2px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        .calibration-warning-item.positive {
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
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

        /* Toggle Details Button */
        .calibration-toggle-details {
          width: 100%;
          padding: 20px 40px;
          background: transparent;
          border: none;
          border-top: 1px solid #1a1a1a;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .calibration-toggle-details:hover {
          background: rgba(139, 92, 246, 0.05);
        }

        .calibration-toggle-icon {
          font-size: 14px;
          color: #8b5cf6;
        }

        .calibration-toggle-text {
          font-size: 16px;
          color: #8b5cf6;
          font-weight: 600;
        }

        .calibration-content {
          padding: 0 40px 40px;
          border-top: 1px solid #1a1a1a;
          padding-top: 32px;
        }

        .calibration-insights {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .calibration-insight-card {
          padding: 24px;
          background: #0f0f0f;
          border-radius: 16px;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .calibration-insight-header {
          font-size: 18px;
          font-weight: 700;
          color: #8b5cf6;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #1a1a1a;
        }

        .calibration-insight-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .calibration-insight-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: #0a0a0a;
          line-height: 1.6;
        }

        .calibration-insight-item.correct {
          border-left: 3px solid #10b981;
        }

        .calibration-insight-item.incorrect {
          border-left: 3px solid #ef4444;
        }

        .calibration-insight-icon {
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .calibration-insight-item.correct .calibration-insight-icon {
          color: #10b981;
        }

        .calibration-insight-item.incorrect .calibration-insight-icon {
          color: #ef4444;
        }

        .calibration-insight-text {
          font-size: 15px;
          color: #e5e5e5;
        }
      `}</style>
    </div>
  );
}
