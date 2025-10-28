/**
 * Topic Selection with FSRS-based Spaced Repetition
 *
 * Three-phase system:
 * Phase 1: Cover all uncovered topics (0 times covered)
 * Phase 2: Focus on struggling topics with FSRS intervals
 * Phase 3: Maintenance with long FSRS intervals
 */

import { QuizGenerationMetadata, TopicPerformance, TopicCoverageStatus } from './types';
import { ALL_SECURITY_PLUS_TOPICS } from './topicData';
import { getTopicsDueForReview } from './fsrsQuiz';

/**
 * Determine current learning phase
 */
export function determineCurrentPhase(metadata: QuizGenerationMetadata): 1 | 2 | 3 {
  // If phase is explicitly set, use it
  if (metadata.currentPhase) {
    return metadata.currentPhase;
  }

  // Phase 1: Not all topics covered once
  if (!metadata.allTopicsCoveredOnce) {
    return 1;
  }

  // Phase 2: All topics covered, but not all mastered
  const topicPerf = metadata.topicPerformance || {};
  const totalTopics = Object.keys(topicPerf).length;

  if (totalTopics === 0) {
    return 1; // No performance data, still in Phase 1
  }

  const masteredCount = Object.values(topicPerf).filter(t => t.isMastered).length;
  const masteredPercentage = (masteredCount / totalTopics) * 100;

  // Phase 3: Most topics mastered (>70%) or 50+ quizzes completed
  if (masteredPercentage > 70 || metadata.totalQuizzesCompleted >= 50) {
    return 3;
  }

  // Phase 2: Learning and struggling
  return 2;
}

/**
 * Get uncovered topics for Phase 1
 */
export function getUncoveredTopics(metadata: QuizGenerationMetadata): string[] {
  return Object.values(metadata.topicCoverage)
    .filter(topic => topic.timesCovered === 0)
    .map(topic => topic.topicName);
}

/**
 * Group topics by domain
 */
export function groupTopicsByDomain(
  topics: string[],
  metadata: QuizGenerationMetadata
): Map<string, string[]> {
  const byDomain = new Map<string, string[]>();

  topics.forEach(topicName => {
    const coverage = metadata.topicCoverage[topicName];
    if (coverage) {
      const domain = coverage.domain;
      if (!byDomain.has(domain)) {
        byDomain.set(domain, []);
      }
      byDomain.get(domain)!.push(topicName);
    }
  });

  return byDomain;
}

/**
 * Select topics for Phase 1: Prioritize uncovered topics with domain balancing
 */
export function selectPhase1Topics(
  metadata: QuizGenerationMetadata,
  count: number
): string[] {
  const uncovered = getUncoveredTopics(metadata);

  if (uncovered.length === 0) {
    console.log('[FSRS] Phase 1 complete! All topics covered at least once.');
    return [];
  }

  // Group uncovered topics by domain
  const byDomain = groupTopicsByDomain(uncovered, metadata);

  // Sort domains by number of uncovered topics (descending)
  const sortedDomains = Array.from(byDomain.entries())
    .sort((a, b) => b[1].length - a[1].length);

  const selected: string[] = [];

  // Round-robin selection across domains for balance
  let domainIndex = 0;
  while (selected.length < count && selected.length < uncovered.length) {
    const [domain, topics] = sortedDomains[domainIndex % sortedDomains.length];

    // Find an unselected topic from this domain
    const availableTopics = topics.filter(t => !selected.includes(t));
    if (availableTopics.length > 0) {
      const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      selected.push(randomTopic);
    }

    domainIndex++;

    // Safety check: if we've cycled through all domains and still need more
    if (domainIndex >= sortedDomains.length * 10 && selected.length < count) {
      // Just pick random uncovered topics
      const remaining = uncovered.filter(t => !selected.includes(t));
      if (remaining.length > 0) {
        selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
      } else {
        break;
      }
    }
  }

  console.log(`[FSRS Phase 1] Selected ${selected.length} uncovered topics from ${sortedDomains.length} domains`);
  console.log(`[FSRS Phase 1] Remaining uncovered: ${uncovered.length - selected.length}`);

  return selected;
}

/**
 * Select topics for Phase 2: Focus on struggling topics with FSRS
 */
export function selectPhase2Topics(
  metadata: QuizGenerationMetadata,
  count: number,
  currentQuizNumber: number
): string[] {
  const topicPerf = metadata.topicPerformance || {};

  // Get topics due for review (FSRS-scheduled)
  const dueTopics = getTopicsDueForReview(topicPerf, currentQuizNumber);

  // Categorize topics
  const struggling = dueTopics.filter(t => t.isStruggling);
  const learning = dueTopics.filter(t => !t.isMastered && !t.isStruggling);
  const mastered = dueTopics.filter(t => t.isMastered);

  const selected: string[] = [];

  // Phase 2 distribution: 50% struggling, 30% learning, 20% mastered
  const strugglingCount = Math.ceil(count * 0.5);
  const learningCount = Math.ceil(count * 0.3);
  const masteredCount = count - strugglingCount - learningCount;

  // Select struggling topics (high priority)
  for (let i = 0; i < Math.min(strugglingCount, struggling.length); i++) {
    selected.push(struggling[i].topicName);
  }

  // Fill remaining struggling slots with learning topics
  const remainingStruggling = strugglingCount - selected.length;
  for (let i = 0; i < Math.min(remainingStruggling, learning.length); i++) {
    selected.push(learning[i].topicName);
  }

  // Select learning topics
  const learningStartIndex = selected.filter(t => {
    const topic = topicPerf[t];
    return !topic.isMastered && !topic.isStruggling;
  }).length;

  for (let i = learningStartIndex; i < Math.min(learningCount, learning.length); i++) {
    if (!selected.includes(learning[i].topicName)) {
      selected.push(learning[i].topicName);
    }
  }

  // Select mastered topics for maintenance
  for (let i = 0; i < Math.min(masteredCount, mastered.length); i++) {
    if (!selected.includes(mastered[i].topicName)) {
      selected.push(mastered[i].topicName);
    }
  }

  // If we still need more topics, select randomly from all topics
  if (selected.length < count) {
    const allTopics = Object.keys(topicPerf);
    const remaining = allTopics.filter(t => !selected.includes(t));

    while (selected.length < count && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      selected.push(remaining[randomIndex]);
      remaining.splice(randomIndex, 1);
    }
  }

  console.log(`[FSRS Phase 2] Selected ${selected.length} topics:`);
  console.log(`  - Struggling: ${selected.filter(t => topicPerf[t]?.isStruggling).length}`);
  console.log(`  - Learning: ${selected.filter(t => !topicPerf[t]?.isMastered && !topicPerf[t]?.isStruggling).length}`);
  console.log(`  - Mastered: ${selected.filter(t => topicPerf[t]?.isMastered).length}`);

  return selected.slice(0, count);
}

/**
 * Select topics for Phase 3: Maintenance with variety
 */
export function selectPhase3Topics(
  metadata: QuizGenerationMetadata,
  count: number,
  currentQuizNumber: number
): string[] {
  const topicPerf = metadata.topicPerformance || {};

  // Get topics due for review
  const dueTopics = getTopicsDueForReview(topicPerf, currentQuizNumber);

  // Categorize
  const struggling = dueTopics.filter(t => t.isStruggling);
  const mastered = dueTopics.filter(t => t.isMastered);
  const allTopics = Object.keys(topicPerf);

  const selected: string[] = [];

  // Phase 3 distribution: 20% struggling (if any), 30% due mastered, 50% random variety
  const strugglingCount = Math.ceil(count * 0.2);
  const masteredCount = Math.ceil(count * 0.3);
  const randomCount = count - strugglingCount - masteredCount;

  // Prioritize any struggling topics (shouldn't be many in Phase 3)
  for (let i = 0; i < Math.min(strugglingCount, struggling.length); i++) {
    selected.push(struggling[i].topicName);
  }

  // Add due mastered topics for maintenance
  for (let i = 0; i < Math.min(masteredCount, mastered.length); i++) {
    if (!selected.includes(mastered[i].topicName)) {
      selected.push(mastered[i].topicName);
    }
  }

  // Fill rest with random topics for variety
  const remaining = allTopics.filter(t => !selected.includes(t));
  for (let i = 0; i < randomCount && remaining.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex]);
    remaining.splice(randomIndex, 1);
  }

  console.log(`[FSRS Phase 3] Selected ${selected.length} topics for maintenance and variety`);

  return selected.slice(0, count);
}

/**
 * Main topic selection function with FSRS
 */
export function selectTopicsWithFSRS(
  metadata: QuizGenerationMetadata,
  count: number,
  questionCategory?: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics'
): string[] {
  const currentQuizNumber = metadata.totalQuizzesCompleted + 1;
  const phase = determineCurrentPhase(metadata);

  console.log(`[FSRS] Quiz ${currentQuizNumber}, Phase ${phase}`);

  let selectedTopics: string[] = [];

  switch (phase) {
    case 1:
      selectedTopics = selectPhase1Topics(metadata, count);
      break;
    case 2:
      selectedTopics = selectPhase2Topics(metadata, count, currentQuizNumber);
      break;
    case 3:
      selectedTopics = selectPhase3Topics(metadata, count, currentQuizNumber);
      break;
  }

  // If we're asking for single-domain questions, ensure they're from same domain
  if (questionCategory === 'single-domain-single-topic' || questionCategory === 'single-domain-multiple-topics') {
    selectedTopics = ensureSameDomain(selectedTopics, metadata, count);
  }

  // If we're asking for cross-domain, ensure they're from different domains
  if (questionCategory === 'multiple-domains-multiple-topics') {
    selectedTopics = ensureCrossDomain(selectedTopics, metadata, count);
  }

  return selectedTopics.slice(0, count);
}

/**
 * Ensure selected topics are from the same domain
 */
function ensureSameDomain(
  topics: string[],
  metadata: QuizGenerationMetadata,
  count: number
): string[] {
  if (topics.length === 0) return topics;

  // Group by domain
  const byDomain = groupTopicsByDomain(topics, metadata);

  // Find domain with most topics
  let maxDomain = '';
  let maxCount = 0;

  for (const [domain, domainTopics] of byDomain) {
    if (domainTopics.length > maxCount) {
      maxCount = domainTopics.length;
      maxDomain = domain;
    }
  }

  // Return topics from that domain
  const sameDomainTopics = byDomain.get(maxDomain) || [];

  // If we don't have enough from this domain, get more from it
  if (sameDomainTopics.length < count) {
    const allDomainTopics = ALL_SECURITY_PLUS_TOPICS[maxDomain] || [];
    const additional = allDomainTopics.filter(t => !sameDomainTopics.includes(t));

    while (sameDomainTopics.length < count && additional.length > 0) {
      const randomIndex = Math.floor(Math.random() * additional.length);
      sameDomainTopics.push(additional[randomIndex]);
      additional.splice(randomIndex, 1);
    }
  }

  return sameDomainTopics.slice(0, count);
}

/**
 * Ensure selected topics are from different domains
 */
function ensureCrossDomain(
  topics: string[],
  metadata: QuizGenerationMetadata,
  count: number
): string[] {
  const byDomain = groupTopicsByDomain(topics, metadata);

  const selected: string[] = [];
  const domains = Array.from(byDomain.keys());

  // Round-robin across domains
  let domainIndex = 0;
  while (selected.length < count && domains.length > 0) {
    const domain = domains[domainIndex % domains.length];
    const domainTopics = byDomain.get(domain) || [];

    const available = domainTopics.filter(t => !selected.includes(t));
    if (available.length > 0) {
      selected.push(available[0]);
    }

    domainIndex++;

    // If we've gone through all domains, break
    if (domainIndex >= domains.length * count) break;
  }

  return selected.slice(0, count);
}

/**
 * Check if Phase 1 is complete and should transition to Phase 2
 */
export function checkPhaseTransition(metadata: QuizGenerationMetadata): {
  shouldTransition: boolean;
  newPhase?: 2 | 3;
  message?: string;
} {
  const currentPhase = determineCurrentPhase(metadata);

  // Phase 1 -> Phase 2 transition
  if (currentPhase === 1 && metadata.allTopicsCoveredOnce) {
    return {
      shouldTransition: true,
      newPhase: 2,
      message: '🎉 Phase 1 Complete! All topics covered once. Entering Phase 2: Focus on weak areas.',
    };
  }

  // Phase 2 -> Phase 3 transition
  if (currentPhase === 2) {
    const topicPerf = metadata.topicPerformance || {};
    const totalTopics = Object.keys(topicPerf).length;
    const masteredCount = Object.values(topicPerf).filter(t => t.isMastered).length;
    const masteredPercentage = totalTopics > 0 ? (masteredCount / totalTopics) * 100 : 0;

    if (masteredPercentage > 70 || metadata.totalQuizzesCompleted >= 50) {
      return {
        shouldTransition: true,
        newPhase: 3,
        message: '🎓 Phase 2 Complete! Most topics mastered. Entering Phase 3: Maintenance mode.',
      };
    }
  }

  return { shouldTransition: false };
}
