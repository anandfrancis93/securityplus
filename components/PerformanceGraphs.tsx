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
import { calculateIRTConfidenceInterval, wilsonScoreInterval } from '@/lib/confidenceIntervals';

interface PerformanceGraphsProps {
  userProgress: UserProgress | null;
}

// Helper function to get color based on ability level
const getAbilityColor = (ability: number) => {
  if (ability >= 1.54) return '#22c55e'; // Green for passing
  if (ability >= 0) return '#f5a623'; // Yellow for marginal
  return '#ef4444'; // Red for failing
};

// Custom tooltip for Ability Level Over Time
const AbilityTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px', padding: '12px', backdropFilter: 'blur(16px)' }}>
        <p style={{ color: '#ffffff', fontSize: '14px' }}>
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
      <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px', padding: '12px', backdropFilter: 'blur(16px)' }}>
        <p style={{ color: '#ffffff', fontSize: '14px' }}>
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
      <div className="relative bg-black/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
        <p className="relative text-white font-bold mb-3 text-lg">{label}</p>
        <p className="relative text-base mb-4 font-medium" style={{ color: color || '#3b82f6' }}>
          Accuracy: {payload[0].value}% ({payload[0].payload.questions} questions)
        </p>
        <div className="relative border-t border-white/20 pt-4 space-y-2">
          <p className="text-sm text-zinc-400 font-medium">Performance Ranges:</p>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: '#ff0000' }}></div>
            <span className="text-sm text-zinc-300">&lt; 70% (Low)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: '#f5a623' }}></div>
            <span className="text-sm text-zinc-300">70-84% (Good)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-sm text-zinc-300">≥ 85% (Excellent)</span>
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
      <div className="relative bg-white/5 backdrop-blur-2xl rounded-[40px] p-12 md:p-16 border border-white/10 shadow-2xl text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
        <p className="relative text-zinc-400 text-xl md:text-2xl">Take quizzes to see your progress charts</p>
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
      abilityErrorLower: parseFloat((theta - abilityCI.lower).toFixed(2)),
      abilityErrorUpper: parseFloat((abilityCI.upper - theta).toFixed(2)),
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

    // Calculate error bar distances for ErrorBar component
    const scoreErrorLower = score - scoreLower;
    const scoreErrorUpper = scoreUpper - score;

    return {
      quiz: quizLabel,
      quizId: quiz.id,
      score,
      scoreLower,
      scoreUpper,
      scoreErrorLower,  // Distance from score to lower bound
      scoreErrorUpper,  // Distance from score to upper bound
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
      ...(() => {
        if (difficultyStats.easy.total > 0) {
          // Still use Wilson interval for binomial confidence (correct vs incorrect questions)
          const ci = wilsonScoreInterval(difficultyStats.easy.correct, difficultyStats.easy.total);
          const accuracy = difficultyStats.easy.maxPoints > 0
            ? Math.round((difficultyStats.easy.points / difficultyStats.easy.maxPoints) * 100)
            : 0;
          return {
            ciLower: ci.lower,
            ciUpper: ci.upper,
            errorLower: accuracy - ci.lower,
            errorUpper: ci.upper - accuracy,
          };
        }
        return { ciLower: 0, ciUpper: 0, errorLower: 0, errorUpper: 0 };
      })(),
    },
    {
      difficulty: 'Medium',
      accuracy: difficultyStats.medium.maxPoints > 0
        ? Math.round((difficultyStats.medium.points / difficultyStats.medium.maxPoints) * 100)
        : 0,
      questions: difficultyStats.medium.total,
      ...(() => {
        if (difficultyStats.medium.total > 0) {
          const ci = wilsonScoreInterval(difficultyStats.medium.correct, difficultyStats.medium.total);
          const accuracy = difficultyStats.medium.maxPoints > 0
            ? Math.round((difficultyStats.medium.points / difficultyStats.medium.maxPoints) * 100)
            : 0;
          return {
            ciLower: ci.lower,
            ciUpper: ci.upper,
            errorLower: accuracy - ci.lower,
            errorUpper: ci.upper - accuracy,
          };
        }
        return { ciLower: 0, ciUpper: 0, errorLower: 0, errorUpper: 0 };
      })(),
    },
    {
      difficulty: 'Hard',
      accuracy: difficultyStats.hard.maxPoints > 0
        ? Math.round((difficultyStats.hard.points / difficultyStats.hard.maxPoints) * 100)
        : 0,
      questions: difficultyStats.hard.total,
      ...(() => {
        if (difficultyStats.hard.total > 0) {
          const ci = wilsonScoreInterval(difficultyStats.hard.correct, difficultyStats.hard.total);
          const accuracy = difficultyStats.hard.maxPoints > 0
            ? Math.round((difficultyStats.hard.points / difficultyStats.hard.maxPoints) * 100)
            : 0;
          return {
            ciLower: ci.lower,
            ciUpper: ci.upper,
            errorLower: accuracy - ci.lower,
            errorUpper: ci.upper - accuracy,
          };
        }
        return { ciLower: 0, ciUpper: 0, errorLower: 0, errorUpper: 0 };
      })(),
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
    <div className="space-y-12">
      {/* Graph 1: Ability Level Over Time */}
      <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl transition-all duration-700 hover:border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
        <button
          onClick={() => setIsAbilityGraphOpen(!isAbilityGraphOpen)}
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left focus:outline-none"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ability Level Over Time</h3>
          <svg
            className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${isAbilityGraphOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isAbilityGraphOpen && (
          <div className="relative px-10 md:px-12 pb-10 md:pb-12">
            <ResponsiveContainer width="100%" height={400}>
          <LineChart data={abilityOverTime}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="quiz" stroke="#9ca3af" tick={false} label={{ value: 'Quiz', position: 'insideBottom', offset: 0, fill: '#9ca3af' }} />
            <YAxis domain={[-3, 3]} stroke="#9ca3af" label={{ value: 'Ability Level', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
            <Tooltip content={<AbilityTooltip />} />
            <ReferenceLine y={1.54} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Passing (750)', fill: '#22c55e', position: 'right' }} />

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
              stroke="#ffffff"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const ability = payload.ability;
                const fill = getAbilityColor(ability);
                return <circle cx={cx} cy={cy} r={5} fill={fill} />;
              }}
            >
              <ErrorBar dataKey="abilityErrorLower" direction="y" stroke="#888" strokeWidth={2} />
              <ErrorBar dataKey="abilityErrorUpper" direction="y" stroke="#888" strokeWidth={2} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Graph 2: Predicted Score Over Time */}
      <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl transition-all duration-700 hover:border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
        <button
          onClick={() => setIsPredictedScoreGraphOpen(!isPredictedScoreGraphOpen)}
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left focus:outline-none"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Predicted Score Over Time</h3>
          <svg
            className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${isPredictedScoreGraphOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isPredictedScoreGraphOpen && (
          <div className="relative px-10 md:px-12 pb-10 md:pb-12">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={scoreOverTime}>
                <defs>
                  {/* Define individual gradients for confidence bands based on score */}
                  {scoreOverTime.map((point, index) => {
                    const score = point.score;
                    const color = score >= 800 ? '#22c55e' : score >= 750 ? '#f5a623' : '#ef4444';
                    return (
                      <linearGradient key={`score-gradient-${index}`} id={`scoreGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="quiz" stroke="#9ca3af" tick={false} label={{ value: 'Quiz', position: 'insideBottom', offset: 0, fill: '#9ca3af' }} />
                <YAxis domain={[100, 900]} stroke="#9ca3af" label={{ value: 'Exam Score', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
                <Tooltip content={<ScoreTooltip />} />
                <ReferenceLine y={750} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Passing (750)', fill: '#22c55e', position: 'right' }} />

                {/* Colored confidence bands between consecutive points */}
                {scoreOverTime.map((point, index) => {
                  if (index === scoreOverTime.length - 1) return null;

                  const nextPoint = scoreOverTime[index + 1];
                  const avgScore = (point.score + nextPoint.score) / 2;
                  const color = avgScore >= 800 ? '#22c55e' : avgScore >= 750 ? '#f5a623' : '#ef4444';

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
                  stroke="#ffffff"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const score = payload.score;
                    let fill = '#ef4444'; // Red for below passing
                    if (score >= 800) fill = '#22c55e'; // Green for excellent
                    else if (score >= 750) fill = '#f5a623'; // Yellow for passing
                    return <circle cx={cx} cy={cy} r={5} fill={fill} />;
                  }}
                >
                  <ErrorBar dataKey="scoreErrorLower" direction="y" stroke="#888" strokeWidth={2} />
                  <ErrorBar dataKey="scoreErrorUpper" direction="y" stroke="#888" strokeWidth={2} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Graph 3: Accuracy by Difficulty */}
      <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl transition-all duration-700 hover:border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
        <button
          onClick={() => setIsAccuracyByDifficultyOpen(!isAccuracyByDifficultyOpen)}
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left focus:outline-none"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Accuracy by Difficulty Level</h3>
          <svg
            className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${isAccuracyByDifficultyOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isAccuracyByDifficultyOpen && (
          <div className="relative px-10 md:px-12 pb-10 md:pb-12">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={accuracyByDifficulty}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="difficulty" stroke="#9ca3af" tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" label={{ value: '% Correct', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
                <Tooltip content={(props) => {
                  if (props.active && props.payload && props.payload.length) {
                    const accuracy = props.payload[0].payload.accuracy;
                    let color = '#ff0000'; // Red
                    if (accuracy >= 85) color = '#22c55e'; // Green
                    else if (accuracy >= 70) color = '#f5a623'; // Yellow
                    return <CustomBarTooltip {...props} color={color} />;
                  }
                  return null;
                }} cursor={{ fill: 'rgba(71, 85, 105, 0.1)' }} />
                <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                  {accuracyByDifficulty.map((entry, index) => {
                    const accuracy = entry.accuracy;
                    let fill = '#ff0000'; // Red for low accuracy
                    if (accuracy >= 85) fill = '#22c55e'; // Green for excellent
                    else if (accuracy >= 70) fill = '#f5a623'; // Yellow for good
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                  <ErrorBar dataKey="errorLower" direction="y" stroke="#888" strokeWidth={2} />
                  <ErrorBar dataKey="errorUpper" direction="y" stroke="#888" strokeWidth={2} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Graph 4: Topic Performance by Domain */}
      {domainPerformance.length > 0 && (
        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl transition-all duration-700 hover:border-white/30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
          <button
            onClick={() => setIsPerformanceByDomainOpen(!isPerformanceByDomainOpen)}
            className="relative w-full p-10 md:p-12 flex items-center justify-between text-left focus:outline-none"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Performance by SY0-701 Domain</h3>
            <svg
              className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${isPerformanceByDomainOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isPerformanceByDomainOpen && (
            <div className="relative px-10 md:px-12 pb-10 md:pb-12">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={domainPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" label={{ value: '% Correct', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="domain" stroke="#9ca3af" width={60} tick={false} label={{ value: 'Domains', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
                  <Tooltip content={(props) => {
                    if (props.active && props.payload && props.payload.length) {
                      const accuracy = props.payload[0].payload.accuracy;
                      let color = '#ff0000'; // Red
                      if (accuracy >= 85) color = '#22c55e'; // Green
                      else if (accuracy >= 70) color = '#f5a623'; // Yellow
                      return <CustomBarTooltip {...props} color={color} />;
                    }
                    return null;
                  }} cursor={{ fill: 'rgba(71, 85, 105, 0.1)' }} />
                  <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                    {domainPerformance.map((entry, index) => {
                      const accuracy = entry.accuracy;
                      let fill = '#ff0000'; // Red for low accuracy
                      if (accuracy >= 85) fill = '#22c55e'; // Green for excellent
                      else if (accuracy >= 70) fill = '#f5a623'; // Yellow for good
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
      <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl transition-all duration-700 hover:border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />
        <button
          onClick={() => setIsTopicCoverageOpen(!isTopicCoverageOpen)}
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left focus:outline-none"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Topic Coverage by Domain</h3>
          <svg
            className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${isTopicCoverageOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isTopicCoverageOpen && (
          <div className="relative px-10 md:px-12 pb-10 md:pb-12">
            <div className="space-y-8">
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
                <div key={domain} className="relative border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl" />
                  <button
                    onClick={() => toggleDomainTable(domain)}
                    className="relative w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-all duration-700 focus:outline-none"
                  >
                    <h4 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      <span className="mr-2">{domainNum}</span>{domainName}
                    </h4>
                    <svg
                      className={`w-6 h-6 text-zinc-400 transition-transform duration-700 ${openDomainTables[domain] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openDomainTables[domain] && (
                    <div className="relative border-t border-white/10">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-zinc-900/85 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-10">
                          <tr>
                            <th className="text-left px-6 py-4 text-lg md:text-xl font-bold text-white w-3/5">Topic</th>
                            <th className="text-center px-6 py-4 text-lg md:text-xl font-bold text-white w-1/5">Times Covered</th>
                            <th className="text-center px-6 py-4 text-lg md:text-xl font-bold text-white w-1/5">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
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
                            .map((topic, index) => (
                            <tr
                              key={index}
                              className="hover:bg-white/5 transition-all duration-700"
                            >
                              <td className="px-6 py-4 text-base md:text-lg text-zinc-300">{topic.topicName}</td>
                              <td className={`px-6 py-4 text-base md:text-lg text-center font-bold ${
                                topic.count === 0
                                  ? 'text-zinc-500'
                                  : topic.accuracy >= 80
                                  ? 'text-emerald-400'
                                  : topic.accuracy >= 60
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}>
                                {topic.count}
                              </td>
                              <td className={`px-6 py-4 text-base md:text-lg text-center font-bold ${
                                topic.count === 0
                                  ? 'text-zinc-500'
                                  : topic.accuracy >= 80
                                  ? 'text-emerald-400'
                                  : topic.accuracy >= 60
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}>
                                {topic.count > 0 ? `${topic.accuracy}%` : '-'}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-white/10 backdrop-blur-xl border-t-2 border-white/20">
                            <td className="px-6 py-5 text-lg md:text-xl font-bold text-white">
                              Total Coverage
                            </td>
                            <td colSpan={2} className="px-6 py-5 text-lg md:text-xl text-center font-bold text-white">
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
