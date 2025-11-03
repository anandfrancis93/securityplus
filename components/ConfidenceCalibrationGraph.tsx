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
  const [isCardExpanded, setIsCardExpanded] = React.useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false);
  const [hoveredButton, setHoveredButton] = React.useState(false);

  if (calibrationData.length === 0) {
    return null; // Don't show anything if there's no data
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

  // Add perfect calibration line data
  const perfectCalibrationLine = [
    { confidence: 0, actualAccuracy: 0 },
    { confidence: 100, actualAccuracy: 100 },
  ];

  return (
    <div className="calibration-container">
      {/* Collapsible Header */}
      <div className="calibration-header">
        <div className="calibration-header-content">
          <h2 className="calibration-title">Metacognition</h2>
          <button
            className="calibration-expand-button"
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            onMouseEnter={() => setHoveredButton(true)}
            onMouseLeave={() => setHoveredButton(false)}
            aria-label="Toggle Metacognition"
          >
            <svg
              className="calibration-expand-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              style={{ transform: isCardExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isCardExpanded && (
        <div className="calibration-expanded-content">
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

      {/* Visual Comparison - Bar Chart (Collapsible) */}
      <div className="calibration-details-section">
        <button
          className="calibration-toggle-details"
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
        >
          <svg
            className="calibration-toggle-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            style={{ transform: isDetailsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span className="calibration-toggle-text">
            Your Confidence vs Actual Performance
          </span>
        </button>

        {isDetailsExpanded && (
          <div className="calibration-bars">
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
        )}
      </div>
        </div>
      )}

      <style jsx>{`
        .calibration-container {
          background: #0f0f0f;
          border-radius: 24px;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          margin-bottom: 48px;
          overflow: hidden;
        }

        .calibration-header {
          position: relative;
          padding: 40px;
        }

        .calibration-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .calibration-title {
          font-size: 36px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0;
          letter-spacing: -0.025em;
        }

        .calibration-expand-button {
          padding: 16px;
          background: #0f0f0f;
          border-radius: 16px;
          box-shadow: 8px 8px 16px #050505, -8px -8px 16px #191919;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calibration-expand-button:hover {
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        .calibration-expand-icon {
          width: 32px;
          height: 32px;
          color: #a8a8a8;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .calibration-expanded-content {
          padding-bottom: 20px;
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
          color: #e5e5e5;
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

        /* Details Section Container */
        .calibration-details-section {
          margin: 0 40px 32px;
          background: #0a0a0a;
          border-radius: 16px;
          overflow: hidden;
        }

        /* Toggle Details Button */
        .calibration-toggle-details {
          width: 100%;
          padding: 20px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .calibration-toggle-details:hover {
          background: rgba(18, 18, 18, 0.5);
        }

        .calibration-toggle-icon {
          width: 20px;
          height: 20px;
          color: #e5e5e5;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .calibration-toggle-text {
          font-size: 18px;
          color: #e5e5e5;
          font-weight: 600;
        }

        /* Bar Chart Section */
        .calibration-bars {
          padding: 24px 24px 24px 24px;
          background: transparent;
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
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
        }

        .calibration-bar.actual {
          background: rgba(139, 92, 246, 0.6);
          color: #fff;
        }

        .calibration-bar.actual.lower {
          background: rgba(139, 92, 246, 0.6);
        }

        .calibration-bar.actual.higher {
          background: rgba(139, 92, 246, 0.6);
        }

        .calibration-bar.actual.matched {
          background: rgba(139, 92, 246, 0.6);
        }

      `}</style>
    </div>
  );
}
