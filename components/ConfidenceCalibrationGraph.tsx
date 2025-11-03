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
            <h2 className="calibration-title">Confidence Calibration</h2>
          </div>
          <div className={`calibration-score ${isWellCalibrated ? 'calibration-score-good' : 'calibration-score-poor'}`}>
            <span className="calibration-score-label">Score:</span>
            <span className="calibration-score-value">{calibrationScore.toFixed(1)}%</span>
            <span className="calibration-score-status">
              {isWellCalibrated ? ' (Well Calibrated)' : ' (Needs Improvement)'}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="calibration-content">

      <div className="calibration-description">
        <p>
          This graph shows how well your confidence matches your actual performance.
          Points on the diagonal line indicate perfect calibration. Points above the line mean overconfidence,
          points below mean underconfidence.
        </p>
      </div>

      <div className="calibration-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={calibrationData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="confidence"
              label={{ value: 'Your Confidence (%)', position: 'insideBottom', offset: -10, fill: '#e5e5e5' }}
              stroke="#a8a8a8"
              tick={{ fill: '#e5e5e5' }}
              domain={[0, 100]}
            />
            <YAxis
              label={{ value: 'Actual Accuracy (%)', angle: -90, position: 'insideLeft', fill: '#e5e5e5' }}
              stroke="#a8a8a8"
              tick={{ fill: '#e5e5e5' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '12px',
                color: '#e5e5e5',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'actualAccuracy') {
                  return [`${value.toFixed(1)}%`, 'Actual Accuracy'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Confidence: ${label}%`}
            />
            <Legend wrapperStyle={{ color: '#e5e5e5' }} />

            {/* Perfect calibration reference line */}
            <Line
              data={perfectCalibrationLine}
              type="monotone"
              dataKey="actualAccuracy"
              stroke="#666666"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Perfect Calibration"
              legendType="line"
            />

            {/* Your actual calibration */}
            <Line
              type="monotone"
              dataKey="actualAccuracy"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 6 }}
              activeDot={{ r: 8 }}
              name="Your Calibration"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="calibration-details">
        <h3 className="calibration-details-title">Breakdown by Confidence Level</h3>
        <div className="calibration-details-grid">
          {calibrationData.map(d => {
            const diff = d.actualAccuracy - d.confidence;
            const isOverconfident = diff < -5;
            const isUnderconfident = diff > 5;
            const isCalibrated = !isOverconfident && !isUnderconfident;

            return (
              <div key={d.confidence} className="calibration-detail-card">
                <div className="calibration-detail-header">
                  <span className="calibration-detail-confidence">{d.confidence}% Confidence</span>
                  <span className="calibration-detail-count">({d.count} question{d.count !== 1 ? 's' : ''})</span>
                </div>
                <div className="calibration-detail-accuracy">
                  <span className="calibration-detail-label">Actual:</span>
                  <span className={`calibration-detail-value ${isOverconfident ? 'overconfident' : isUnderconfident ? 'underconfident' : 'calibrated'}`}>
                    {d.actualAccuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="calibration-detail-status">
                  {isOverconfident && 'Overconfident'}
                  {isUnderconfident && 'Underconfident'}
                  {isCalibrated && 'Well Calibrated'}
                </div>
                <div className="calibration-detail-reflection">
                  <div className="calibration-detail-reflection-item">Knew: {d.reflection.knew}</div>
                  <div className="calibration-detail-reflection-item">Recognized: {d.reflection.recognized}</div>
                  <div className="calibration-detail-reflection-item">Narrowed: {d.reflection.narrowed}</div>
                  <div className="calibration-detail-reflection-item">Guessed: {d.reflection.guessed}</div>
                </div>
              </div>
            );
          })}
        </div>
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
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
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
          font-size: 24px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0;
        }

        @media (min-width: 768px) {
          .calibration-title {
            font-size: 32px;
          }
        }

        .calibration-content {
          padding: 0 48px 48px;
        }

        @media (min-width: 768px) {
          .calibration-content {
            padding: 0 64px 64px;
          }
        }

        .calibration-score {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: #0f0f0f;
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        .calibration-score-label {
          font-size: 14px;
          color: #a8a8a8;
        }

        .calibration-score-value {
          font-size: 24px;
          font-weight: 700;
        }

        .calibration-score-good .calibration-score-value {
          color: #10b981;
        }

        .calibration-score-poor .calibration-score-value {
          color: #f59e0b;
        }

        .calibration-score-status {
          font-size: 14px;
          color: #a8a8a8;
        }

        .calibration-description {
          margin-bottom: 32px;
          padding: 20px;
          background: #0f0f0f;
          border-radius: 12px;
          box-shadow: inset 2px 2px 4px #050505, inset -2px -2px 4px #191919;
        }

        .calibration-description p {
          margin: 0;
          font-size: 16px;
          color: #a8a8a8;
          line-height: 1.6;
        }

        .calibration-chart-container {
          margin-bottom: 48px;
        }

        .calibration-details-title {
          font-size: 24px;
          font-weight: 700;
          color: #e5e5e5;
          margin: 0 0 24px;
        }

        .calibration-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .calibration-detail-card {
          padding: 24px;
          background: #0f0f0f;
          border-radius: 16px;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        .calibration-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .calibration-detail-confidence {
          font-size: 18px;
          font-weight: 700;
          color: #e5e5e5;
        }

        .calibration-detail-count {
          font-size: 14px;
          color: #a8a8a8;
        }

        .calibration-detail-accuracy {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .calibration-detail-label {
          font-size: 14px;
          color: #a8a8a8;
        }

        .calibration-detail-value {
          font-size: 24px;
          font-weight: 700;
        }

        .calibration-detail-value.calibrated {
          color: #10b981;
        }

        .calibration-detail-value.overconfident {
          color: #f59e0b;
        }

        .calibration-detail-value.underconfident {
          color: #3b82f6;
        }

        .calibration-detail-status {
          font-size: 14px;
          margin-bottom: 16px;
          padding: 8px 12px;
          border-radius: 8px;
          background: #0f0f0f;
          box-shadow: inset 2px 2px 4px #050505, inset -2px -2px 4px #191919;
          text-align: center;
        }

        .calibration-detail-reflection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 12px;
          color: #a8a8a8;
        }

        .calibration-detail-reflection-item {
          padding: 4px 8px;
          background: #0f0f0f;
          border-radius: 6px;
          box-shadow: inset 1px 1px 2px #050505, inset -1px -1px 2px #191919;
        }
      `}</style>
    </div>
  );
}
