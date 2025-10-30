'use client';

import { Question } from '@/lib/types';
import { getDomainsFromTopics } from '@/lib/domainDetection';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';

interface QuestionMetadataProps {
  question: Question;
  liquidGlass?: boolean;
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

export default function QuestionMetadata({ question, liquidGlass = true, pointsEarned, maxPoints }: QuestionMetadataProps) {
  const domains = getDomainsFromTopics(question.topics);

  // Group topics by domain
  const topicsByDomain: { [domain: string]: string[] } = {};
  question.topics?.forEach(topic => {
    const topicDomain = getTopicDomain(topic);
    if (!topicsByDomain[topicDomain]) {
      topicsByDomain[topicDomain] = [];
    }
    topicsByDomain[topicDomain].push(topic);
  });

  return (
    <div className={`relative p-12 md:p-16 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-zinc-950 border-2 border-zinc-800 rounded-md'}`}>
      {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}
      <div className="space-y-6 relative">
        {/* Domain(s) */}
        <div className="flex items-start gap-4">
          <span className="text-lg font-semibold text-zinc-400 min-w-[100px] flex-shrink-0">
            {domains.length > 1 ? 'Domain(s):' : 'Domain:'}
          </span>
          <div className="flex flex-col gap-2">
            {domains.map((domain, index) => {
              const color = getDomainColor(domain);
              return (
                <span
                  key={index}
                  className="text-lg font-semibold"
                  style={{
                    color: color,
                  }}
                >
                  {domain.replace('.0', '.')}
                </span>
              );
            })}
          </div>
        </div>

        {/* Topics grouped by domain */}
        {question.topics && question.topics.length > 0 && (
          <div className="flex items-start gap-4">
            <span className="text-lg font-semibold text-zinc-400 min-w-[100px] flex-shrink-0">
              {question.topics.length > 1 ? 'Topic(s):' : 'Topic:'}
            </span>
            <div className="flex flex-col gap-3">
              {Object.entries(topicsByDomain).map(([domain, topics], index) => {
                const color = getDomainColor(domain);
                return (
                  <div key={index} className="flex flex-col gap-1">
                    <span className="text-lg font-semibold" style={{ color }}>
                      {topics.join(', ')}
                    </span>
                    <span className="text-sm font-medium text-zinc-500">
                      {domain.replace('.0', '.')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Type */}
        {question.questionCategory && (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-lg font-semibold text-zinc-400 min-w-[100px]">Type:</span>
            <span className="text-lg font-semibold text-white">
              {question.questionCategory === 'single-domain-single-topic' ? 'Single Domain, Single Topic' :
               question.questionCategory === 'single-domain-multiple-topics' ? 'Single Domain, Multiple Topics' :
               'Multiple Domains, Multiple Topics'}
            </span>
          </div>
        )}

        {/* Difficulty */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-lg font-semibold text-zinc-400 min-w-[100px]">Difficulty:</span>
          <span className={`text-lg font-semibold ${
            question.difficulty === 'easy' ? 'text-green-400' :
            question.difficulty === 'medium' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
        </div>

        {/* Points */}
        {pointsEarned !== undefined && maxPoints !== undefined && (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-lg font-semibold text-zinc-400 min-w-[100px]">Points:</span>
            <span className="text-lg font-semibold text-white">
              {pointsEarned}/{maxPoints}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
