'use client';

import React, { useState } from 'react';
import { UserProgress, TopicPerformance } from '@/lib/types';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';

interface TopicReviewScheduleProps {
  userProgress: UserProgress;
  liquidGlass?: boolean;
}

// Domain color mapping
const DOMAIN_COLORS: { [key: string]: string } = {
  '1.0 General Security Concepts': '#9333ea',
  '2.0 Threats, Vulnerabilities, and Mitigations': '#ff4500',
  '3.0 Security Architecture': '#06b6d4',
  '4.0 Security Operations': '#fbbf24',
  '5.0 Security Program Management and Oversight': '#22c55e',
};

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || '#ffffff';
}

export default function TopicReviewSchedule({ userProgress, liquidGlass = true }: TopicReviewScheduleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'due-soon' | 'future'>('all');
  const [hoveredCard, setHoveredCard] = useState<'current' | 'overdue' | 'due-now' | 'due-soon' | null>(null);

  // Use FSRS-enabled topic performance from quizMetadata (has proper scheduling)
  // Falls back to legacy topicPerformance if quizMetadata doesn't exist yet
  const topicPerformance = userProgress.quizMetadata?.topicPerformance || userProgress.topicPerformance || {};
  const quizMetadata = userProgress.quizMetadata;
  const currentQuizNumber = quizMetadata?.totalQuizzesCompleted || userProgress.quizHistory.length;
  const nextQuizNumber = currentQuizNumber + 1;

  // Get all topics with their review schedule
  const topicsWithSchedule = Object.entries(topicPerformance)
    .map(([topicName, perf]: [string, TopicPerformance]) => {
      const nextReviewQuiz = perf.nextReviewQuiz || 0;
      const lastReviewQuiz = perf.lastReviewQuiz || 0;
      const quizzesUntilDue = nextReviewQuiz - nextQuizNumber;

      let status: 'overdue' | 'due-now' | 'due-soon' | 'future' | 'never-tested';
      if (perf.questionsAnswered === 0) {
        status = 'never-tested';
      } else if (quizzesUntilDue < 0) {
        status = 'overdue';
      } else if (quizzesUntilDue === 0) {
        status = 'due-now';
      } else if (quizzesUntilDue <= 3) {
        status = 'due-soon';
      } else {
        status = 'future';
      }

      return {
        topicName,
        domain: perf.domain,
        accuracy: perf.accuracy,
        questionsAnswered: perf.questionsAnswered,
        nextReviewQuiz,
        lastReviewQuiz,
        quizzesUntilDue,
        status,
        stability: perf.stability || 0,
        isStruggling: perf.isStruggling || false,
        isMastered: perf.isMastered || false,
      };
    })
    .sort((a, b) => {
      // Sort by status priority, then by quizzesUntilDue
      const statusOrder = { 'overdue': 0, 'due-now': 1, 'due-soon': 2, 'future': 3, 'never-tested': 4 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Within same status, sort by how overdue/soon
      return a.quizzesUntilDue - b.quizzesUntilDue;
    });

  // Filter topics based on selected filter
  const filteredTopics = topicsWithSchedule.filter(topic => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'overdue') return topic.status === 'overdue' || topic.status === 'due-now';
    if (filterStatus === 'due-soon') return topic.status === 'due-soon';
    if (filterStatus === 'future') return topic.status === 'future';
    return true;
  });

  // Get topics that will appear in next quiz (overdue + due now + high priority)
  const nextQuizTopics = topicsWithSchedule.filter(topic =>
    topic.status === 'overdue' || topic.status === 'due-now' ||
    (topic.isStruggling && topic.quizzesUntilDue <= 2)
  ).slice(0, 15); // Typical quiz has ~10 questions, but could have more topics

  // Statistics
  const overdueCount = topicsWithSchedule.filter(t => t.status === 'overdue').length;
  const dueNowCount = topicsWithSchedule.filter(t => t.status === 'due-now').length;
  const dueSoonCount = topicsWithSchedule.filter(t => t.status === 'due-soon').length;

  return (
    <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-zinc-950 border-2 border-zinc-800 rounded-md'}`}>
      {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}

      {/* Header */}
      <div className="relative p-8 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-3xl md:text-4xl font-bold text-white tracking-tight ${liquidGlass ? '' : 'font-mono'}`}>
              Topic Review Schedule
            </h3>
            <p className={`text-lg md:text-xl mt-2 ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
              Verify when topics are scheduled for review
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-700 ${liquidGlass ? 'rounded-3xl' : 'rounded-md'}`}
            aria-label="Toggle Topic Review Schedule"
          >
            <svg
              className={`w-8 h-8 text-zinc-400 transition-transform duration-700 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Quizzes Completed Card */}
          <div
            className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10' : 'bg-zinc-900 rounded-md border border-zinc-800'} p-4 cursor-help transition-all duration-300`}
            onMouseEnter={() => setHoveredCard('current')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="text-sm text-zinc-400 mb-1">Quizzes Completed</div>
            <div className="text-2xl font-bold text-white">{currentQuizNumber}</div>

            {/* Tooltip */}
            {hoveredCard === 'current' && (
              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-50 ${liquidGlass ? 'bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl' : 'bg-zinc-900 border-2 border-zinc-700 rounded-md'} p-4 shadow-2xl`}>
                {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl" />}
                <div className="relative text-sm text-white leading-relaxed">
                  The total number of quizzes you have completed so far. Topics are scheduled based on this number.
                </div>
                {/* Arrow */}
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-px`}>
                  <div className={`w-0 h-0 border-l-8 border-r-8 border-t-8 ${liquidGlass ? 'border-l-transparent border-r-transparent border-t-white/20' : 'border-l-transparent border-r-transparent border-t-zinc-700'}`}></div>
                </div>
              </div>
            )}
          </div>

          {/* Overdue Card */}
          <div
            className={`relative ${liquidGlass ? 'bg-red-500/20 backdrop-blur-xl rounded-2xl border-2 border-red-500/50' : 'bg-red-900 rounded-md border-2 border-red-700'} p-4 cursor-help transition-all duration-300`}
            onMouseEnter={() => setHoveredCard('overdue')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="text-sm text-red-200 mb-1">Overdue</div>
            <div className="text-2xl font-bold text-red-300">{overdueCount}</div>

            {/* Tooltip */}
            {hoveredCard === 'overdue' && (
              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-50 ${liquidGlass ? 'bg-black/95 backdrop-blur-2xl border border-red-500/40 rounded-2xl' : 'bg-zinc-900 border-2 border-red-700 rounded-md'} p-4 shadow-2xl shadow-red-500/20`}>
                {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent rounded-2xl" />}
                <div className="relative text-sm text-white leading-relaxed">
                  Topics that were scheduled to be reviewed in previous quizzes but haven&apos;t appeared yet. These should be prioritized in your next quiz.
                </div>
                {/* Arrow */}
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-px`}>
                  <div className={`w-0 h-0 border-l-8 border-r-8 border-t-8 ${liquidGlass ? 'border-l-transparent border-r-transparent border-t-red-500/40' : 'border-l-transparent border-r-transparent border-t-red-700'}`}></div>
                </div>
              </div>
            )}
          </div>

          {/* Due Now Card */}
          <div
            className={`relative ${liquidGlass ? 'bg-yellow-500/20 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/50' : 'bg-yellow-900 rounded-md border-2 border-yellow-700'} p-4 cursor-help transition-all duration-300`}
            onMouseEnter={() => setHoveredCard('due-now')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="text-sm text-yellow-200 mb-1">Due Now</div>
            <div className="text-2xl font-bold text-yellow-300">{dueNowCount}</div>

            {/* Tooltip */}
            {hoveredCard === 'due-now' && (
              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-50 ${liquidGlass ? 'bg-black/95 backdrop-blur-2xl border border-yellow-500/40 rounded-2xl' : 'bg-zinc-900 border-2 border-yellow-700 rounded-md'} p-4 shadow-2xl shadow-yellow-500/20`}>
                {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent rounded-2xl" />}
                <div className="relative text-sm text-white leading-relaxed">
                  Topics scheduled to be reviewed in your next quiz (Quiz #{nextQuizNumber}). These are ready for review based on FSRS optimal spacing.
                </div>
                {/* Arrow */}
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-px`}>
                  <div className={`w-0 h-0 border-l-8 border-r-8 border-t-8 ${liquidGlass ? 'border-l-transparent border-r-transparent border-t-yellow-500/40' : 'border-l-transparent border-r-transparent border-t-yellow-700'}`}></div>
                </div>
              </div>
            )}
          </div>

          {/* Due Soon Card */}
          <div
            className={`relative ${liquidGlass ? 'bg-cyan-500/20 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/50' : 'bg-cyan-900 rounded-md border-2 border-cyan-700'} p-4 cursor-help transition-all duration-300`}
            onMouseEnter={() => setHoveredCard('due-soon')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="text-sm text-cyan-200 mb-1">Due Soon</div>
            <div className="text-2xl font-bold text-cyan-300">{dueSoonCount}</div>

            {/* Tooltip */}
            {hoveredCard === 'due-soon' && (
              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-50 ${liquidGlass ? 'bg-black/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl' : 'bg-zinc-900 border-2 border-cyan-700 rounded-md'} p-4 shadow-2xl shadow-cyan-500/20`}>
                {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-2xl" />}
                <div className="relative text-sm text-white leading-relaxed">
                  Topics scheduled to be reviewed within the next 1-3 quizzes. These will appear soon as you continue taking quizzes.
                </div>
                {/* Arrow */}
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-px`}>
                  <div className={`w-0 h-0 border-l-8 border-r-8 border-t-8 ${liquidGlass ? 'border-l-transparent border-r-transparent border-t-cyan-500/40' : 'border-l-transparent border-r-transparent border-t-cyan-700'}`}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="relative border-t border-white/10">
          {/* Next Quiz Preview */}
          <div className="p-8 md:p-10 border-b border-white/10">
            <h4 className={`text-2xl md:text-3xl font-bold text-white mb-4 ${liquidGlass ? '' : 'font-mono'}`}>
              Expected Topics in Quiz #{nextQuizNumber}
            </h4>
            {nextQuizTopics.length === 0 ? (
              <div className={`text-center py-8 ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
                <p className="text-base md:text-lg mb-2">No topic data available yet</p>
                <p className="text-sm md:text-base">Take your first quiz to start tracking topic performance and scheduling</p>
              </div>
            ) : (
              <>
                <p className={`text-base md:text-lg mb-6 ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
                  Based on FSRS scheduling, these {nextQuizTopics.length} topics are likely to appear in your next quiz:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nextQuizTopics.slice(0, 10).map((topic, index) => {
                const domainColor = getDomainColor(topic.domain);
                return (
                  <div
                    key={index}
                    className={`${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10' : 'bg-zinc-900 rounded-md border border-zinc-800'} p-6`}
                  >
                    <div className="text-base md:text-lg font-bold text-white">{topic.topicName}</div>
                    <div
                      className="text-sm md:text-base font-bold mt-2"
                      style={{ color: domainColor }}
                    >
                      {topic.domain.replace('.0', '.')}
                    </div>
                  </div>
                );
              })}
                </div>
                {nextQuizTopics.length > 10 && (
                  <p className={`mt-4 text-sm ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600 font-mono'}`}>
                    + {nextQuizTopics.length - 10} more topics may appear
                  </p>
                )}
              </>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="p-8 md:p-10 border-b border-white/10">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  filterStatus === 'all'
                    ? liquidGlass
                      ? 'bg-white/20 text-white border-2 border-white/30'
                      : 'bg-zinc-700 text-white border-2 border-zinc-600'
                    : liquidGlass
                      ? 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                All Topics ({topicsWithSchedule.length})
              </button>
              <button
                onClick={() => setFilterStatus('overdue')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  filterStatus === 'overdue'
                    ? 'bg-red-500/30 text-red-200 border-2 border-red-500/50'
                    : liquidGlass
                      ? 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-red-500/20'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-red-900'
                }`}
              >
                Overdue & Due ({overdueCount + dueNowCount})
              </button>
              <button
                onClick={() => setFilterStatus('due-soon')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  filterStatus === 'due-soon'
                    ? 'bg-cyan-500/30 text-cyan-200 border-2 border-cyan-500/50'
                    : liquidGlass
                      ? 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-cyan-500/20'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-cyan-900'
                }`}
              >
                Due Soon ({dueSoonCount})
              </button>
              <button
                onClick={() => setFilterStatus('future')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  filterStatus === 'future'
                    ? 'bg-emerald-500/30 text-emerald-200 border-2 border-emerald-500/50'
                    : liquidGlass
                      ? 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-emerald-500/20'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-emerald-900'
                }`}
              >
                Future Reviews
              </button>
            </div>
          </div>

          {/* Topics Table */}
          <div className="p-8 md:p-10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-sm md:text-base font-bold text-white">Topic</th>
                  <th className="text-left px-4 py-3 text-sm md:text-base font-bold text-white">Domain</th>
                  <th className="text-center px-4 py-3 text-sm md:text-base font-bold text-white">Status</th>
                  <th className="text-center px-4 py-3 text-sm md:text-base font-bold text-white">Next Review</th>
                  <th className="text-center px-4 py-3 text-sm md:text-base font-bold text-white">Quizzes Until Due</th>
                  <th className="text-center px-4 py-3 text-sm md:text-base font-bold text-white">Accuracy</th>
                  <th className="text-center px-4 py-3 text-sm md:text-base font-bold text-white">Tested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTopics.slice(0, 50).map((topic, index) => {
                  const domainColor = getDomainColor(topic.domain);
                  return (
                    <tr key={index} className="hover:bg-white/5 transition-all duration-300">
                      <td className="px-4 py-3 text-sm md:text-base text-zinc-300">{topic.topicName}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs md:text-sm font-bold"
                          style={{
                            color: domainColor,
                          }}
                        >
                          {topic.domain.replace('.0', '.')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm ${
                          topic.status === 'overdue' ? 'text-red-300' :
                          topic.status === 'due-now' ? 'text-yellow-300' :
                          topic.status === 'due-soon' ? 'text-cyan-300' :
                          topic.status === 'future' ? 'text-emerald-300' :
                          'text-zinc-400'
                        }`}>
                          {topic.status === 'overdue' ? 'Overdue' :
                           topic.status === 'due-now' ? 'Due Now' :
                           topic.status === 'due-soon' ? 'Due Soon' :
                           topic.status === 'future' ? 'Future' :
                           'Never Tested'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm md:text-base font-bold text-white">
                        {topic.questionsAnswered === 0 ? '-' : `Quiz #${topic.nextReviewQuiz}`}
                      </td>
                      <td className="px-4 py-3 text-center text-sm md:text-base font-bold">
                        {topic.questionsAnswered === 0 ? (
                          <span className="text-zinc-500">-</span>
                        ) : topic.quizzesUntilDue < 0 ? (
                          <span className="text-red-400">{topic.quizzesUntilDue} (overdue)</span>
                        ) : topic.quizzesUntilDue === 0 ? (
                          <span className="text-yellow-400">Now</span>
                        ) : (
                          <span className="text-cyan-400">+{topic.quizzesUntilDue}</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-center text-sm md:text-base font-bold ${
                        topic.questionsAnswered === 0 ? 'text-zinc-500' :
                        topic.accuracy >= 80 ? 'text-emerald-400' :
                        topic.accuracy >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {topic.questionsAnswered === 0 ? '-' : `${topic.accuracy.toFixed(0)}%`}
                      </td>
                      <td className="px-4 py-3 text-center text-sm md:text-base font-bold text-white">
                        {topic.questionsAnswered === 0 ? '-' : `${topic.questionsAnswered}×`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTopics.length > 50 && (
              <p className={`mt-4 text-center text-sm ${liquidGlass ? 'text-zinc-500' : 'text-zinc-600 font-mono'}`}>
                Showing first 50 topics. Use filters to narrow down or export full data.
              </p>
            )}
            {filteredTopics.length === 0 && (
              <p className={`text-center py-8 text-lg ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500 font-mono'}`}>
                No topics match this filter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
