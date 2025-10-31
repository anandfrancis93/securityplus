'use client';

import { Question } from '@/lib/types';
import { getDomainsFromTopics } from '@/lib/domainDetection';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';

interface QuestionMetadataProps {
  question: Question;
  pointsEarned?: number;
  maxPoints?: number;
}

// Domain color mapping - More vibrant and distinct colors
const DOMAIN_COLORS: { [key: string]: string } = {
  '1.0 General Security Concepts': '#9333ea', // Bright purple
  '2.0 Threats, Vulnerabilities, and Mitigations': '#ff4500', // Bright orange-red
  '3.0 Security Architecture': '#06b6d4', // Bright cyan
  '4.0 Security Operations': '#fbbf24', // Bright yellow
  '5.0 Security Program Management and Oversight': '#22c55e', // Bright green
};

// Helper function to get domain color
function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || '#ffffff';
}

// Helper function to get the domain for a specific topic
function getTopicDomain(topic: string): string {
  for (const [domain, domainTopics] of Object.entries(ALL_SECURITY_PLUS_TOPICS)) {
    if (domainTopics.includes(topic)) {
      return domain;
    }
  }
  return '1.0 General Security Concepts';
}

export default function QuestionMetadata({ question, pointsEarned, maxPoints }: QuestionMetadataProps) {
  const domains = getDomainsFromTopics(question.topics);

  // Group topics by domain, maintaining the same order as domains array
  const topicsByDomain: { [domain: string]: string[] } = {};
  question.topics?.forEach(topic => {
    const topicDomain = getTopicDomain(topic);
    if (!topicsByDomain[topicDomain]) {
      topicsByDomain[topicDomain] = [];
    }
    topicsByDomain[topicDomain].push(topic);
  });

  // Create ordered array of domain-topics pairs matching the domains order
  const orderedTopicsByDomain = domains.map(domain => ({
    domain,
    topics: topicsByDomain[domain] || []
  }));

  return (
    <div style={{
      position: 'relative',
      padding: '3rem',
      background: '#0f0f0f',
      borderRadius: '24px',
      boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Domain(s) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#a8a8a8',
            minWidth: '120px',
            flexShrink: 0,
          }}>
            {domains.length > 1 ? 'Domain(s):' : 'Domain:'}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {domains.map((domain, index) => {
              const color = getDomainColor(domain);
              return (
                <span
                  key={index}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: color,
                    transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {domain.replace('.0', '.')}
                </span>
              );
            })}
          </div>
        </div>

        {/* Topics grouped by domain - ordered to match domains display */}
        {question.topics && question.topics.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#a8a8a8',
              minWidth: '120px',
              flexShrink: 0,
            }}>
              {question.topics.length > 1 ? 'Topic(s):' : 'Topic:'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {orderedTopicsByDomain.map(({ domain, topics }, index) => {
                const color = getDomainColor(domain);
                return (
                  <span
                    key={index}
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: color,
                      transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {topics.join(', ')}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Type */}
        {question.questionCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#a8a8a8',
              minWidth: '120px',
            }}>
              Type:
            </span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#e5e5e5',
            }}>
              {question.questionCategory === 'single-domain-single-topic' ? 'Single Domain, Single Topic' :
               question.questionCategory === 'single-domain-multiple-topics' ? 'Single Domain, Multiple Topics' :
               'Multiple Domains, Multiple Topics'}
            </span>
          </div>
        )}

        {/* Difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#a8a8a8',
            minWidth: '120px',
          }}>
            Difficulty:
          </span>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: question.difficulty === 'easy' ? '#4ade80' :
                   question.difficulty === 'medium' ? '#facc15' :
                   '#f87171',
            transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
        </div>

        {/* Points */}
        {pointsEarned !== undefined && maxPoints !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#a8a8a8',
              minWidth: '120px',
            }}>
              Points:
            </span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#e5e5e5',
            }}>
              {pointsEarned}/{maxPoints}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
