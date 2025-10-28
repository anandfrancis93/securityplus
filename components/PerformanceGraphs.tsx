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
  Legend,
  TooltipProps,
  Cell,
} from 'recharts';
import { UserProgress } from '@/lib/types';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';

interface PerformanceGraphsProps {
  userProgress: UserProgress | null;
}

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

  // Graph 1: Ability Level Over Time
  const abilityOverTime = userProgress.quizHistory.map((quiz, index) => {
    // Calculate ability up to this quiz
    const attemptsUpToNow = userProgress.quizHistory
      .slice(0, index + 1)
      .flatMap(q => q.questions);

    // Get the estimated ability from this quiz
    const ability = userProgress.quizHistory[index + 1]?.questions
      ? userProgress.estimatedAbility || 0
      : userProgress.estimatedAbility || 0;

    return {
      quiz: `Quiz ${index + 1}`,
      ability: parseFloat(ability.toFixed(2)),
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  // Graph 2: Predicted Score Over Time
  const scoreOverTime = userProgress.quizHistory.map((quiz, index) => {
    const ability = abilityOverTime[index].ability;
    // Map ability to score (same logic as calculateIRTScore)
    const baseScore = 550;
    const scaleFactor = 130;
    const score = Math.max(100, Math.min(900, Math.round(baseScore + (ability * scaleFactor))));

    return {
      quiz: `Quiz ${index + 1}`,
      score,
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  // Graph 3: Accuracy by Difficulty
  const difficultyStats: { [key: string]: { correct: number; total: number } } = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  userProgress.quizHistory.forEach(quiz => {
    quiz.questions.forEach(attempt => {
      const diff = attempt.question.difficulty || 'medium';
      difficultyStats[diff].total += 1;
      if (attempt.isCorrect) {
        difficultyStats[diff].correct += 1;
      }
    });
  });

  const accuracyByDifficulty = [
    {
      difficulty: 'Easy',
      accuracy: difficultyStats.easy.total > 0
        ? Math.round((difficultyStats.easy.correct / difficultyStats.easy.total) * 100)
        : 0,
      questions: difficultyStats.easy.total,
    },
    {
      difficulty: 'Medium',
      accuracy: difficultyStats.medium.total > 0
        ? Math.round((difficultyStats.medium.correct / difficultyStats.medium.total) * 100)
        : 0,
      questions: difficultyStats.medium.total,
    },
    {
      difficulty: 'Hard',
      accuracy: difficultyStats.hard.total > 0
        ? Math.round((difficultyStats.hard.correct / difficultyStats.hard.total) * 100)
        : 0,
      questions: difficultyStats.hard.total,
    },
  ];

  // Graph 4: Topic Performance Breakdown by Domain
  // Count unique questions per domain (not topic occurrences)
  const domainStats: { [domain: string]: { questionIds: Set<string>; correctQuestionIds: Set<string> } } = {};

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
      domainsForQuestion.forEach(domain => {
        if (!domainStats[domain]) {
          domainStats[domain] = {
            questionIds: new Set<string>(),
            correctQuestionIds: new Set<string>()
          };
        }
        domainStats[domain].questionIds.add(questionId);
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
      accuracy: totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0,
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
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left"
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="quiz" stroke="#9ca3af" tick={false} label={{ value: 'Quiz', position: 'insideBottom', offset: 0, fill: '#9ca3af' }} />
            <YAxis domain={[-3, 3]} stroke="#9ca3af" label={{ value: 'Ability Level', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" label={{ value: 'Average', fill: '#9ca3af' }} />
            <ReferenceLine y={1} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target', fill: '#10b981' }} />
            <Line
              type="monotone"
              dataKey="ability"
              stroke="#ffffff"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const ability = payload.ability;
                let fill = '#ff0000'; // Red for below average
                if (ability >= 1) fill = '#22c55e'; // Green for excellent
                else if (ability >= 0) fill = '#f5a623'; // Yellow for average to good
                return <circle cx={cx} cy={cy} r={5} fill={fill} />;
              }}
            />
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
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="quiz" stroke="#9ca3af" tick={false} label={{ value: 'Quiz', position: 'insideBottom', offset: 0, fill: '#9ca3af' }} />
                <YAxis domain={[100, 900]} stroke="#9ca3af" label={{ value: 'Exam Score', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <ReferenceLine y={750} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Passing', fill: '#10b981', position: 'right' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#ffffff"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const score = payload.score;
                    let fill = '#ff0000'; // Red for below passing
                    if (score >= 800) fill = '#22c55e'; // Green for excellent
                    else if (score >= 750) fill = '#f5a623'; // Yellow for passing
                    return <circle cx={cx} cy={cy} r={5} fill={fill} />;
                  }}
                />
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
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left"
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
            className="relative w-full p-10 md:p-12 flex items-center justify-between text-left"
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
          className="relative w-full p-10 md:p-12 flex items-center justify-between text-left"
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
                    className="relative w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-all duration-700"
                  >
                    <h4 className="text-2xl md:text-3xl font-bold text-cyan-400 tracking-tight">
                      <span className="mr-2">{domainNum}</span>{domainName}
                    </h4>
                    <svg
                      className={`w-6 h-6 text-cyan-400 transition-transform duration-700 ${openDomainTables[domain] ? 'rotate-180' : ''}`}
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
                        <thead className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0">
                          <tr>
                            <th className="text-left px-6 py-4 text-lg md:text-xl font-bold text-white w-3/5">Topic</th>
                            <th className="text-center px-6 py-4 text-lg md:text-xl font-bold text-white w-1/5">Times Covered</th>
                            <th className="text-center px-6 py-4 text-lg md:text-xl font-bold text-white w-1/5">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {topics.map((topic, index) => (
                            <tr
                              key={index}
                              className="hover:bg-white/5 transition-all duration-700"
                            >
                              <td className="px-6 py-4 text-base md:text-lg text-zinc-300">{topic.topicName}</td>
                              <td className={`px-6 py-4 text-base md:text-lg text-center font-bold ${
                                topic.count === 0 ? 'text-zinc-500' : 'text-cyan-400'
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
                            <td colSpan={2} className="px-6 py-5 text-lg md:text-xl text-center font-bold text-cyan-400">
                              {totalCovered} of {totalTopics}
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
