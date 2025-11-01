/**
 * Centralized Timing System
 *
 * DRY Principle: Single source of truth for all animation timings,
 * transitions, and duration-related constants.
 *
 * Usage:
 * import { TIMING } from '@/lib/constants/timing';
 *
 * transition: `all ${TIMING.transition.normal} ${TIMING.easing.smooth}`
 * setTimeout(() => {}, TIMING.delay.medium)
 */

export const TIMING = {
  // Transition durations (in milliseconds and CSS format)
  transition: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Transition durations as numbers (for setTimeout, etc.)
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },

  // Easing functions for smooth animations
  easing: {
    linear: 'linear',
    smooth: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },

  // Delays (in milliseconds and CSS format)
  delay: {
    none: '0ms',
    short: '100ms',
    medium: '200ms',
    long: '400ms',
  },

  // Delays as numbers (for setTimeout, etc.)
  delayMs: {
    none: 0,
    short: 100,
    medium: 200,
    long: 400,
  },

  // Auto-save and debounce intervals
  autoSave: {
    quiz: 2000,           // Auto-save quiz state every 2 seconds
    flashcard: 3000,      // Auto-save flashcard progress every 3 seconds
    settings: 1000,       // Save settings after 1 second of inactivity
  },

  // Debounce delays for user input
  debounce: {
    search: 300,          // Search input debounce
    resize: 150,          // Window resize debounce
    scroll: 100,          // Scroll event debounce
    input: 500,           // General input debounce
  },

  // Toast/notification durations
  toast: {
    short: 2000,          // 2 seconds
    normal: 3000,         // 3 seconds
    long: 5000,           // 5 seconds
    error: 7000,          // 7 seconds for errors (more time to read)
  },

  // Loading and spinner delays
  loading: {
    minDisplay: 500,      // Minimum time to show spinner (prevents flicker)
    timeout: 30000,       // 30 seconds before showing timeout error
    retry: 3000,          // Wait 3 seconds before retry
  },

  // Animation keyframe durations
  animation: {
    fadeIn: 300,
    fadeOut: 200,
    slideIn: 300,
    slideOut: 200,
    scale: 200,
    rotate: 500,
    celebration: 2000,    // Confetti celebration duration
  },

  // FSRS-related timing
  fsrs: {
    reviewWindow: 86400000, // 24 hours in milliseconds
    gracePeriod: 3600000,   // 1 hour grace period
  },

  // Quiz-related timing
  quiz: {
    questionTransition: 300,    // Transition between questions
    answerReveal: 500,          // Time to show correct answer
    celebrationDelay: 1000,     // Delay before showing celebration
  },
} as const;

// Type helpers
export type TransitionSpeed = keyof typeof TIMING.transition;
export type EasingType = keyof typeof TIMING.easing;

/**
 * Helper to create CSS transition strings
 * Usage: createTransition('background', 'normal', 'smooth')
 *        => 'background 300ms ease-in-out'
 */
export function createTransition(
  property: string,
  speed: TransitionSpeed = 'normal',
  easing: EasingType = 'smooth'
): string {
  return `${property} ${TIMING.transition[speed]} ${TIMING.easing[easing]}`;
}

/**
 * Helper to create multiple CSS transitions
 * Usage: createTransitions([
 *   ['background', 'normal'],
 *   ['transform', 'fast', 'bounce']
 * ])
 */
export function createTransitions(
  transitions: Array<[string, TransitionSpeed?, EasingType?]>
): string {
  return transitions
    .map(([prop, speed = 'normal', ease = 'smooth']) =>
      createTransition(prop, speed, ease)
    )
    .join(', ');
}

/**
 * Sleep utility using TIMING constants
 * Usage: await sleep('medium')
 */
export function sleep(delay: keyof typeof TIMING.delayMs): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, TIMING.delayMs[delay]));
}
