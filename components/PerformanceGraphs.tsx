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
} from 'recharts';
import { UserProgress } from '@/lib/types';
import { hasSufficientData } from '@/lib/irt';

interface PerformanceGraphsProps {
  userProgress: UserProgress | null;
}

export default function PerformanceGraphs({ userProgress }: PerformanceGraphsProps) {
  if (!userProgress || userProgress.totalQuestions === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
        <p className="text-gray-400">Take quizzes to see your progress charts</p>
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
    // Extract domain number (e.g., "1.0" from "1.0 General Security Concepts")
    const domainNum = domain.split(' ')[0];
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

  // Graph 5: Questions Answered Over Time (Cumulative)
  let cumulative = 0;
  const questionsOverTime = userProgress.quizHistory.map((quiz, index) => {
    cumulative += quiz.questions.length;
    return {
      quiz: `Quiz ${index + 1}`,
      total: cumulative,
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  const hasSufficientQuestions = hasSufficientData(userProgress.totalQuestions);

  // Graph 6: Topic Coverage Frequency per Domain
  // Group topics by domain and count how many times each topic was covered
  const topicCoverageByDomain: { [domain: string]: { topicName: string; count: number; accuracy: number }[] } = {};

  Object.values(userProgress.topicPerformance || {}).forEach(topicPerf => {
    if (!topicCoverageByDomain[topicPerf.domain]) {
      topicCoverageByDomain[topicPerf.domain] = [];
    }
    topicCoverageByDomain[topicPerf.domain].push({
      topicName: topicPerf.topicName,
      count: topicPerf.questionsAnswered,
      accuracy: Math.round(topicPerf.accuracy),
    });
  });

  // Sort topics within each domain by count (descending) and take top 10
  Object.keys(topicCoverageByDomain).forEach(domain => {
    topicCoverageByDomain[domain].sort((a, b) => b.count - a.count);
    topicCoverageByDomain[domain] = topicCoverageByDomain[domain].slice(0, 10); // Top 10 topics per domain
  });

  return (
    <div className="space-y-8">
      {/* Phase 1 Warning if insufficient data */}
      {!hasSufficientQuestions && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            <strong>Preliminary Estimates:</strong> Answer at least 15 questions for reliable IRT analysis.
            Current progress: {userProgress.totalQuestions}/15 questions
          </p>
        </div>
      )}

      {/* Graph 1: Ability Level Over Time */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Ability Level Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={abilityOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quiz" stroke="#9CA3AF" />
            <YAxis domain={[-3, 3]} stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#60A5FA' }}
            />
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'Average', fill: '#9CA3AF' }} />
            <ReferenceLine y={1} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Target', fill: '#10B981' }} />
            <Line type="monotone" dataKey="ability" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Your ability estimate (θ) ranges from -3 (beginner) to +3 (expert)</p>
      </div>

      {/* Graph 2: Predicted Score Over Time */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Predicted Score Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoreOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quiz" stroke="#9CA3AF" />
            <YAxis domain={[100, 900]} stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#10B981' }}
            />
            <ReferenceLine y={750} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Passing', fill: '#10B981', position: 'right' }} />
            <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Predicted Security+ exam score (750 required to pass)</p>
      </div>

      {/* Graph 3: Accuracy by Difficulty */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Accuracy by Difficulty Level</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={accuracyByDifficulty}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="difficulty" stroke="#9CA3AF" />
            <YAxis domain={[0, 100]} stroke="#9CA3AF" label={{ value: '% Correct', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'accuracy') {
                  return [`${value}% (${props.payload.questions} questions)`, 'Accuracy'];
                }
                return [value, name];
              }}
            />
            <Bar dataKey="accuracy" fill="#60A5FA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Performance breakdown by question difficulty</p>
      </div>

      {/* Graph 4: Topic Performance by Domain */}
      {domainPerformance.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Performance by SY0-701 Domain</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={domainPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" label={{ value: '% Correct', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
              <YAxis type="category" dataKey="domain" stroke="#9CA3AF" width={200} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'accuracy') {
                    return [`${value}% (${props.payload.questions} questions)`, 'Accuracy'];
                  }
                  return [value, name];
                }}
              />
              <Bar dataKey="accuracy" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-gray-400 text-sm mt-2">Coverage across the 5 Security+ SY0-701 domains</p>
        </div>
      )}

      {/* Graph 5: Questions Answered Over Time */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Study Volume Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={questionsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quiz" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" label={{ value: 'Total Questions', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#A78BFA' }}
            />
            <Line type="monotone" dataKey="total" stroke="#A78BFA" strokeWidth={2} dot={{ fill: '#A78BFA', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Cumulative questions answered across all quiz sessions</p>
      </div>

      {/* Graph 6: Topic Coverage Frequency per Domain */}
      {Object.keys(topicCoverageByDomain).length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Topic Coverage Frequency by Domain</h3>
          <p className="text-gray-400 text-sm mb-6">Shows how many times each topic has been covered in quizzes (top 10 per domain)</p>

          <div className="space-y-8">
            {Object.entries(topicCoverageByDomain)
              .sort(([domainA], [domainB]) => {
                const numA = domainA.split(' ')[0];
                const numB = domainB.split(' ')[0];
                return numA.localeCompare(numB);
              })
              .map(([domain, topics]) => {
                const domainName = domain.replace(/^\d+\.\d+\s+/, '');
                const domainNum = domain.split(' ')[0];

                return (
                  <div key={domain} className="space-y-2">
                    <h4 className="text-lg font-semibold text-blue-400">{domainNum} {domainName}</h4>
                    <ResponsiveContainer width="100%" height={Math.max(200, topics.length * 30)}>
                      <BarChart data={topics} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9CA3AF" label={{ value: 'Times Covered', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
                        <YAxis type="category" dataKey="topicName" stroke="#9CA3AF" width={150} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                          formatter={(value: any, name: string, props: any) => {
                            if (name === 'count') {
                              return [`${value} times (${props.payload.accuracy}% accuracy)`, 'Coverage'];
                            }
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="count" fill="#60A5FA" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
