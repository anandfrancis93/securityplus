import { ALL_SECURITY_PLUS_TOPICS } from './topicData';

/**
 * Detects the Security+ SY0-701 domain based on question topics
 * Looks up topics in the authoritative ALL_SECURITY_PLUS_TOPICS mapping
 */
export function getDomainFromTopics(topics: string[]): string {
  if (!topics || topics.length === 0) {
    return '1.0 General Security Concepts';
  }

  // Look up each topic in ALL_SECURITY_PLUS_TOPICS to find its actual domain
  for (const topic of topics) {
    for (const [domain, domainTopics] of Object.entries(ALL_SECURITY_PLUS_TOPICS)) {
      if (domainTopics.includes(topic)) {
        return domain;
      }
    }
  }

  // If no exact match found, default to most general domain
  console.warn(`No domain found for topics: ${topics.join(', ')}`);
  return '1.0 General Security Concepts';
}

/**
 * Detects all unique Security+ domains covered by the given topics
 * Returns an array of domains, useful for cross-domain synthesis questions
 */
export function getDomainsFromTopics(topics: string[]): string[] {
  const domains = new Set<string>();

  // Look up each topic individually
  for (const topic of topics) {
    for (const [domain, domainTopics] of Object.entries(ALL_SECURITY_PLUS_TOPICS)) {
      if (domainTopics.includes(topic)) {
        domains.add(domain);
        break; // Found the domain for this topic, move to next topic
      }
    }
  }

  // If no domains found, return default
  if (domains.size === 0) {
    console.warn(`No domains found for topics: ${topics.join(', ')}`);
    return ['1.0 General Security Concepts'];
  }

  // Return sorted array of unique domains
  return Array.from(domains).sort();
}
