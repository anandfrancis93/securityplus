import React from 'react';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  liquidGlass: boolean;
  /** Additional padding classes (default: p-10 md:p-12) */
  padding?: string;
  /** Show gradient overlays */
  showGradients?: boolean;
  /** Custom gradient colors */
  gradientColors?: {
    primary?: string;
    secondary?: string;
  };
  /** Additional className for the container */
  className?: string;
}

/**
 * Liquid Glass Card Component
 * Reusable card container with optional gradient overlays
 * Used across all pages for consistent card styling
 */
export function LiquidGlassCard({
  children,
  liquidGlass,
  padding = 'p-10 md:p-12',
  showGradients = true,
  gradientColors = {
    primary: 'from-cyan-500/10',
    secondary: 'from-white/10',
  },
  className = '',
}: LiquidGlassCardProps) {
  return (
    <div
      className={`relative ${
        liquidGlass
          ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]'
          : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'
      } ${padding} border ${
        liquidGlass ? 'border-white/10' : 'border-slate-700/50'
      } shadow-2xl overflow-hidden ${className}`}
    >
      {liquidGlass && showGradients && (
        <>
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradientColors.primary} via-transparent to-transparent rounded-[40px] opacity-50`}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradientColors.secondary} via-transparent to-transparent rounded-[40px] opacity-50`}
          />
        </>
      )}

      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Stats Card Component
 * Specialized card for displaying statistics with hover effects
 */
export function StatsCard({
  children,
  liquidGlass,
  hoverColor = 'hover:border-cyan-500/30',
  className = '',
}: {
  children: React.ReactNode;
  liquidGlass: boolean;
  hoverColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative ${
        liquidGlass
          ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]'
          : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'
      } p-6 border ${
        liquidGlass
          ? `border-white/10 hover:border-white/20`
          : `border-slate-700/50 ${hoverColor}`
      } group cursor-help hover:bg-white/10 transition-all duration-700 hover:shadow-xl ${className}`}
    >
      {liquidGlass && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
