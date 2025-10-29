'use client';

import React, { useState, useEffect } from 'react';
import {
  areNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
} from '@/lib/notifications';
import {
  saveNotificationPreference,
  getNotificationPreference,
} from '@/lib/db';
import { useApp } from './AppProvider';

export default function NotificationSettings() {
  const { userId, liquidGlass } = useApp();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const supported = areNotificationsSupported();
      setIsSupported(supported);

      if (supported && userId) {
        setPermission(getNotificationPermission());
        const pref = await getNotificationPreference(userId);
        setEnabled(pref);
      }
    };

    loadSettings();
  }, [userId]);

  const handleToggle = async () => {
    if (!isSupported || !userId) {
      alert('Notifications are not supported in this browser.');
      return;
    }

    if (enabled) {
      // Disable notifications
      setEnabled(false);
      await saveNotificationPreference(userId, false);
      return;
    }

    // Enable notifications - request permission if needed
    setRequesting(true);
    try {
      if (permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          alert('Notification permission was denied. Please enable notifications in your browser settings.');
          setRequesting(false);
          return;
        }
        setPermission('granted');
      }

      // Register service worker
      await registerServiceWorker();

      // Save preference to Firebase
      setEnabled(true);
      await saveNotificationPreference(userId, true);

      alert('Notifications enabled! You will be notified when flashcards are due for review.');
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'} p-12 md:p-16 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} transition-all duration-700`}>
        {liquidGlass && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
        )}
        <div className="relative space-y-6">
          <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'} transition-all duration-700`}>
            <svg className="w-12 h-12 md:w-14 md:h-14 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Notifications Not Supported</h3>
            <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
              Your browser does not support web notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-zinc-900 rounded-3xl'} p-12 md:p-16 border ${liquidGlass ? 'border-white/10' : 'border-zinc-800'} transition-all duration-700`}>
      {liquidGlass && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
      )}

      {/* Active Badge */}
      {permission === 'granted' && enabled && (
        <div className="absolute top-6 right-6">
          <div className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-semibold ${
            liquidGlass ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-emerald-300' : 'bg-emerald-900 border border-emerald-800 rounded-full text-emerald-300'
          }`}>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Active
          </div>
        </div>
      )}

      <div className="relative space-y-6">
        {/* Icon */}
        <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center ${
          liquidGlass ? 'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10' : 'bg-zinc-800 rounded-2xl'
        } transition-all duration-700`}>
          <svg className="w-12 h-12 md:w-14 md:h-14 text-violet-400 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Flashcard Reminders</h3>
          <p className={`text-lg md:text-xl ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
            {permission === 'granted' && enabled
              ? 'You will be notified when flashcards are due for review.'
              : permission === 'denied'
              ? 'Notifications blocked. Enable in browser settings.'
              : 'Get notified when flashcards need reviewing.'}
          </p>

          {/* Toggle Button */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleToggle}
              disabled={requesting || permission === 'denied'}
              className={`relative inline-flex h-12 w-[84px] items-center ${liquidGlass ? 'rounded-[28px]' : 'rounded-full'} transition-all duration-700 focus:outline-none focus:ring-4 ${
                enabled && permission === 'granted'
                  ? liquidGlass ? 'focus:ring-violet-500/30' : 'focus:ring-violet-500/30'
                  : 'focus:ring-white/10'
              } ${
                enabled && permission === 'granted'
                  ? 'bg-violet-500'
                  : liquidGlass ? 'bg-white/10' : 'bg-zinc-700'
              } ${
                requesting || permission === 'denied'
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-lg'
              } ${
                enabled && permission === 'granted' && !requesting
                  ? 'hover:bg-violet-600'
                  : ''
              }`}
            >
              <span
                className={`inline-block h-9 w-9 transform rounded-full bg-white transition-all duration-700 shadow-lg ${
                  enabled && permission === 'granted' ? 'translate-x-[40px]' : 'translate-x-1.5'
                }`}
              />
            </button>
            <span className="text-base md:text-lg font-medium text-white">
              {enabled && permission === 'granted' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Warning for denied permissions */}
        {permission === 'denied' && (
          <div className={`pt-6 mt-6 border-t ${liquidGlass ? 'border-white/10' : 'border-zinc-800'}`}>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-base md:text-lg text-yellow-400 leading-relaxed">
                To enable notifications, go to your browser settings and allow notifications for this site.
              </p>
            </div>
          </div>
        )}

        {/* Info for enabled notifications */}
        {enabled && permission === 'granted' && (
          <div className={`pt-6 mt-6 border-t ${liquidGlass ? 'border-white/10' : 'border-zinc-800'}`}>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-violet-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className={`text-base md:text-lg ${liquidGlass ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
                Notifications will be checked every hour while your browser is open.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
