/**
 * Web Push Notifications for Flashcard Reminders
 *
 * Handles browser notification permissions, service worker registration,
 * and scheduling notifications for due flashcards.
 */

import { FlashcardReview } from './types';
import { getReviewedDueFlashcards } from './spacedRepetition';

// Check if notifications are supported
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Show a notification
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!areNotificationsSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      requireInteraction: false,
      ...options
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Check for due flashcards and send notification
// Only notifies for cards that have been reviewed at least once (excludes new/unreviewed cards)
export async function checkAndNotifyDueFlashcards(
  reviews: FlashcardReview[]
): Promise<void> {
  const dueCards = getReviewedDueFlashcards(reviews);

  if (dueCards.length > 0) {
    const title = '📚 Flashcards Due for Review!';
    const body =
      dueCards.length === 1
        ? '1 flashcard is ready for review'
        : `${dueCards.length} flashcards are ready for review`;

    await showNotification(title, {
      body,
      tag: 'flashcard-reminder',
      data: {
        url: '/cybersecurity/flashcards/study',
        count: dueCards.length
      }
    });
  }
}

// Schedule periodic checks for due flashcards
export function schedulePeriodicCheck(
  callback: () => void,
  intervalMinutes: number = 60
): number {
  // Check immediately
  callback();

  // Then check every intervalMinutes
  const intervalId = window.setInterval(callback, intervalMinutes * 60 * 1000);
  return intervalId;
}

// Clear scheduled checks
export function clearPeriodicCheck(intervalId: number): void {
  window.clearInterval(intervalId);
}
