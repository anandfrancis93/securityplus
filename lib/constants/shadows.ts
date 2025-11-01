/**
 * Centralized Shadow System
 *
 * DRY Principle: Single source of truth for all neumorphic shadows.
 * This eliminates 50+ hardcoded shadow values found in the audit.
 *
 * Neumorphic Design System:
 * - Uses dual shadows (dark and light) to create depth illusion
 * - Dark shadow: #050505 (bottom-right)
 * - Light shadow: #191919 (top-left)
 *
 * Usage:
 * import { SHADOWS } from '@/lib/constants/shadows';
 *
 * boxShadow: SHADOWS.neu.raised
 * boxShadow: SHADOWS.neu.hover
 */

export const SHADOWS = {
  // Neumorphic shadows for the signature design style
  neu: {
    // Standard raised surface (most common)
    raised: '12px 12px 24px #050505, -12px -12px 24px #191919',

    // Hover state - reduced intensity for interactive feedback
    hover: '6px 6px 12px #050505, -6px -6px 12px #191919',

    // Pressed/inset state - inverted shadows
    inset: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',

    // Subtle elevation for nested cards
    subtle: '6px 6px 12px #050505, -6px -6px 12px #191919',

    // Strong elevation for modals and overlays
    strong: '20px 20px 40px #050505, -20px -20px 40px #191919',

    // Focus state - adds brand color glow
    focus: '12px 12px 24px #050505, -12px -12px 24px #191919, 0 0 0 3px rgba(139, 92, 246, 0.3)',

    // Disabled state - very subtle
    disabled: '4px 4px 8px #050505, -4px -4px 8px #191919',
  },

  // Traditional flat shadows (for elements that don't use neumorphic style)
  flat: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  },

  // Inner shadows (for inputs, text areas)
  inner: {
    sm: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
    md: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
    lg: 'inset 0 4px 8px rgba(0, 0, 0, 0.5)',
  },

  // Glow effects (for focus states, highlights)
  glow: {
    brand: '0 0 20px rgba(139, 92, 246, 0.5)',
    brandStrong: '0 0 30px rgba(139, 92, 246, 0.7)',
    success: '0 0 20px rgba(16, 185, 129, 0.5)',
    error: '0 0 20px rgba(239, 68, 68, 0.5)',
    warning: '0 0 20px rgba(245, 158, 11, 0.5)',
  },

  // None - explicitly no shadow
  none: 'none',
} as const;

// Type helper for accessing shadows with intellisense
export type ShadowPath =
  | `neu.${keyof typeof SHADOWS.neu}`
  | `flat.${keyof typeof SHADOWS.flat}`
  | `inner.${keyof typeof SHADOWS.inner}`
  | `glow.${keyof typeof SHADOWS.glow}`
  | 'none';

/**
 * Helper function to get nested shadow values using dot notation
 * Usage: getShadow('neu.raised') => '12px 12px 24px #050505, -12px -12px 24px #191919'
 */
export function getShadow(path: ShadowPath): string {
  if (path === 'none') return SHADOWS.none;

  const parts = path.split('.');
  let value: any = SHADOWS;

  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      console.warn(`Shadow path "${path}" not found`);
      return SHADOWS.none; // Safe fallback
    }
  }

  return value;
}

/**
 * Combine multiple shadows
 * Usage: combineShadows([SHADOWS.neu.raised, SHADOWS.glow.brand])
 */
export function combineShadows(shadows: string[]): string {
  return shadows.filter(s => s && s !== 'none').join(', ');
}
