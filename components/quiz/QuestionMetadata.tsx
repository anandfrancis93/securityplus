'use client';

import { Question } from '@/lib/types';
import { getDomainsFromTopics } from '@/lib/domainDetection';
import { ALL_SECURITY_PLUS_TOPICS } from '@/lib/topicData';

// Token estimation and cost calculation
function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function getProviderPricing(): { provider: string; inputPrice: number; outputPrice: number } {
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude';

  switch (provider) {
    case 'gemini':
      return { provider: 'Google Gemini 2.5 Flash-Lite', inputPrice: 0.10, outputPrice: 0.40 };
    case 'grok':
      return { provider: 'xAI Grok 4 Fast', inputPrice: 0.20, outputPrice: 0.50 };
    case 'claude':
      return { provider: 'Claude Sonnet 4.5', inputPrice: 3.00, outputPrice: 15.00 };
    default:
      return { provider: 'Unknown', inputPrice: 0, outputPrice: 0 };
  }
}

function calculateQuestionCost(question: Question): {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  // Estimate input tokens (system prompt + topics reference + generation prompt)
  // Based on actual measurements: ~5,950 tokens average per question
  const estimatedInputTokens = 5950;

  // Estimate output tokens from generated content
  const questionText = question.question;
  const optionsText = question.options.join(' ');
  const explanationsText = question.incorrectExplanations?.join(' ') || question.explanation;
  const metadataText = JSON.stringify(question.metadata || {});

  const outputText = questionText + optionsText + explanationsText + metadataText;
  const estimatedOutputTokens = estimateTokens(outputText);

  // Get pricing
  const { inputPrice, outputPrice } = getProviderPricing();

  // Calculate costs (prices are per 1M tokens)
  const inputCost = (estimatedInputTokens / 1_000_000) * inputPrice;
  const outputCost = (estimatedOutputTokens / 1_000_000) * outputPrice;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
    inputCost,
    outputCost,
    totalCost
  };
}

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

  // Calculate token usage and cost
  const costData = calculateQuestionCost(question);
  const { provider } = getProviderPricing();

  return (
    <div className="metadata-card" style={{
      position: 'relative',
      background: '#0f0f0f',
      borderRadius: 'clamp(16px, 2vw, 24px)',
      boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 24px)' }}>
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

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, #333, transparent)',
          margin: '8px 0',
        }} />

        {/* AI Provider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#a8a8a8',
            minWidth: '120px',
          }}>
            AI Provider:
          </span>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#8b5cf6',
          }}>
            {provider}
          </span>
        </div>

        {/* Token Usage */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#a8a8a8',
            minWidth: '120px',
            flexShrink: 0,
          }}>
            Tokens:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#06b6d4',
              }}>
                Input:
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#e5e5e5',
              }}>
                {costData.inputTokens.toLocaleString()} tokens
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#f59e0b',
              }}>
                Output:
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#e5e5e5',
              }}>
                {costData.outputTokens.toLocaleString()} tokens
              </span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#a8a8a8',
            minWidth: '120px',
            flexShrink: 0,
          }}>
            Cost:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#06b6d4',
              }}>
                Input:
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#e5e5e5',
              }}>
                ${costData.inputCost.toFixed(6)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#f59e0b',
              }}>
                Output:
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#e5e5e5',
              }}>
                ${costData.outputCost.toFixed(6)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.25rem', borderTop: '1px solid #333' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#10b981',
              }}>
                Total:
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#10b981',
              }}>
                ${costData.totalCost.toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ============================================
           MOBILE-FIRST RESPONSIVE DESIGN
           Fluid scaling from 320px to 3840px (4K)
           Breakpoints: 768px, 1024px, 1280px, 1440px, 1920px
           ============================================ */

        /* Base styles: Mobile (320px+) */
        .metadata-card {
          padding: clamp(20px, 4vw, 32px);
          margin-top: clamp(24px, 4vw, 48px);
        }

        /* Tablet (768px+) */
        @media (min-width: 768px) {
          .metadata-card {
            padding: clamp(32px, 4vw, 40px);
            margin-top: clamp(32px, 4vw, 48px);
          }
        }

        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .metadata-card {
            padding: clamp(36px, 3vw, 48px);
          }
        }

        /* XL Desktop (1440px+) */
        @media (min-width: 1440px) {
          .metadata-card {
            padding: 48px;
            margin-top: 48px;
          }
        }

        /* 4K (1920px+) - Cap maximum sizes */
        @media (min-width: 1920px) {
          .metadata-card {
            max-width: 1600px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </div>
  );
}
