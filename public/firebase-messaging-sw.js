/**
 * Firebase Cloud Messaging Service Worker
 *
 * This file MUST be served from the web root (/) to receive background push
 * notifications when the app is not in the foreground.
 *
 * Firebase SDK is imported via CDN compat scripts (importScripts) because
 * service workers cannot use ES module bundling at runtime.
 *
 * ⚠️  IMPORTANT: Keep the Firebase SDK version in sync with the version used
 *     in src/services/firebase.ts.  Check with:
 *       node -e "console.log(require('./node_modules/firebase/package.json').version)"
 */

// ── Firebase SDK (compat layer for service workers) ─────────────────────────
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js')

// ── App config (must match .env.local / src/services/firebase.ts) ────────────
// These values are NOT secrets — they are safe to embed in a public SW.
const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__,
  authDomain: self.__FIREBASE_AUTH_DOMAIN__,
  projectId: self.__FIREBASE_PROJECT_ID__,
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__,
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__,
  appId: self.__FIREBASE_APP_ID__,
}

// Guard against double-init when the SW is updated
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

const messaging = firebase.messaging()

// ── Background message handler ───────────────────────────────────────────────
/**
 * Fired when a push message arrives and the app is NOT in the foreground.
 * The payload matches the structure sent by your Cloud Functions / FCM HTTP v1 API.
 *
 * Notification format expected in the FCM data payload:
 *   { title, body, icon, badge, tag, data: { url } }
 */
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification ?? {}
  const data = payload.data ?? {}

  const title = notification.title ?? data.title ?? 'FinTrack'
  const body = notification.body ?? data.body ?? 'You have a new notification'
  const icon = notification.icon ?? '/pwa-192x192.png'
  const badge = '/pwa-192x192.png'
  const tag = data.tag ?? 'fintrack-notification'
  const url = data.url ?? '/'

  self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag,
    // Replaces any existing notification with the same tag (avoids stacking)
    renotify: false,
    data: { url },
  })
})

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  // Focus an existing FinTrack window or open a new one
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      }),
  )
})
