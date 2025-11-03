'use client';

import React, { useState } from 'react';
import { UserProgress, TopicPerformance } from '@/lib/types';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';

interface TopicReviewScheduleProps {
  userProgress: UserProgress | null;
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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  // Handle null userProgress
  if (!userProgress || !userProgress.quizHistory || userProgress.quizHistory.length === 0) {
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
          No quiz data yet. Complete quizzes to see topic review schedule.
        </p>
      </div>
    );
  }

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

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    background: '#0f0f0f',
    borderRadius: '24px',
    boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    position: 'relative',
    padding: '40px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'clamp(24px, 5vw, 36px)',
    fontWeight: 'bold',
    color: '#e5e5e5',
    marginBottom: '8px',
    letterSpacing: '-0.025em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#a8a8a8',
    lineHeight: '1.5',
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  };

  const statCardBaseStyle: React.CSSProperties = {
    position: 'relative',
    background: '#0f0f0f',
    borderRadius: '16px',
    padding: '24px',
    cursor: 'help',
    transition: 'all 0.3s ease',
  };

  const statCardRaisedStyle: React.CSSProperties = {
    ...statCardBaseStyle,
    boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919',
  };

  const statCardOverdueStyle: React.CSSProperties = {
    ...statCardBaseStyle,
    boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919, inset 0 0 20px rgba(244, 63, 94, 0.1)',
  };

  const statCardDueNowStyle: React.CSSProperties = {
    ...statCardBaseStyle,
    boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919, inset 0 0 20px rgba(245, 158, 11, 0.1)',
  };

  const statCardDueSoonStyle: React.CSSProperties = {
    ...statCardBaseStyle,
    boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919, inset 0 0 20px rgba(16, 185, 129, 0.1)',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#a8a8a8',
    marginBottom: '8px',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#e5e5e5',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '8px',
    width: '256px',
    zIndex: 50,
    background: '#0f0f0f',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
  };

  const tooltipTextStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#e5e5e5',
    lineHeight: '1.6',
  };

  const separatorStyle: React.CSSProperties = {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #191919, transparent)',
    margin: '0',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '40px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#e5e5e5',
    marginBottom: '16px',
  };

  const sectionDescStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#a8a8a8',
    marginBottom: '24px',
    lineHeight: '1.6',
  };

  const topicGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  };

  const topicCardStyle: React.CSSProperties = {
    background: '#0f0f0f',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '8px 8px 16px #050505, -8px -8px 16px #191919',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const topicNameStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#e5e5e5',
    marginBottom: '8px',
  };

  const topicDomainStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
  };

  const filterButtonsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const getFilterButtonStyle = (isActive: boolean, buttonId: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      borderRadius: '16px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: '#0f0f0f',
      color: isActive ? '#e5e5e5' : '#a8a8a8',
    };

    if (isActive) {
      return {
        ...baseStyle,
        boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
      };
    }

    if (hoveredButton === buttonId) {
      return {
        ...baseStyle,
        boxShadow: 'inset 2px 2px 4px #050505, inset -2px -2px 4px #191919',
      };
    }

    return {
      ...baseStyle,
      boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
    };
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
  };

  const tableHeaderStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#e5e5e5',
  };

  const tableHeaderCenterStyle: React.CSSProperties = {
    ...tableHeaderStyle,
    textAlign: 'center',
  };

  const getTableRowStyle = (index: number): React.CSSProperties => {
    return {
      background: '#0f0f0f',
      borderRadius: '12px',
      boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  const tableCellStyle: React.CSSProperties = {
    padding: '16px',
    fontSize: '14px',
    color: '#e5e5e5',
  };

  const tableCellCenterStyle: React.CSSProperties = {
    ...tableCellStyle,
    textAlign: 'center',
  };

  const statusBadgeStyle = (status: string): React.CSSProperties => {
    let color = '#a8a8a8';
    if (status === 'overdue') color = '#f43f5e';
    if (status === 'due-now') color = '#f59e0b';
    if (status === 'due-soon') color = '#10b981';
    if (status === 'future') color = '#8b5cf6';

    return {
      display: 'inline-block',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      color: color,
      background: '#0f0f0f',
      borderRadius: '8px',
      boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
    };
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#a8a8a8',
    fontSize: '16px',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={titleStyle}>
              Topic Review Schedule
            </h3>
            <p style={subtitleStyle}>
              Verify when topics are scheduled for review
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '16px',
              background: '#0f0f0f',
              borderRadius: '16px',
              boxShadow: isExpanded
                ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                : '8px 8px 16px #050505, -8px -8px 16px #191919',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Topic Review Schedule"
          >
            <svg
              style={{
                width: '32px',
                height: '32px',
                color: '#a8a8a8',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
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

        {/* Statistics Summary */}
        {isExpanded && (
        <div style={statsGridStyle}>
          {/* Quizzes Completed Card */}
          <div
            style={statCardRaisedStyle}
            onMouseEnter={() => setHoveredCard('current')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={statLabelStyle}>Quizzes Completed</div>
            <div style={statValueStyle}>{currentQuizNumber}</div>

            {/* Tooltip */}
            {hoveredCard === 'current' && (
              <div style={tooltipStyle}>
                <div style={tooltipTextStyle}>
                  The total number of quizzes you have completed so far. Topics are scheduled based on this number.
                </div>
                {/* Arrow */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-1px)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #191919',
                }} />
              </div>
            )}
          </div>

          {/* Overdue Card */}
          <div
            style={statCardOverdueStyle}
            onMouseEnter={() => setHoveredCard('overdue')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ ...statLabelStyle, color: '#f43f5e' }}>Overdue</div>
            <div style={{ ...statValueStyle, color: '#f43f5e' }}>{overdueCount}</div>

            {/* Tooltip */}
            {hoveredCard === 'overdue' && (
              <div style={tooltipStyle}>
                <div style={tooltipTextStyle}>
                  Topics that were scheduled to be reviewed in previous quizzes but haven&apos;t appeared yet. These should be prioritized in your next quiz.
                </div>
                {/* Arrow */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-1px)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #191919',
                }} />
              </div>
            )}
          </div>

          {/* Due Now Card */}
          <div
            style={statCardDueNowStyle}
            onMouseEnter={() => setHoveredCard('due-now')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ ...statLabelStyle, color: '#f59e0b' }}>Due Now</div>
            <div style={{ ...statValueStyle, color: '#f59e0b' }}>{dueNowCount}</div>

            {/* Tooltip */}
            {hoveredCard === 'due-now' && (
              <div style={tooltipStyle}>
                <div style={tooltipTextStyle}>
                  Topics scheduled to be reviewed in your next quiz (Quiz #{nextQuizNumber}). These are ready for review based on FSRS optimal spacing.
                </div>
                {/* Arrow */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-1px)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #191919',
                }} />
              </div>
            )}
          </div>

          {/* Due Soon Card */}
          <div
            style={statCardDueSoonStyle}
            onMouseEnter={() => setHoveredCard('due-soon')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ ...statLabelStyle, color: '#10b981' }}>Due Soon</div>
            <div style={{ ...statValueStyle, color: '#10b981' }}>{dueSoonCount}</div>

            {/* Tooltip */}
            {hoveredCard === 'due-soon' && (
              <div style={tooltipStyle}>
                <div style={tooltipTextStyle}>
                  Topics scheduled to be reviewed within the next 1-3 quizzes. These will appear soon as you continue taking quizzes.
                </div>
                {/* Arrow */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-1px)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #191919',
                }} />
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ position: 'relative' }}>
          <div style={separatorStyle} />

          {/* Next Quiz Preview */}
          <div style={sectionStyle}>
            <h4 style={sectionTitleStyle}>
              Expected Topics in Quiz #{nextQuizNumber}
            </h4>
            {nextQuizTopics.length === 0 ? (
              <div style={emptyStateStyle}>
                <p style={{ marginBottom: '8px', fontSize: '18px' }}>No topic data available yet</p>
                <p style={{ fontSize: '14px' }}>Take your first quiz to start tracking topic performance and scheduling</p>
              </div>
            ) : (
              <>
                <p style={sectionDescStyle}>
                  Based on FSRS scheduling, these {nextQuizTopics.length} topics are likely to appear in your next quiz:
                </p>
                <div style={topicGridStyle}>
                  {nextQuizTopics.slice(0, 10).map((topic, index) => {
                const domainColor = getDomainColor(topic.domain);
                return (
                  <div
                    key={index}
                    style={topicCardStyle}
                  >
                    <div style={topicNameStyle}>{topic.topicName}</div>
                    <div
                      style={{ ...topicDomainStyle, color: domainColor }}
                    >
                      {topic.domain.replace('.0', '.')}
                    </div>
                  </div>
                );
              })}
                </div>
                {nextQuizTopics.length > 10 && (
                  <p style={{ marginTop: '16px', fontSize: '14px', color: '#666666' }}>
                    + {nextQuizTopics.length - 10} more topics may appear
                  </p>
                )}
              </>
            )}
          </div>

          <div style={separatorStyle} />

          {/* Filter Buttons */}
          <div style={sectionStyle}>
            <div style={filterButtonsStyle}>
              <button
                onClick={() => setFilterStatus('all')}
                onMouseEnter={() => setHoveredButton('filter-all')}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setActiveButton('filter-all')}
                onMouseUp={() => setActiveButton(null)}
                style={getFilterButtonStyle(filterStatus === 'all', 'filter-all')}
              >
                All Topics ({topicsWithSchedule.length})
              </button>
              <button
                onClick={() => setFilterStatus('overdue')}
                onMouseEnter={() => setHoveredButton('filter-overdue')}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setActiveButton('filter-overdue')}
                onMouseUp={() => setActiveButton(null)}
                style={{
                  ...getFilterButtonStyle(filterStatus === 'overdue', 'filter-overdue'),
                  color: filterStatus === 'overdue' ? '#f43f5e' : '#a8a8a8',
                }}
              >
                Overdue & Due ({overdueCount + dueNowCount})
              </button>
              <button
                onClick={() => setFilterStatus('due-soon')}
                onMouseEnter={() => setHoveredButton('filter-due-soon')}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setActiveButton('filter-due-soon')}
                onMouseUp={() => setActiveButton(null)}
                style={{
                  ...getFilterButtonStyle(filterStatus === 'due-soon', 'filter-due-soon'),
                  color: filterStatus === 'due-soon' ? '#10b981' : '#a8a8a8',
                }}
              >
                Due Soon ({dueSoonCount})
              </button>
              <button
                onClick={() => setFilterStatus('future')}
                onMouseEnter={() => setHoveredButton('filter-future')}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setActiveButton('filter-future')}
                onMouseUp={() => setActiveButton(null)}
                style={{
                  ...getFilterButtonStyle(filterStatus === 'future', 'filter-future'),
                  color: filterStatus === 'future' ? '#8b5cf6' : '#a8a8a8',
                }}
              >
                Future Reviews
              </button>
            </div>
          </div>

          <div style={separatorStyle} />

          {/* Topics Table */}
          <div style={{ ...sectionStyle, overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Topic</th>
                  <th style={tableHeaderStyle}>Domain</th>
                  <th style={tableHeaderCenterStyle}>Status</th>
                  <th style={tableHeaderCenterStyle}>Next Review</th>
                  <th style={tableHeaderCenterStyle}>Quizzes Until Due</th>
                  <th style={tableHeaderCenterStyle}>Accuracy</th>
                  <th style={tableHeaderCenterStyle}>Tested</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.slice(0, 50).map((topic, index) => {
                  const domainColor = getDomainColor(topic.domain);
                  return (
                    <tr key={index} style={getTableRowStyle(index)}>
                      <td style={{ ...tableCellStyle, borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                        {topic.topicName}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: domainColor }}>
                          {topic.domain.replace('.0', '.')}
                        </span>
                      </td>
                      <td style={tableCellCenterStyle}>
                        <span style={statusBadgeStyle(topic.status)}>
                          {topic.status === 'overdue' ? 'Overdue' :
                           topic.status === 'due-now' ? 'Due Now' :
                           topic.status === 'due-soon' ? 'Due Soon' :
                           topic.status === 'future' ? 'Future' :
                           'Never Tested'}
                        </span>
                      </td>
                      <td style={{ ...tableCellCenterStyle, fontWeight: 'bold' }}>
                        {topic.questionsAnswered === 0 ? '-' : `Quiz #${topic.nextReviewQuiz}`}
                      </td>
                      <td style={{ ...tableCellCenterStyle, fontWeight: 'bold' }}>
                        {topic.questionsAnswered === 0 ? (
                          <span style={{ color: '#666666' }}>-</span>
                        ) : topic.quizzesUntilDue < 0 ? (
                          <span style={{ color: '#f43f5e' }}>{topic.quizzesUntilDue} (overdue)</span>
                        ) : topic.quizzesUntilDue === 0 ? (
                          <span style={{ color: '#f59e0b' }}>Now</span>
                        ) : (
                          <span style={{ color: '#10b981' }}>+{topic.quizzesUntilDue}</span>
                        )}
                      </td>
                      <td style={{
                        ...tableCellCenterStyle,
                        fontWeight: 'bold',
                        color: topic.questionsAnswered === 0 ? '#666666' :
                               topic.accuracy >= 80 ? '#10b981' :
                               topic.accuracy >= 60 ? '#f59e0b' :
                               '#f43f5e'
                      }}>
                        {topic.questionsAnswered === 0 ? '-' : `${topic.accuracy.toFixed(0)}%`}
                      </td>
                      <td style={{ ...tableCellCenterStyle, fontWeight: 'bold', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                        {topic.questionsAnswered === 0 ? '-' : `${topic.questionsAnswered}×`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTopics.length > 50 && (
              <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#666666' }}>
                Showing first 50 topics. Use filters to narrow down or export full data.
              </p>
            )}
            {filteredTopics.length === 0 && (
              <p style={emptyStateStyle}>
                No topics match this filter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
