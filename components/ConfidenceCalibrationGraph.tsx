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

      <div className="calibration-simple-cards">
        {calibrationData.map(d => {
          const diff = d.actualAccuracy - d.confidence;
          const isOverconfident = diff < -5;
          const isUnderconfident = diff > 5;

          return (
            <div key={d.confidence} className="calibration-simple-card">
              <div className="calibration-simple-header">
                When you felt <strong>{d.confidence}% confident</strong>
              </div>
              <div className="calibration-simple-result">
                You got <strong className={`calibration-simple-accuracy ${isOverconfident ? 'overconfident' : isUnderconfident ? 'underconfident' : 'calibrated'}`}>
                  {d.actualAccuracy.toFixed(0)}%
                </strong> correct
              </div>
              <div className="calibration-simple-count">
                ({d.count} question{d.count !== 1 ? 's' : ''})
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

        .calibration-simple-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .calibration-simple-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1200px) {
          .calibration-simple-cards {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .calibration-simple-card {
          padding: 24px;
          background: #0f0f0f;
          border-radius: 16px;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          text-align: center;
        }

        .calibration-simple-header {
          font-size: 16px;
          color: #a8a8a8;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .calibration-simple-header strong {
          color: #8b5cf6;
          font-weight: 600;
        }

        .calibration-simple-result {
          font-size: 18px;
          color: #e5e5e5;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .calibration-simple-accuracy {
          font-size: 32px;
          font-weight: 700;
          display: block;
          margin: 8px 0;
        }

        .calibration-simple-accuracy.calibrated {
          color: #10b981;
        }

        .calibration-simple-accuracy.overconfident {
          color: #f59e0b;
        }

        .calibration-simple-accuracy.underconfident {
          color: #3b82f6;
        }

        .calibration-simple-count {
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
