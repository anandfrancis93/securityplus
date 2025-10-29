/**
 * Domain color mapping for Security+ SY0-701 domains
 * Used for visual identification across the app
 */
export const DOMAIN_COLORS: { [key: string]: string } = {
  'General Security Concepts': '#9333ea', // Bright purple
  'Threats, Vulnerabilities, and Mitigations': '#ff4500', // Bright orange-red
  'Security Architecture': '#06b6d4', // Bright cyan
  'Security Operations': '#fbbf24', // Bright yellow
  'Security Program Management and Oversight': '#22c55e', // Bright green
};

/**
 * All Security+ SY0-701 domains in order
 */
export const SECURITY_DOMAINS = [
  'General Security Concepts',
  'Threats, Vulnerabilities, and Mitigations',
  'Security Architecture',
  'Security Operations',
  'Security Program Management and Oversight',
] as const;

/**
 * Helper function to get domain color
 */
export function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || '#22c55e'; // Default to green
}
