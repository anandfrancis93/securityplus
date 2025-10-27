'use client';

import React from 'react';
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
import { hasSufficientData } from '@/lib/irt';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';

interface PerformanceGraphsProps {
  userProgress: UserProgress | null;
}

// Custom tooltip component for bar charts
const CustomBarTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-gray-800 rounded-2xl p-4 shadow-xl shadow-black/50">
        <p className="text-slate-200 font-medium mb-2">{label}</p>
        <p className="text-sm mb-3" style={{ color: color || '#3b82f6' }}>
          Accuracy: {payload[0].value}% ({payload[0].payload.questions} questions)
        </p>
        <div className="border-t border-gray-800 pt-3 space-y-1">
          <p className="text-xs text-slate-400">Performance Ranges:</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ff0000' }}></div>
            <span className="text-xs text-slate-300">&lt; 70% (Low)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f5a623' }}></div>
            <span className="text-xs text-slate-300">70-84% (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-xs text-slate-300">≥ 85% (Excellent)</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PerformanceGraphs({ userProgress }: PerformanceGraphsProps) {
  if (!userProgress || userProgress.totalQuestions === 0) {
    return (
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-800 shadow-xl shadow-black/50 text-center">
        <p className="text-slate-400 text-base md:text-lg">Take quizzes to see your progress charts</p>
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

  const hasSufficientQuestions = hasSufficientData(userProgress.totalQuestions);

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
    <div className="space-y-8">
      {/* Phase 1 Warning if insufficient data */}
      {!hasSufficientQuestions && (
        <div className="bg-black border border-yellow-500/30 rounded-[28px] p-6 md:p-8 shadow-xl shadow-black/50">
          <p className="text-yellow-300 text-base md:text-lg">
            <strong className="font-bold">Preliminary Estimates:</strong> Answer at least 15 questions for reliable IRT analysis.
            Current progress: {userProgress.totalQuestions}/15 questions
          </p>
        </div>
      )}

      {/* Graph 1: Ability Level Over Time */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Ability Level Over Time</h3>
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

      {/* Graph 2: Predicted Score Over Time */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Predicted Score Over Time</h3>
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

      {/* Graph 3: Accuracy by Difficulty */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Accuracy by Difficulty Level</h3>
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

      {/* Graph 4: Topic Performance by Domain */}
      {domainPerformance.length > 0 && (
        <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
          <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Performance by SY0-701 Domain</h3>
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

      {/* Topic Coverage Tables by Domain */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 shadow-xl shadow-black/50">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Topic Coverage by Domain</h3>

        <div className="space-y-6">
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
                <div key={domain} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl md:text-2xl font-semibold text-blue-400 tracking-tight">
                      <span className="mr-1">{domainNum}</span>{domainName}
                    </h4>
                    <span className="text-sm md:text-base text-slate-400">
                      {totalCovered} of {totalTopics} topics covered
                    </span>
                  </div>

                  <div className="border border-gray-800 rounded-[20px] overflow-hidden bg-black">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-black border-b border-gray-800 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm md:text-base font-semibold text-slate-300 w-3/5">Topic</th>
                            <th className="text-center px-4 py-3 text-sm md:text-base font-semibold text-slate-300 w-1/5">Times Covered</th>
                            <th className="text-center px-4 py-3 text-sm md:text-base font-semibold text-slate-300 w-1/5">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {topics.map((topic, index) => (
                            <tr
                              key={index}
                              className="bg-black hover:bg-gray-900/50 transition-all duration-200"
                            >
                              <td className="px-4 py-2 text-sm md:text-base text-slate-300">{topic.topicName}</td>
                              <td className={`px-4 py-2 text-sm md:text-base text-center font-medium ${
                                topic.count === 0 ? 'text-slate-500' : 'text-blue-400'
                              }`}>
                                {topic.count}
                              </td>
                              <td className={`px-4 py-2 text-sm md:text-base text-center font-medium ${
                                topic.count === 0
                                  ? 'text-slate-500'
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
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
