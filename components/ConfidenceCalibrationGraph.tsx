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

  // Add perfect calibration line data
  const perfectCalibrationLine = [
    { confidence: 0, actualAccuracy: 0 },
    { confidence: 100, actualAccuracy: 100 },
  ];

  return (
    <div className="calibration-container">
      <button
        className="calibration-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="calibration-toggle-content">
          <div className="calibration-toggle-left">
            <span className="calibration-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
            <h2 className="calibration-title">How accurate is your confidence?</h2>
          </div>
        </div>
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

        .calibration-toggle {
          width: 100%;
          padding: 32px 48px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .calibration-toggle:hover {
          background: rgba(139, 92, 246, 0.05);
        }

        @media (min-width: 768px) {
          .calibration-toggle {
            padding: 40px 64px;
          }
        }

        .calibration-toggle-content {
          display: flex;
          align-items: center;
        }

        .calibration-toggle-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .calibration-toggle-icon {
          font-size: 20px;
          color: #8b5cf6;
        }

        .calibration-title {
          font-size: 20px;
          font-weight: 600;
          color: #e5e5e5;
          margin: 0;
        }

        @media (min-width: 768px) {
          .calibration-title {
            font-size: 24px;
          }
        }

        .calibration-content {
          padding: 0 32px 32px;
        }

        @media (min-width: 768px) {
          .calibration-content {
            padding: 0 64px 64px;
          }
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
