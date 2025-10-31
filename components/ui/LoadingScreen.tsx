import React from 'react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

/**
 * Loading Screen Component
 * Displays a loading animation with graduation cap icon
 * Used across all pages for consistent loading states
 */
export function LoadingScreen({
  message = 'Loading...',
  submessage = 'Please wait',
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          {/* Modern card */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-16 md:p-20 shadow-xl">
            <div className="relative text-center">
              {/* Animated icon */}
              <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-8">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 animate-spin">
                  <div className="w-full h-full rounded-full border-4 border-transparent border-t-cyan-400 border-r-cyan-400/50"></div>
                </div>
                {/* Center icon - graduation cap */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 md:w-20 md:h-20 text-cyan-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {message}
              </p>
              <p className="text-base md:text-lg mt-4 text-zinc-400">
                {submessage}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
