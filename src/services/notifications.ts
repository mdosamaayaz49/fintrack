import { getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { messaging } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string

/**
 * Requests notification permission from the browser.
 * Returns the permission state after the request.
 *
 * SECURITY NOTE: Only call this in response to a user gesture (button click).
 * Browsers block permission requests triggered automatically on page load.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

/**
 * Retrieves the FCM registration token for this browser/device.
 *
 * Prerequisites:
 *  1. `public/firebase-messaging-sw.js` must exist and be served at the root.
 *  2. Notification permission must be granted.
 *  3. VITE_FIREBASE_VAPID_KEY must be set.
 *
 * NOTE: `firebase-messaging-sw.js` is a Phase 4 (PWA) deliverable.
 * This function returns null until that service worker is deployed.
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) return null

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return null

  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    return token || null
  } catch (error) {
    console.error('[FinTrack FCM] Failed to get token:', error)
    return null
  }
}

/**
 * Saves the FCM token to the user's Firestore document.
 * Cloud Functions use this token to send targeted push notifications.
 */
export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { fcmToken: token })
}

/**
 * Initializes FCM for the current user: requests permission, retrieves the
 * token, and persists it to Firestore. Call once after the user signs in.
 */
export async function initializeFCM(userId: string): Promise<void> {
  const token = await getFCMToken()
  if (token) {
    await saveFCMTokenToFirestore(userId, token)
  }
}

/**
 * Subscribe to foreground push messages (app is open in browser tab).
 * Background messages are handled by `firebase-messaging-sw.js`.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): (() => void) | null {
  if (!messaging) return null
  return onMessage(messaging, handler)
}
