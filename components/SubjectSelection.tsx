'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';

export default function SubjectSelection() {
  const router = useRouter();
  const { user, handleSignOut } = useApp();

  const subjects = [
    {
      id: 'maths',
      name: 'Mathematics',
      description: 'Coming soon',
      icon: '📐',
      color: 'from-blue-500 to-blue-600',
      path: '/maths',
      disabled: true,
    },
    {
      id: 'physics',
      name: 'Physics',
      description: 'Coming soon',
      icon: '⚛️',
      color: 'from-red-500 to-red-600',
      path: '/physics',
      disabled: true,
    },
    {
      id: 'cybersecurity',
      name: 'Cybersecurity',
      description: '',
      icon: '🔒',
      color: 'from-green-500 to-green-600',
      path: '/cybersecurity',
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {user && !user.isAnonymous && (
                <div className="text-sm text-gray-400">
                  {user.displayName ? (
                    <span>👤 {user.displayName}</span>
                  ) : (
                    <span>👤 Signed in</span>
                  )}
                </div>
              )}
            </div>
            {user && !user.isAnonymous && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to sign out?')) {
                    await handleSignOut();
                  }
                }}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-green-500 to-yellow-500 bg-clip-text text-transparent">
              Learning Hub
            </h1>
            <p className="text-gray-400 text-lg">Select a subject to begin studying</p>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => !subject.disabled && router.push(subject.path)}
              disabled={subject.disabled}
              className={`relative bg-gray-800 rounded-xl p-8 border-2 transition-all duration-300 ${
                subject.disabled
                  ? 'border-gray-700 opacity-50 cursor-not-allowed'
                  : 'border-gray-700 hover:border-gray-600 hover:scale-105 hover:shadow-2xl cursor-pointer'
              }`}
            >
              {/* Icon */}
              <div className="text-6xl mb-4">{subject.icon}</div>

              {/* Subject Name */}
              <h2
                className={`text-2xl font-bold mb-2 bg-gradient-to-r ${subject.color} bg-clip-text text-transparent`}
              >
                {subject.name}
              </h2>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4">{subject.description}</p>

              {/* Coming Soon Badge */}
              {subject.disabled && (
                <div className="absolute top-4 right-4">
                  <span className="bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Arrow Icon for Available Subjects */}
              {!subject.disabled && (
                <div className="absolute bottom-4 right-4">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-gray-300 mb-2">Welcome to Learning Hub</h3>
          <p className="text-gray-400 text-sm">
            Choose a subject above to access practice quizzes, flashcards, and study materials.
            More subjects will be added soon!
          </p>
        </div>
      </div>
    </div>
  );
}
