/**
 * Centralized Color System
 *
 * DRY Principle: Single source of truth for all colors used across the application.
 * This eliminates 1,000+ hardcoded color values found in the audit.
 *
 * Usage:
 * import { COLORS } from '@/lib/constants/colors';
 *
 * background: COLORS.background.primary
 * color: COLORS.text.primary
 */

export const COLORS = {
  // Background colors for neumorphic design
  background: {
    primary: '#0f0f0f',    // Main background
    dark: '#050505',        // Dark shadow in neumorphic
    light: '#191919',       // Light shadow in neumorphic
    elevated: '#1a1a1a',    // Slightly raised surfaces
    card: '#141414',        // Card backgrounds
  },

  // Text colors
  text: {
    primary: '#e5e5e5',     // Main text
    secondary: '#a8a8a8',   // Secondary text, muted
    tertiary: '#6b7280',    // Disabled, placeholder
    inverse: '#0f0f0f',     // Text on light backgrounds
  },

  // Brand colors
  brand: {
    violet: '#8b5cf6',      // Primary brand color
    violetLight: '#a78bfa', // Lighter violet for gradients
    violetDark: '#7c3aed',  // Darker violet for hover states
  },

  // Semantic colors
  success: {
    base: '#10b981',        // Green for success states
    light: '#34d399',
    dark: '#059669',
  },

  error: {
    base: '#ef4444',        // Red for errors
    light: '#f87171',
    dark: '#dc2626',
  },

  warning: {
    base: '#f59e0b',        // Orange for warnings
    light: '#fbbf24',
    dark: '#d97706',
  },

  info: {
    base: '#3b82f6',        // Blue for info
    light: '#60a5fa',
    dark: '#2563eb',
  },

  // Border colors
  border: {
    default: '#262626',     // Default borders
    light: '#333333',       // Lighter borders
    dark: '#1a1a1a',        // Darker borders
    focus: '#8b5cf6',       // Focus state (brand violet)
  },

  // Input colors
  input: {
    background: '#0f0f0f',
    border: '#262626',
    borderFocus: '#8b5cf6',
    placeholder: '#6b7280',
    disabled: '#1a1a1a',
  },

  // Overlay colors (for modals, tooltips)
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    medium: 'rgba(0, 0, 0, 0.7)',
    dark: 'rgba(0, 0, 0, 0.9)',
  },

  // Gradient definitions
  gradients: {
    brand: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    brandHover: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)',
    success: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    error: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
  },

  // Domain-specific colors (for subject areas)
  // Note: These integrate with existing lib/constants/domainColors.ts
  domain: {
    general: '#8b5cf6',     // General/default
    threats: '#ef4444',     // Threats & vulnerabilities (red)
    architecture: '#3b82f6', // Architecture (blue)
    implementation: '#10b981', // Implementation (green)
    operations: '#f59e0b',  // Operations (orange)
    governance: '#a78bfa',  // Governance (light purple)
  },
} as const;

// Type helper for accessing colors with intellisense
export type ColorPath =
  | `background.${keyof typeof COLORS.background}`
  | `text.${keyof typeof COLORS.text}`
  | `brand.${keyof typeof COLORS.brand}`
  | `success.${keyof typeof COLORS.success}`
  | `error.${keyof typeof COLORS.error}`
  | `warning.${keyof typeof COLORS.warning}`
  | `info.${keyof typeof COLORS.info}`
  | `border.${keyof typeof COLORS.border}`
  | `input.${keyof typeof COLORS.input}`
  | `overlay.${keyof typeof COLORS.overlay}`
  | `gradients.${keyof typeof COLORS.gradients}`
  | `domain.${keyof typeof COLORS.domain}`;

/**
 * Helper function to get nested color values using dot notation
 * Usage: getColor('background.primary') => '#0f0f0f'
 */
export function getColor(path: ColorPath): string {
  const parts = path.split('.');
  let value: any = COLORS;

  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      console.warn(`Color path "${path}" not found`);
      return COLORS.background.primary; // Safe fallback
    }
  }

  return value;
}
