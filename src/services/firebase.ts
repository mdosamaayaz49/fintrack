import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
} as const

// Prevent duplicate initialization during Vite HMR
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const db: Firestore = getFirestore(app)
export const auth: Auth = getAuth(app)

// Messaging is browser-only. Initialized lazily - isSupported() is async and
// will be false in Safari <16, Node.js, and environments without Push API.
export let messaging: Messaging | null = null

isSupported()
  .then((ok) => {
    if (ok) messaging = getMessaging(app)
  })
  .catch(() => {
    // Push notifications unavailable - rest of the app works fine without them
  })

export { app }
