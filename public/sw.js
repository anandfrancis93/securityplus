// Service Worker for Web Push Notifications
// This runs in the background to handle notifications

const CACHE_NAME = 'securityplus-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Open the flashcards study page
  event.waitUntil(
    clients.openWindow('/cybersecurity/flashcards/study')
  );
});

// Handle push events (for future server-sent push notifications)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  const data = event.data ? event.data.json() : {};
  const title = data.title || '📚 Flashcards Due!';
  const options = {
    body: data.body || 'You have flashcards ready for review',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'flashcard-reminder',
    requireInteraction: false,
    data: {
      url: '/cybersecurity/flashcards/study'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Periodic sync for checking due flashcards (future enhancement)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-flashcards') {
    event.waitUntil(checkDueFlashcards());
  }
});

async function checkDueFlashcards() {
  // This will be triggered periodically by the browser
  // For now, we'll handle scheduling from the main app
  console.log('Periodic check for due flashcards');
}
