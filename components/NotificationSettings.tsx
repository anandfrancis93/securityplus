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
  const { userId } = useApp();
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
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="text-yellow-400">⚠️</div>
          <div>
            <h3 className="font-medium text-gray-300">Notifications Not Supported</h3>
            <p className="text-sm text-gray-400 mt-1">
              Your browser does not support web notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-300">Flashcard Reminders</h3>
            {permission === 'granted' && enabled && (
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {permission === 'granted' && enabled
              ? 'You will be notified when flashcards are due for review.'
              : permission === 'denied'
              ? 'Notifications blocked. Enable in browser settings.'
              : 'Get notified when flashcards need reviewing.'}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={requesting || permission === 'denied'}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            enabled && permission === 'granted'
              ? 'bg-blue-600'
              : 'bg-gray-600'
          } ${
            requesting || permission === 'denied'
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              enabled && permission === 'granted' ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {permission === 'denied' && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-yellow-400">
            To enable notifications, go to your browser settings and allow notifications for this site.
          </p>
        </div>
      )}

      {enabled && permission === 'granted' && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Notifications will be checked every hour while your browser is open.
          </p>
        </div>
      )}
    </div>
  );
}
