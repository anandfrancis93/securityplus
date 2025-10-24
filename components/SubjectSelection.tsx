'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppProvider';

export default function SubjectSelection() {
  const router = useRouter();
  const { user, handleSignOut } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const subjects = [
    {
      id: 'cybersecurity',
      name: 'Cybersecurity',
      description: '',
      icon: '🔒',
      color: 'from-green-500 to-green-600',
      path: '/cybersecurity',
      disabled: false,
    },
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
      id: 'english',
      name: 'English',
      description: 'Coming soon',
      icon: '📚',
      color: 'from-yellow-500 to-yellow-600',
      path: '/english',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-end items-center mb-8 relative">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                  {/* User Name */}
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 text-white">
              Learning Hub
            </h1>
            <p className="text-gray-400 text-lg">Select a subject to begin studying</p>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => !subject.disabled && router.push(subject.path)}
              disabled={subject.disabled}
              className={`relative bg-gray-800 rounded-xl p-8 border-2 transition-all duration-300 ${
                subject.disabled
                  ? 'border-gray-700 opacity-50 cursor-not-allowed'
                  : 'border-gray-700 hover:border-white hover:scale-105 cursor-pointer'
              }`}
            >
              {/* Icon */}
              <div className="text-6xl mb-4">{subject.icon}</div>

              {/* Subject Name */}
              <h2 className="text-2xl font-bold mb-2 text-white">
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

      </div>
    </div>
  );
}
