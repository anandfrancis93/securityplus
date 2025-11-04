'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
  TooltipProps,
  Cell,
  ErrorBar,
  Area,
  ComposedChart,
} from 'recharts';
import { UserProgress } from '@/lib/types';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';
import { estimateAbilityWithError } from '@/lib/irt';
import { calculateIRTConfidenceInterval } from '@/lib/confidenceIntervals';

interface PerformanceGraphsProps {
  userProgress: UserProgress | null;
}

// Helper function to get color based on ability level
const getAbilityColor = (ability: number) => {
  if (ability >= 1.54) return '#10b981'; // Emerald for passing
  if (ability >= 0) return '#f59e0b'; // Amber for marginal
  return '#f43f5e'; // Rose for failing
};

// Custom tooltip for Ability Level Over Time
const AbilityTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#0f0f0f',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
      }}>
        <p style={{ color: '#e5e5e5', fontSize: '14px', margin: 0 }}>
          {data.ciLower.toFixed(2)} to {data.ciUpper.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for Predicted Score Over Time
const ScoreTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#0f0f0f',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
      }}>
        <p style={{ color: '#e5e5e5', fontSize: '14px', margin: 0 }}>
          {data.scoreLower} to {data.scoreUpper}
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip component for bar charts
const CustomBarTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        position: 'relative',
        backgroundColor: '#0f0f0f',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919'
      }}>
        <p style={{
          color: '#e5e5e5',
          fontWeight: 'bold',
          marginBottom: '12px',
          fontSize: '18px',
          marginTop: 0
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '16px',
          marginBottom: '16px',
          fontWeight: '500',
          color: color || '#8b5cf6',
          marginTop: 0
        }}>
          Accuracy: {payload[0].value}% ({payload[0].payload.questions} questions)
        </p>
        <div style={{
          borderTop: '1px solid #191919',
          paddingTop: '16px'
        }}>
          <p style={{ fontSize: '14px', color: '#a8a8a8', fontWeight: '500', marginTop: 0, marginBottom: '8px' }}>
            Performance Ranges:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: '#f43f5e' }}></div>
            <span style={{ fontSize: '14px', color: '#e5e5e5' }}>&lt; 70% (Low)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: '#f59e0b' }}></div>
            <span style={{ fontSize: '14px', color: '#e5e5e5' }}>70-84% (Good)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: '#10b981' }}></div>
            <span style={{ fontSize: '14px', color: '#e5e5e5' }}>≥ 85% (Excellent)</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PerformanceGraphs({ userProgress }: PerformanceGraphsProps) {
  const [isAbilityGraphOpen, setIsAbilityGraphOpen] = useState(false);
  const [isPredictedScoreGraphOpen, setIsPredictedScoreGraphOpen] = useState(false);
  const [isAccuracyByDifficultyOpen, setIsAccuracyByDifficultyOpen] = useState(false);
  const [isPerformanceByDomainOpen, setIsPerformanceByDomainOpen] = useState(false);
  const [isTopicCoverageOpen, setIsTopicCoverageOpen] = useState(false);
  const [openDomainTables, setOpenDomainTables] = useState<{ [key: string]: boolean }>({});

  const toggleDomainTable = (domain: string) => {
    setOpenDomainTables(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  if (!userProgress || userProgress.totalQuestions === 0) {
    return (
      <div style={{
        position: 'relative',
        backgroundColor: '#0f0f0f',
        borderRadius: '24px',
        padding: '64px',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        textAlign: 'center'
      }}>
        <p style={{
          color: '#a8a8a8',
          fontSize: '24px',
          margin: 0
        }}>
          Take quizzes to see your progress charts
        </p>
      </div>
    );
  }

  // Graph 1: Ability Level Over Time with Confidence Intervals
  // Sort quizzes by startedAt timestamp to ensure correct chronological order
  const sortedQuizHistory = [...userProgress.quizHistory].sort((a, b) => a.startedAt - b.startedAt);

  const abilityOverTime = sortedQuizHistory.map((quiz, index) => {
    // Calculate ability up to this quiz using sorted history
    const attemptsUpToNow = sortedQuizHistory
      .slice(0, index + 1)
      .flatMap(q => q.questions);

    // Estimate ability with standard error for this point in time
    const { theta, standardError } = estimateAbilityWithError(attemptsUpToNow);
    const abilityCI = calculateIRTConfidenceInterval(theta, standardError);

    // Use quiz ID for stable identification (extract quiz number if present in ID)
    const quizLabel = quiz.id.includes('quiz_')
      ? `Quiz ${quiz.id.split('_')[1] || index + 1}`
      : `Quiz ${index + 1}`;

    return {
      quiz: quizLabel,
      quizId: quiz.id,  // Store quiz ID for stable reference
      ability: parseFloat(theta.toFixed(2)),
      abilityError: [parseFloat((theta - abilityCI.lower).toFixed(2)), parseFloat((abilityCI.upper - theta).toFixed(2))],
      ciLower: abilityCI.lower,
      ciUpper: abilityCI.upper,
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  // Graph 2: Predicted Score Over Time with Confidence Intervals
  // Use sorted quiz history to match abilityOverTime
  const scoreOverTime = sortedQuizHistory.map((quiz, index) => {
    const ability = abilityOverTime[index].ability;
    const ciLower = abilityOverTime[index].ciLower;
    const ciUpper = abilityOverTime[index].ciUpper;

    // Map ability to score (same logic as calculateIRTScore)
    const baseScore = 550;
    const scaleFactor = 130;
    const score = Math.max(100, Math.min(900, Math.round(baseScore + (ability * scaleFactor))));
    const scoreLower = Math.max(100, Math.min(900, Math.round(baseScore + (ciLower * scaleFactor))));
    const scoreUpper = Math.max(100, Math.min(900, Math.round(baseScore + (ciUpper * scaleFactor))));

    // Use same quiz label logic as abilityOverTime
    const quizLabel = quiz.id.includes('quiz_')
      ? `Quiz ${quiz.id.split('_')[1] || index + 1}`
      : `Quiz ${index + 1}`;

    // Calculate error bar as array [lower, upper] for ErrorBar component
    const scoreError = [score - scoreLower, scoreUpper - score];

    return {
      quiz: quizLabel,
      quizId: quiz.id,
      score,
      scoreLower,
      scoreUpper,
      scoreError,  // Array [lower distance, upper distance] for ErrorBar
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  // Graph 3: Accuracy by Difficulty (using points for partial credit)
  const difficultyStats: { [key: string]: { points: number; maxPoints: number; correct: number; total: number } } = {
    easy: { points: 0, maxPoints: 0, correct: 0, total: 0 },
    medium: { points: 0, maxPoints: 0, correct: 0, total: 0 },
    hard: { points: 0, maxPoints: 0, correct: 0, total: 0 },
  };

  userProgress.quizHistory.forEach(quiz => {
    quiz.questions.forEach(attempt => {
      const diff = attempt.question.difficulty || 'medium';
      difficultyStats[diff].total += 1;
      difficultyStats[diff].points += attempt.pointsEarned;
      difficultyStats[diff].maxPoints += attempt.maxPoints;
      if (attempt.isCorrect) {
        difficultyStats[diff].correct += 1;
      }
    });
  });

  const accuracyByDifficulty = [
    {
      difficulty: 'Easy',
      accuracy: difficultyStats.easy.maxPoints > 0
        ? Math.round((difficultyStats.easy.points / difficultyStats.easy.maxPoints) * 100)
        : 0,
      questions: difficultyStats.easy.total,
    },
    {
      difficulty: 'Medium',
      accuracy: difficultyStats.medium.maxPoints > 0
        ? Math.round((difficultyStats.medium.points / difficultyStats.medium.maxPoints) * 100)
        : 0,
      questions: difficultyStats.medium.total,
    },
    {
      difficulty: 'Hard',
      accuracy: difficultyStats.hard.maxPoints > 0
        ? Math.round((difficultyStats.hard.points / difficultyStats.hard.maxPoints) * 100)
        : 0,
      questions: difficultyStats.hard.total,
    },
  ];

  // Graph 4: Topic Performance Breakdown by Domain
  // Count unique questions per domain (not topic occurrences)
  // Track points for partial credit accuracy
  const domainStats: { [domain: string]: { questionIds: Set<string>; correctQuestionIds: Set<string>; points: number; maxPoints: number } } = {};

  // Build a map of questionId -> domains for that question
  userProgress.quizHistory.forEach(quiz => {
    quiz.questions.forEach(attempt => {
      const topics = attempt.question.topics || [];
      const questionId = attempt.questionId;

      // Get all domains for this question's topics
      const domainsForQuestion = new Set<string>();
      Object.values(userProgress.topicPerformance || {}).forEach(topicPerf => {
        if (topics.includes(topicPerf.topicName)) {
          domainsForQuestion.add(topicPerf.domain);
        }
      });

      // Count this question once per domain it appears in
      // Track points for partial credit
      domainsForQuestion.forEach(domain => {
        if (!domainStats[domain]) {
          domainStats[domain] = {
            questionIds: new Set<string>(),
            correctQuestionIds: new Set<string>(),
            points: 0,
            maxPoints: 0
          };
        }
        domainStats[domain].questionIds.add(questionId);
        // Add points for this question (even if question appears in multiple domains, count points once per domain)
        domainStats[domain].points += attempt.pointsEarned;
        domainStats[domain].maxPoints += attempt.maxPoints;
        if (attempt.isCorrect) {
          domainStats[domain].correctQuestionIds.add(questionId);
        }
      });
    });
  });

  const domainPerformance = Object.entries(domainStats).map(([domain, stats]) => {
    // Extract domain number (e.g., "1." from "1.0 General Security Concepts")
    const domainNum = domain.split(' ')[0].replace('.0', '.');
    const domainName = domain.replace(/^\d+\.\d+\s+/, ''); // Remove "1.0 " prefix

    const totalQuestions = stats.questionIds.size;
    const correctQuestions = stats.correctQuestionIds.size;

    return {
      domain: domainName,
      domainNum,
      accuracy: stats.maxPoints > 0 ? Math.round((stats.points / stats.maxPoints) * 100) : 0,
      questions: totalQuestions,
    };
  }).sort((a, b) => a.domainNum.localeCompare(b.domainNum));

  // Use the same topic list as quiz generation to ensure consistency
  const allTopicsByDomain = ALL_SECURITY_PLUS_TOPICS;

  // Build coverage data for all topics
  const topicCoverageData: { [domain: string]: { topicName: string; count: number; accuracy: number }[] } = {};

  // Initialize all domains with all topics set to 0
  Object.entries(allTopicsByDomain).forEach(([domain, topics]) => {
    topicCoverageData[domain] = topics.map(topicName => ({
      topicName,
      count: 0,
      accuracy: 0
    }));
  });

  // Fill in actual coverage data from userProgress
  Object.values(userProgress.topicPerformance || {}).forEach(topicPerf => {
    const domain = topicPerf.domain;
    if (topicCoverageData[domain]) {
      const topicIndex = topicCoverageData[domain].findIndex(t => t.topicName === topicPerf.topicName);
      if (topicIndex !== -1) {
        topicCoverageData[domain][topicIndex] = {
          topicName: topicPerf.topicName,
          count: topicPerf.questionsAnswered,
          accuracy: Math.round(topicPerf.accuracy)
        };
      }
      // Ignore topics not in official list (AI-created topics)
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Graph 1: Ability Level Over Time */}
      <div style={{
        position: 'relative',
        backgroundColor: '#0f0f0f',
        borderRadius: '24px',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <h3 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 'bold',
            color: '#e5e5e5',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            Ability Level Over Time
          </h3>
          <button
            onClick={() => setIsAbilityGraphOpen(!isAbilityGraphOpen)}
            style={{
              padding: '16px',
              background: '#0f0f0f',
              borderRadius: '16px',
              boxShadow: isAbilityGraphOpen
                ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                : '8px 8px 16px #050505, -8px -8px 16px #191919',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Ability Level Over Time"
          >
            <svg
              style={{
                width: '32px',
                height: '32px',
                color: '#a8a8a8',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isAbilityGraphOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
        {isAbilityGraphOpen && (
          <div style={{ padding: '0 clamp(8px, 2vw, 48px) clamp(32px, 6vw, 48px) clamp(8px, 2vw, 48px)', overflowX: 'auto', overflowY: 'hidden' }}>
            <LineChart
              width={Math.max(600, abilityOverTime.length * 200)}
              height={400}
              data={abilityOverTime}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                {/* Define individual gradients for each data point based on ability level */}
                {abilityOverTime.map((point, index) => {
                  const color = getAbilityColor(point.ability);
                  return (
                    <linearGradient key={`gradient-${index}`} id={`abilityGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#191919" />
              <XAxis dataKey="quiz" stroke="#a8a8a8" tick={{ fill: '#a8a8a8' }} label={{ value: 'Quiz', position: 'insideBottom', offset: -10, fill: '#a8a8a8' }} />
              <YAxis domain={[-3, 3]} stroke="#a8a8a8" label={{ value: 'Ability Level', angle: -90, position: 'insideLeft', fill: '#a8a8a8', style: { textAnchor: 'middle' } }} />
              <Tooltip content={<AbilityTooltip />} />
              <ReferenceLine y={1.54} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Passing (750)', fill: '#10b981', position: 'right' }} />

              {/* Render colored confidence bands as reference areas between consecutive points */}
              {abilityOverTime.map((point, index) => {
                if (index === abilityOverTime.length - 1) return null;

                const nextPoint = abilityOverTime[index + 1];
                const avgAbility = (point.ability + nextPoint.ability) / 2;
                const color = getAbilityColor(avgAbility);

                return (
                  <ReferenceArea
                    key={`ci-band-${index}`}
                    x1={point.quiz}
                    x2={nextPoint.quiz}
                    y1={Math.min(point.ciLower, nextPoint.ciLower)}
                    y2={Math.max(point.ciUpper, nextPoint.ciUpper)}
                    fill={color}
                    fillOpacity={0.2}
                    strokeOpacity={0}
                  />
                );
              })}

              {/* Main ability line */}
              <Line
                type="monotone"
                dataKey="ability"
                stroke="#e5e5e5"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const ability = payload.ability;
                  const fill = getAbilityColor(ability);
                  return <circle cx={cx} cy={cy} r={5} fill={fill} />;
                }}
              >
                <ErrorBar dataKey="abilityError" width={4} stroke="#666666" strokeWidth={2} direction="y" />
              </Line>
            </LineChart>
          </div>
        )}
      </div>

      {/* Graph 2: Predicted Score Over Time */}
      <div style={{
        position: 'relative',
        backgroundColor: '#0f0f0f',
        borderRadius: '24px',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <h3 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 'bold',
            color: '#e5e5e5',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            Predicted Score Over Time
          </h3>
          <button
            onClick={() => setIsPredictedScoreGraphOpen(!isPredictedScoreGraphOpen)}
            style={{
              padding: '16px',
              background: '#0f0f0f',
              borderRadius: '16px',
              boxShadow: isPredictedScoreGraphOpen
                ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                : '8px 8px 16px #050505, -8px -8px 16px #191919',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Predicted Score Over Time"
          >
            <svg
              style={{
                width: '32px',
                height: '32px',
                color: '#a8a8a8',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isPredictedScoreGraphOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
        {isPredictedScoreGraphOpen && (
          <div style={{ padding: '0 clamp(8px, 2vw, 48px) clamp(32px, 6vw, 48px) clamp(8px, 2vw, 48px)', overflowX: 'auto', overflowY: 'hidden' }}>
            <LineChart
              width={Math.max(600, scoreOverTime.length * 200)}
              height={400}
              data={scoreOverTime}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                {/* Define individual gradients for confidence bands based on score */}
                {scoreOverTime.map((point, index) => {
                  const score = point.score;
                  const color = score >= 800 ? '#10b981' : score >= 750 ? '#f59e0b' : '#f43f5e';
                  return (
                    <linearGradient key={`score-gradient-${index}`} id={`scoreGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#191919" />
              <XAxis dataKey="quiz" stroke="#a8a8a8" tick={{ fill: '#a8a8a8' }} label={{ value: 'Quiz', position: 'insideBottom', offset: -10, fill: '#a8a8a8' }} />
              <YAxis domain={[100, 900]} stroke="#a8a8a8" label={{ value: 'Exam Score', angle: -90, position: 'insideLeft', fill: '#a8a8a8', style: { textAnchor: 'middle' } }} />
              <Tooltip content={<ScoreTooltip />} />
              <ReferenceLine y={750} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Passing (750)', fill: '#10b981', position: 'right' }} />

              {/* Colored confidence bands between consecutive points */}
              {scoreOverTime.map((point, index) => {
                if (index === scoreOverTime.length - 1) return null;

                const nextPoint = scoreOverTime[index + 1];
                const avgScore = (point.score + nextPoint.score) / 2;
                const color = avgScore >= 800 ? '#10b981' : avgScore >= 750 ? '#f59e0b' : '#f43f5e';

                return (
                  <ReferenceArea
                    key={`score-ci-band-${index}`}
                    x1={point.quiz}
                    x2={nextPoint.quiz}
                    y1={Math.min(point.scoreLower, nextPoint.scoreLower)}
                    y2={Math.max(point.scoreUpper, nextPoint.scoreUpper)}
                    fill={color}
                    fillOpacity={0.2}
                    strokeOpacity={0}
                  />
                );
              })}

              <Line
                type="monotone"
                dataKey="score"
                stroke="#e5e5e5"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const score = payload.score;
                  let fill = '#f43f5e'; // Rose for below passing
                  if (score >= 800) fill = '#10b981'; // Emerald for excellent
                  else if (score >= 750) fill = '#f59e0b'; // Amber for passing
                  return <circle cx={cx} cy={cy} r={5} fill={fill} />;
                }}
              >
                <ErrorBar dataKey="scoreError" width={4} stroke="#666666" strokeWidth={2} direction="y" />
              </Line>
            </LineChart>
          </div>
        )}
      </div>

      {/* Graph 3: Accuracy by Difficulty */}
      <div style={{
        position: 'relative',
        backgroundColor: '#0f0f0f',
        borderRadius: '24px',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <h3 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 'bold',
            color: '#e5e5e5',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            Accuracy by Difficulty Level
          </h3>
          <button
            onClick={() => setIsAccuracyByDifficultyOpen(!isAccuracyByDifficultyOpen)}
            style={{
              padding: '16px',
              background: '#0f0f0f',
              borderRadius: '16px',
              boxShadow: isAccuracyByDifficultyOpen
                ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                : '8px 8px 16px #050505, -8px -8px 16px #191919',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Accuracy by Difficulty Level"
          >
            <svg
              style={{
                width: '32px',
                height: '32px',
                color: '#a8a8a8',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isAccuracyByDifficultyOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
        {isAccuracyByDifficultyOpen && (
          <div style={{ padding: '0 48px 48px 48px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={accuracyByDifficulty}>
                <CartesianGrid strokeDasharray="3 3" stroke="#191919" />
                <XAxis dataKey="difficulty" stroke="#a8a8a8" tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#a8a8a8" label={{ value: '% Correct', angle: -90, position: 'insideLeft', fill: '#a8a8a8', style: { textAnchor: 'middle' } }} />
                <Tooltip content={(props) => {
                  if (props.active && props.payload && props.payload.length) {
                    const accuracy = props.payload[0].payload.accuracy;
                    let color = '#f43f5e'; // Rose
                    if (accuracy >= 85) color = '#10b981'; // Emerald
                    else if (accuracy >= 70) color = '#f59e0b'; // Amber
                    return <CustomBarTooltip {...props} color={color} />;
                  }
                  return null;
                }} cursor={{ fill: 'rgba(25, 25, 25, 0.3)' }} />
                <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                  {accuracyByDifficulty.map((entry, index) => {
                    const accuracy = entry.accuracy;
                    let fill = '#f43f5e'; // Rose for low accuracy
                    if (accuracy >= 85) fill = '#10b981'; // Emerald for excellent
                    else if (accuracy >= 70) fill = '#f59e0b'; // Amber for good
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Graph 4: Topic Performance by Domain */}
      {domainPerformance.length > 0 && (
        <div style={{
          position: 'relative',
          backgroundColor: '#0f0f0f',
          borderRadius: '24px',
          boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <h3 style={{
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontWeight: 'bold',
              color: '#e5e5e5',
              margin: 0,
              letterSpacing: '-0.025em'
            }}>
              Performance by SY0-701 Domain
            </h3>
            <button
              onClick={() => setIsPerformanceByDomainOpen(!isPerformanceByDomainOpen)}
              style={{
                padding: '16px',
                background: '#0f0f0f',
                borderRadius: '16px',
                boxShadow: isPerformanceByDomainOpen
                  ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  : '8px 8px 16px #050505, -8px -8px 16px #191919',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Toggle Performance by SY0-701 Domain"
            >
              <svg
                style={{
                  width: '32px',
                  height: '32px',
                  color: '#a8a8a8',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isPerformanceByDomainOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
          {isPerformanceByDomainOpen && (
            <div style={{ padding: '0 48px 48px 48px' }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={domainPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#191919" />
                  <XAxis type="number" domain={[0, 100]} stroke="#a8a8a8" label={{ value: '% Correct', position: 'insideBottom', offset: -5, fill: '#a8a8a8' }} />
                  <YAxis type="category" dataKey="domain" stroke="#a8a8a8" width={60} tick={false} label={{ value: 'Domains', angle: -90, position: 'insideLeft', fill: '#a8a8a8', style: { textAnchor: 'middle' } }} />
                  <Tooltip content={(props) => {
                    if (props.active && props.payload && props.payload.length) {
                      const accuracy = props.payload[0].payload.accuracy;
                      let color = '#f43f5e'; // Rose
                      if (accuracy >= 85) color = '#10b981'; // Emerald
                      else if (accuracy >= 70) color = '#f59e0b'; // Amber
                      return <CustomBarTooltip {...props} color={color} />;
                    }
                    return null;
                  }} cursor={{ fill: 'rgba(25, 25, 25, 0.3)' }} />
                  <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                    {domainPerformance.map((entry, index) => {
                      const accuracy = entry.accuracy;
                      let fill = '#f43f5e'; // Rose for low accuracy
                      if (accuracy >= 85) fill = '#10b981'; // Emerald for excellent
                      else if (accuracy >= 70) fill = '#f59e0b'; // Amber for good
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Topic Coverage Tables by Domain */}
      <div style={{
        position: 'relative',
        backgroundColor: '#0f0f0f',
        borderRadius: '24px',
        boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <h3 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 'bold',
            color: '#e5e5e5',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            Topic Coverage by Domain
          </h3>
          <button
            onClick={() => setIsTopicCoverageOpen(!isTopicCoverageOpen)}
            style={{
              padding: '16px',
              background: '#0f0f0f',
              borderRadius: '16px',
              boxShadow: isTopicCoverageOpen
                ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                : '8px 8px 16px #050505, -8px -8px 16px #191919',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Topic Coverage by Domain"
          >
            <svg
              style={{
                width: '32px',
                height: '32px',
                color: '#a8a8a8',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isTopicCoverageOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
        {isTopicCoverageOpen && (
          <div style={{ padding: '0 48px 48px 48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(topicCoverageData)
            .sort(([domainA], [domainB]) => {
              const numA = domainA.split(' ')[0];
              const numB = domainB.split(' ')[0];
              return numA.localeCompare(numB);
            })
            .map(([domain, topics]) => {
              const domainName = domain.replace(/^\d+\.\d+\s+/, '');
              const domainNum = domain.split(' ')[0].replace('.0', '.');
              const totalCovered = topics.filter(t => t.count > 0).length;
              const totalTopics = topics.length;

              return (
                <div key={domain} style={{
                  position: 'relative',
                  borderRadius: '24px',
                  backgroundColor: '#0f0f0f',
                  boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <h4 style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#e5e5e5',
                      margin: 0,
                      letterSpacing: '-0.025em'
                    }}>
                      <span style={{ marginRight: '8px' }}>{domainNum}</span>{domainName}
                    </h4>
                    <button
                      onClick={() => toggleDomainTable(domain)}
                      style={{
                        padding: '16px',
                        background: '#0f0f0f',
                        borderRadius: '16px',
                        boxShadow: openDomainTables[domain]
                          ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                          : '8px 8px 16px #050505, -8px -8px 16px #191919',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label={`Toggle ${domainName}`}
                    >
                      <svg
                        style={{
                          width: '32px',
                          height: '32px',
                          color: '#a8a8a8',
                          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: openDomainTables[domain] ? 'rotate(180deg)' : 'rotate(0deg)'
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

                  {openDomainTables[domain] && (
                    <div style={{
                      borderTop: '1px solid #191919'
                    }}>
                    <div className="topic-table-scroll" style={{ maxHeight: '384px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{
                          backgroundColor: '#0f0f0f',
                          borderBottom: '1px solid #191919',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                          boxShadow: '4px 4px 8px #050505, -4px -4px 8px #191919'
                        }}>
                          <tr>
                            <th style={{
                              textAlign: 'left',
                              padding: '16px 24px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: '#e5e5e5',
                              width: '60%'
                            }}>
                              Topic
                            </th>
                            <th style={{
                              textAlign: 'center',
                              padding: '16px 24px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: '#e5e5e5',
                              width: '20%'
                            }}>
                              Times Covered
                            </th>
                            <th style={{
                              textAlign: 'center',
                              padding: '16px 24px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: '#e5e5e5',
                              width: '20%'
                            }}>
                              Accuracy
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {topics
                            .slice()
                            .sort((a, b) => {
                              // Uncovered topics go to the end
                              if (a.count === 0 && b.count === 0) return 0;
                              if (a.count === 0) return 1;
                              if (b.count === 0) return -1;

                              // Sort covered topics by accuracy (worst to best)
                              // If accuracy is the same, prioritize topics with more attempts (more failures)
                              if (a.accuracy === b.accuracy) {
                                return b.count - a.count; // More attempts = higher priority
                              }
                              return a.accuracy - b.accuracy;
                            })
                            .map((topic, index) => {
                              const getCountColor = () => {
                                if (topic.count === 0) return '#666666';
                                if (topic.accuracy >= 80) return '#10b981';
                                if (topic.accuracy >= 60) return '#f59e0b';
                                return '#f43f5e';
                              };

                              return (
                                <tr
                                  key={index}
                                  style={{
                                    borderBottom: '1px solid #191919',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(25, 25, 25, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <td style={{
                                    padding: '16px 24px',
                                    fontSize: '16px',
                                    color: '#e5e5e5'
                                  }}>
                                    {topic.topicName}
                                  </td>
                                  <td style={{
                                    padding: '16px 24px',
                                    fontSize: '16px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: getCountColor()
                                  }}>
                                    {topic.count}
                                  </td>
                                  <td style={{
                                    padding: '16px 24px',
                                    fontSize: '16px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: getCountColor()
                                  }}>
                                    {topic.count > 0 ? `${topic.accuracy}%` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          <tr style={{
                            backgroundColor: 'rgba(25, 25, 25, 0.5)',
                            borderTop: '2px solid #191919'
                          }}>
                            <td style={{
                              padding: '20px 24px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: '#e5e5e5'
                            }}>
                              Total Coverage
                            </td>
                            <td colSpan={2} style={{
                              padding: '20px 24px',
                              fontSize: '18px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#e5e5e5'
                            }}>
                              {totalCovered} / {totalTopics}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
