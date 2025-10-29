import React from 'react';

interface LiquidGlassBackgroundProps {
  children: React.ReactNode;
  /** Custom gradient colors for the animated orbs */
  colors?: {
    top?: string;
    bottom?: string;
    center?: string;
  };
  /** Additional className for the container */
  className?: string;
}

/**
 * Liquid Glass Background Component
 * Provides the animated gradient background with glowing orbs
 * Used across all pages for consistent styling
 */
export function LiquidGlassBackground({
  children,
  colors = {
    top: 'bg-cyan-500/10',
    bottom: 'bg-violet-500/10',
    center: 'bg-emerald-500/5',
  },
  className = '',
}: LiquidGlassBackgroundProps) {
  return (
    <div className={`min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-black ${className}`}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] ${colors.top} rounded-full blur-3xl animate-pulse`} />
        <div
          className={`absolute bottom-0 right-1/4 w-[600px] h-[600px] ${colors.bottom} rounded-full blur-3xl animate-pulse`}
          style={{ animationDelay: '1s' }}
        />
        <div
          className={`absolute top-1/2 left-1/2 w-[600px] h-[600px] ${colors.center} rounded-full blur-3xl animate-pulse`}
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

/**
 * Simple Background Component (non-liquid glass mode)
 * For users who prefer the simpler dark background
 */
export function SimpleBackground({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-screen text-white bg-black ${className}`}>
      {children}
    </div>
  );
}

/**
 * Adaptive Background Component
 * Automatically switches between liquid glass and simple based on user preference
 */
export function AdaptiveBackground({
  children,
  liquidGlass,
  colors,
  className = '',
}: {
  children: React.ReactNode;
  liquidGlass: boolean;
  colors?: LiquidGlassBackgroundProps['colors'];
  className?: string;
}) {
  if (liquidGlass) {
    return (
      <LiquidGlassBackground colors={colors} className={className}>
        {children}
      </LiquidGlassBackground>
    );
  }

  return (
    <SimpleBackground className={className}>
      {children}
    </SimpleBackground>
  );
}
